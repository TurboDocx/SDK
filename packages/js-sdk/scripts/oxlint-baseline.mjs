// Ratchet for lint violations that predate a rule. Two generated files, both committed:
//
//   .oxlint-baseline-counts.json  For each rule and file, how many violations exist. This is the ratchet.
//   .oxlint-baseline.json         Derived from the counts: exempts each listed file from that rule so
//                                 editors stay quiet about old code. .oxlintrc.json extends it.
//
//   node scripts/oxlint-baseline.mjs --check --fast [files...]
//       `npm run lint`: native rules, exact per rule and file, seconds.
//   node scripts/oxlint-baseline.mjs --check [--base <ref>] [--allow-base-growth]
//       CI: every rule, type-aware ones included. Fails on a count that went up, on fixed violations not
//       locked in yet in files this change touched, and on a .oxlint-baseline.json that does not match the
//       counts. With --base it also fails when the counts grew, or the lint rules changed (.oxlintrc.json,
//       oxlint-plugins/, this script, the lint scripts in package.json), compared to <ref>, unless
//       --allow-base-growth is passed (CI passes it for a PR labeled lint-baseline-growth).
//   node scripts/oxlint-baseline.mjs [--allow-growth]
//       After fixing violations: rewrite both files from a full run. Refuses to grow them unless
//       --allow-growth, which is only for a newly enabled rule. A file git sees as renamed (git mv) keeps
//       its allowance.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs } from "node:util";

const CONFIG = ".oxlintrc.json";
const BASELINE = ".oxlint-baseline.json";
const COUNTS = ".oxlint-baseline-counts.json";
const PLUGINS = "oxlint-plugins";
const SCRIPT = "scripts/oxlint-baseline.mjs";
const LINT_PATHS = ["."];
const LABEL = "lint-baseline-growth";
const EXTENDS_LINE = /^[ \t]*"extends": \["\.\/\.oxlint-baseline\.json"\],\r?\n/m;
const MAX_UNCHANGED_SHOWN = 5;
const MAX_FIXED_SHOWN = 20;

// The pinned local binary, run with this Node: npx is not on PATH without a shell on Windows, and with no
// local install it would fetch whatever oxlint version is newest.
const OXLINT = path.join(path.dirname(createRequire(import.meta.url).resolve("oxlint/package.json")), "bin/oxlint");

const { values: options, positionals } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    fast: { type: "boolean", default: false },
    base: { type: "string" },
    "allow-growth": { type: "boolean", default: false },
    "allow-base-growth": { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: true,
});
const baseRef = options.base ?? null;
const diffRef = baseRef ?? "HEAD";
const toRepoPath = ({ file }) => path.relative(process.cwd(), path.resolve(file)).split(path.sep).join("/");
const files = positionals.map((file) => toRepoPath({ file }));
if (!options.check && (options.fast || files.length > 0)) {
  throw new Error("Regenerating needs a full run: drop --fast and the file arguments");
}

// This package is a subdirectory of the repository: git diff takes --relative and a `<ref>:./path`
// is relative to this package rather than the repository root.
const git = ({ gitArgs }) => spawnSync("git", gitArgs, { encoding: "utf8", maxBuffer: 1024 ** 3 });

// Lint as if nothing were baselined, through a per-process copy of the config without the baseline, so the
// committed files are never touched and concurrent runs do not share a temp file.
const lintUnbaselined = ({ lintArgs }) => {
  const config = readFileSync(CONFIG, "utf8");
  if (!EXTENDS_LINE.test(config)) throw new Error(`${CONFIG} must extend ./${BASELINE} on its own line`);
  const tempConfig = `.oxlintrc.unbaselined-${process.pid}.json`;
  writeFileSync(tempConfig, config.replace(EXTENDS_LINE, ""));
  try {
    const { stdout, stderr, status, error } = spawnSync(
      process.execPath,
      [OXLINT, "-c", tempConfig, "-f", "json", "--no-error-on-unmatched-pattern", ...lintArgs],
      { encoding: "utf8", maxBuffer: 1024 ** 3 }
    );
    if (error) throw error;
    let report = null;
    try {
      report = JSON.parse(stdout);
    } catch {
      // oxlint printed an error instead of a report; it is shown below.
    }
    if (!report || (status !== 0 && status !== 1)) {
      throw new Error(`oxlint failed (exit ${status}):\n${stdout}\n${stderr}`.trim());
    }
    return report.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      filename: toRepoPath({ file: diagnostic.filename }),
    }));
  } finally {
    rmSync(tempConfig, { force: true });
  }
};

// "eslint(no-console)" -> "no-console"; "typescript(no-explicit-any)" -> "typescript/no-explicit-any"
const ruleName = ({ diagnostic }) => {
  const [, scope, rule] = diagnostic.code?.match(/^(.+?)\((.+)\)$/) ?? [];
  if (!rule) return null;
  return scope === "eslint" ? rule : `${scope}/${rule}`;
};

const lineOf = ({ diagnostic }) => diagnostic.labels?.[0]?.span?.line ?? 0;

const countViolations = ({ diagnostics }) => {
  const counts = {};
  for (const diagnostic of diagnostics) {
    const rule = ruleName({ diagnostic });
    counts[rule] ??= {};
    counts[rule][diagnostic.filename] = (counts[rule][diagnostic.filename] ?? 0) + 1;
  }
  return counts;
};

// Files git sees as renamed or moved since `ref` (staged or committed): new path -> old path.
const renamesSince = ({ ref }) => {
  const { stdout, status } = git({ gitArgs: ["diff", "-M", "--name-status", "--no-color", "--relative", ref] });
  if (status !== 0) return new Map();
  return new Map(
    stdout
      .split("\n")
      .filter((line) => line.startsWith("R"))
      .map((line) => line.split("\t"))
      .map(([, from, to]) => [to, from])
  );
};

// Every rule and file whose count in `current` is above the one in `allowed`. A renamed file keeps the
// allowance of its old path, as long as the old path no longer has violations of its own.
const findGrowth = ({ current, allowed, renames }) =>
  Object.entries(current).flatMap(([rule, counts]) => {
    const previous = allowed[rule] ?? {};
    return Object.entries(counts).flatMap(([file, count]) => {
      const from = renames.get(file);
      const inherited = from && !(from in counts) ? previous[from] ?? 0 : 0;
      const allowance = (previous[file] ?? 0) + inherited;
      return count > allowance ? [{ rule, file, count, allowed: allowance }] : [];
    });
  });

// Every rule and file whose count went down without the counts file being updated.
const findFixed = ({ current, committed }) =>
  Object.entries(committed).flatMap(([rule, counts]) =>
    Object.entries(counts)
      .filter(([file, count]) => (current[rule]?.[file] ?? 0) < count)
      .map(([file, count]) => ({ rule, file, count: current[rule]?.[file] ?? 0, committed: count }))
  );

// Files added, changed, renamed or deleted since `ref`, untracked files included. A renamed file lists
// both paths (--no-renames), so its old path's lower count must be locked in before merge, moving the
// counts to the new path; otherwise the branch it merges into would see the new path as growth.
const changedFilesSince = ({ ref }) => {
  const tracked = git({ gitArgs: ["diff", "--name-only", "--no-renames", "--no-color", "--relative", ref] }).stdout;
  const untracked = git({ gitArgs: ["ls-files", "--others", "--exclude-standard"] }).stdout;
  return new Set(`${tracked}\n${untracked}`.split("\n").filter(Boolean));
};

// Lines added or changed since `ref` (null when git cannot say, which marks every line as new).
const changedLines = ({ file, ref }) => {
  const { stdout, status } = git({ gitArgs: ["diff", "-U0", "--no-color", ref, "--", file] });
  if (status !== 0) return null;
  if (!stdout && git({ gitArgs: ["ls-files", "--error-unmatch", file] }).status !== 0) return null;
  const lines = new Set();
  for (const [, start, length = "1"] of stdout.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    for (let line = Number(start); line < Number(start) + Number(length); line += 1) lines.add(line);
  }
  return lines;
};

const printGrowth = ({ growth, diagnostics, ref }) => {
  const byFileAndRule = new Map();
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.filename}\0${ruleName({ diagnostic })}`;
    if (!byFileAndRule.has(key)) byFileAndRule.set(key, []);
    byFileAndRule.get(key).push(diagnostic);
  }
  const linesByFile = new Map();
  for (const { rule, file, count, allowed } of growth) {
    console.error(`${file}: ${rule}, ${count} violation(s) where ${allowed} existed`);
    if (!linesByFile.has(file)) linesByFile.set(file, changedLines({ file, ref }));
    const changed = linesByFile.get(file);
    const isNew = ({ diagnostic }) => changed === null || changed.has(lineOf({ diagnostic }));
    const found = byFileAndRule.get(`${file}\0${rule}`) ?? [];
    for (const diagnostic of found.filter((d) => isNew({ diagnostic: d }))) {
      console.error(`  > ${file}:${lineOf({ diagnostic })} ${diagnostic.message}`);
    }
    const unchanged = found.filter((d) => !isNew({ diagnostic: d }));
    for (const diagnostic of unchanged.slice(0, MAX_UNCHANGED_SHOWN)) {
      console.error(`    ${file}:${lineOf({ diagnostic })} ${diagnostic.message}`);
    }
    if (unchanged.length > MAX_UNCHANGED_SHOWN) {
      console.error(`    ...and ${unchanged.length - MAX_UNCHANGED_SHOWN} more on lines this change did not touch`);
    }
  }
};

const total = ({ counts }) =>
  Object.values(counts).reduce((sum, perFile) => sum + Object.values(perFile).reduce((a, b) => a + b, 0), 0);

// Stable key order so a regenerated file only differs where the violations did.
const sortDeep = ({ value }) =>
  Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, typeof value[key] === "object" ? sortDeep({ value: value[key] }) : value[key]])
  );

// Baseline paths are globs in the config, so escape every glob metacharacter.
const escapeGlob = ({ file }) => file.replace(/[[\]{}?*\\]/g, "\\$&");

const baselineFor = ({ counts }) => ({
  overrides: Object.keys(counts)
    .sort()
    .map((rule) => ({
      files: Object.keys(counts[rule])
        .sort()
        .map((file) => escapeGlob({ file })),
      rules: { [rule]: "off" },
    })),
});

// The package.json entries that decide how lint runs.
const lintScripts = ({ packageJson }) => {
  const { scripts = {}, "lint-staged": lintStaged = null } = JSON.parse(packageJson);
  const entries = Object.entries(scripts)
    .filter(([name]) => /^(pre|post)?lint/.test(name))
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify({ scripts: entries, lintStaged });
};

const lintRulesChangedSince = ({ ref }) => {
  if (git({ gitArgs: ["diff", "--quiet", ref, "--", CONFIG, PLUGINS, SCRIPT] }).status !== 0) return true;
  const before = git({ gitArgs: ["show", `${ref}:./package.json`] });
  if (before.status !== 0) return true;
  return (
    lintScripts({ packageJson: before.stdout }) !== lintScripts({ packageJson: readFileSync("package.json", "utf8") })
  );
};

// Counts the committed baseline covered at `ref`, or null when the baseline did not exist there yet.
const countsAt = ({ ref }) => {
  if (git({ gitArgs: ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`] }).status !== 0) {
    throw new Error(`--base ${ref} is not a commit this checkout has; fetch it first`);
  }
  if (git({ gitArgs: ["cat-file", "-e", `${ref}:./${COUNTS}`] }).status !== 0) return null;
  return JSON.parse(git({ gitArgs: ["show", `${ref}:./${COUNTS}`] }).stdout);
};

const lintArgs = options.fast ? (files.length > 0 ? files : LINT_PATHS) : ["--type-aware", ...LINT_PATHS];
const diagnostics = lintUnbaselined({ lintArgs });

const uncounted = diagnostics.filter((diagnostic) => ruleName({ diagnostic }) === null);
if (uncounted.length > 0) {
  console.error("These cannot be baselined (parse errors or stale disable comments). Fix them:\n");
  for (const diagnostic of uncounted)
    console.error(`  ${diagnostic.filename}:${lineOf({ diagnostic })} ${diagnostic.message}`);
  process.exit(1);
}

const committed = existsSync(COUNTS) ? JSON.parse(readFileSync(COUNTS, "utf8")) : {};
const current = countViolations({ diagnostics });
const renames = renamesSince({ ref: diffRef });
const growth = findGrowth({ current, allowed: committed, renames });

if (options.check) {
  const failures = [];
  if (growth.length > 0) {
    console.error("New lint violations. Fix them: the baseline only covers code that predates a rule.\n");
    printGrowth({ growth, diagnostics, ref: diffRef });
    failures.push("new violations");
  }
  if (!options.fast) {
    // Enforced for files this change touched. Elsewhere a count can drop with no edit (a type change in an
    // imported module, or two merged fixes to one file), and a later change should not fail for that.
    const touched = changedFilesSince({ ref: diffRef });
    const fixed = findFixed({ current, committed });
    const fixedHere = fixed.filter(({ file }) => touched.has(file));
    if (fixedHere.length > 0) {
      console.error(
        `\n${fixedHere.length} rule/file count(s) went down. Run npm run lint:baseline to lock the fixes in:`
      );
      for (const { rule, file, count, committed: was } of fixedHere.slice(0, MAX_FIXED_SHOWN)) {
        console.error(`  ${file}: ${rule} ${was} -> ${count}`);
      }
      failures.push("fixes not locked in");
    } else if (fixed.length > 0) {
      console.log(`${fixed.length} rule/file count(s) went down elsewhere; npm run lint:baseline would lock them in.`);
    }
    if (
      JSON.stringify(baselineFor({ counts: committed })) !== JSON.stringify(JSON.parse(readFileSync(BASELINE, "utf8")))
    ) {
      console.error(`\n${BASELINE} does not match ${COUNTS}. Run npm run lint:baseline; do not edit either by hand.`);
      failures.push("baseline mismatch");
    }
  }
  if (baseRef && !options["allow-base-growth"]) {
    const base = countsAt({ ref: baseRef });
    if (base) {
      const baselineGrowth = findGrowth({ current: committed, allowed: base, renames });
      if (baselineGrowth.length > 0) {
        console.error(`\n${COUNTS} grew compared to ${baseRef}:`);
        for (const { rule, file, count, allowed } of baselineGrowth)
          console.error(`  ${file}: ${rule} ${allowed} -> ${count}`);
        failures.push("baseline grew");
      }
      if (lintRulesChangedSince({ ref: baseRef })) {
        console.error(
          `\nThe lint rules (${CONFIG}, ${PLUGINS}/, ${SCRIPT} or the lint scripts) changed compared to ${baseRef}.`
        );
        failures.push("lint rules changed");
      }
      if (failures.includes("baseline grew") || failures.includes("lint rules changed")) {
        console.error(`If that is intended (turning a rule on or off), add the ${LABEL} label to the pull request.`);
      }
    }
  }
  if (failures.length > 0) process.exit(1);
  console.log("No new lint violations.");
} else {
  if (growth.length > 0 && !options["allow-growth"]) {
    console.error("Refusing to grow the baseline. Fix these instead:\n");
    printGrowth({ growth, diagnostics, ref: "HEAD" });
    process.exit(1);
  }
  writeFileSync(BASELINE, `${JSON.stringify(baselineFor({ counts: current }), null, 2)}\n`);
  writeFileSync(COUNTS, `${JSON.stringify(sortDeep({ value: current }), null, 2)}\n`);
  console.log(
    `${COUNTS}: ${total({ counts: current })} violations in ${Object.keys(current).length} rules (was ${total({
      counts: committed,
    })})`
  );
}
