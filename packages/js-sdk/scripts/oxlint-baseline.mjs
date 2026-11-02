// Ratchet for lint violations that predate a rule. Two generated files, both committed:
//
//   .oxlint-baseline-counts.json  For each rule and file, how many violations exist. This is the ratchet.
//   .oxlint-baseline.json         Derived from the counts: exempts each listed file from that rule so
//                                 editors stay quiet about old code. .oxlintrc.json extends it.
//
//   node scripts/oxlint-baseline.mjs --check --fast [files...]
//       `npm run lint`: native rules, exact per rule and file, seconds.
//   node scripts/oxlint-baseline.mjs --check [--base <ref>] [--allow-base-growth]
//       CI: every rule, type-aware ones included. Fails on a count that went up, on fixed violations
//       not locked in yet, and on a .oxlint-baseline.json that does not match the counts. With --base it
//       also fails when the counts grew, or the lint config or local plugins changed, compared to <ref>,
//       unless --allow-base-growth is passed (CI passes it for a PR labeled lint-baseline-growth).
//   node scripts/oxlint-baseline.mjs [--allow-growth]
//       After fixing violations: rewrite both files. Refuses to grow them unless --allow-growth, which is
//       only for a newly enabled rule. A renamed or moved file keeps its allowance.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const CONFIG = ".oxlintrc.json";
const BASELINE = ".oxlint-baseline.json";
const COUNTS = ".oxlint-baseline-counts.json";
const PLUGINS = "oxlint-plugins";
const LINT_PATHS = ["."];
const LABEL = "lint-baseline-growth";
const EXTENDS_LINE = /^[ \t]*"extends": \["\.\/\.oxlint-baseline\.json"\],\r?\n/m;
const MAX_UNCHANGED_SHOWN = 5;

// The pinned local binary, run with this Node: npx is not on PATH without a shell on Windows, and with
// no local install it would fetch whatever oxlint version is newest.
const OXLINT = path.join(path.dirname(createRequire(import.meta.url).resolve("oxlint/package.json")), "bin/oxlint");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = ({ flag }) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
};
const baseRef = valueOf({ flag: "--base" });
const toRepoPath = ({ file }) => path.relative(process.cwd(), path.resolve(file)).split(path.sep).join("/");
const files = args.filter((arg) => !arg.startsWith("--") && arg !== baseRef).map((file) => toRepoPath({ file }));

const git = ({ gitArgs }) => spawnSync("git", gitArgs, { encoding: "utf8", maxBuffer: 1024 ** 3 });

// Lint as if nothing were baselined, through a per-process copy of the config without the baseline, so
// the committed files are never touched and concurrent runs do not share a temp file.
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

// Every rule and file whose count in `current` is above the one in `allowed`. A file that is gone from
// disk and from `current` hands its allowance to files that are new for that rule, so a rename or move
// is not growth.
const findGrowth = ({ current, allowed }) =>
  Object.entries(current).flatMap(([rule, counts]) => {
    const previous = allowed[rule] ?? {};
    let pool = Object.entries(previous)
      .filter(([file]) => !(file in counts) && !existsSync(file))
      .reduce((sum, [, count]) => sum + count, 0);
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([file, count]) => {
        let allowance = previous[file] ?? 0;
        if (!(file in previous) && pool > 0) {
          allowance = Math.min(pool, count);
          pool -= allowance;
        }
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

// Lines added or changed since `ref` (all lines for a file git does not track), to point at new code.
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
  for (const { rule, file, count, allowed } of growth) {
    console.error(`${file}: ${rule}, ${count} violation(s) where ${allowed} existed`);
    const changed = changedLines({ file, ref });
    const found = diagnostics.filter((d) => d.filename === file && ruleName({ diagnostic: d }) === rule);
    const isNew = (d) => changed === null || changed.has(lineOf({ diagnostic: d }));
    for (const d of found.filter(isNew)) console.error(`  > ${file}:${lineOf({ diagnostic: d })} ${d.message}`);
    const unchanged = found.filter((d) => !isNew(d));
    for (const d of unchanged.slice(0, MAX_UNCHANGED_SHOWN)) {
      console.error(`    ${file}:${lineOf({ diagnostic: d })} ${d.message}`);
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

// Counts the committed baseline covered at `ref`, or null when the baseline did not exist there yet.
// `./` makes the path relative to this package rather than the repository root.
const countsAt = ({ ref }) => {
  if (git({ gitArgs: ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`] }).status !== 0) {
    throw new Error(`--base ${ref} is not a commit this checkout has; fetch it first`);
  }
  if (git({ gitArgs: ["cat-file", "-e", `${ref}:./${COUNTS}`] }).status !== 0) return null;
  return JSON.parse(git({ gitArgs: ["show", `${ref}:./${COUNTS}`] }).stdout);
};

const lintArgs = has("--fast") ? (files.length > 0 ? files : LINT_PATHS) : ["--type-aware", ...LINT_PATHS];
const diagnostics = lintUnbaselined({ lintArgs });

const uncounted = diagnostics.filter((diagnostic) => ruleName({ diagnostic }) === null);
if (uncounted.length > 0) {
  console.error("These cannot be baselined (parse errors or stale disable comments). Fix them:\n");
  for (const d of uncounted) console.error(`  ${d.filename}:${lineOf({ diagnostic: d })} ${d.message}`);
  process.exit(1);
}

const committed = existsSync(COUNTS) ? JSON.parse(readFileSync(COUNTS, "utf8")) : {};
const current = countViolations({ diagnostics });
const growth = findGrowth({ current, allowed: committed });

if (has("--check")) {
  const failures = [];
  if (growth.length > 0) {
    console.error("New lint violations. Fix them: the baseline only covers code that predates a rule.\n");
    printGrowth({ growth, diagnostics, ref: baseRef ?? "HEAD" });
    failures.push("new violations");
  }
  if (!has("--fast")) {
    const fixed = findFixed({ current, committed });
    if (fixed.length > 0) {
      console.error(`\n${fixed.length} rule/file count(s) went down. Run npm run lint:baseline to lock the fixes in:`);
      for (const { rule, file, count, committed: was } of fixed.slice(0, 20))
        console.error(`  ${file}: ${rule} ${was} -> ${count}`);
      failures.push("fixes not locked in");
    }
    if (
      JSON.stringify(baselineFor({ counts: committed })) !== JSON.stringify(JSON.parse(readFileSync(BASELINE, "utf8")))
    ) {
      console.error(`\n${BASELINE} does not match ${COUNTS}. Run npm run lint:baseline; do not edit either by hand.`);
      failures.push("baseline mismatch");
    }
  }
  if (baseRef && !has("--allow-base-growth")) {
    const base = countsAt({ ref: baseRef });
    if (base) {
      const baselineGrowth = findGrowth({ current: committed, allowed: base });
      if (baselineGrowth.length > 0) {
        console.error(`\n${COUNTS} grew compared to ${baseRef}:`);
        for (const { rule, file, count, allowed } of baselineGrowth)
          console.error(`  ${file}: ${rule} ${allowed} -> ${count}`);
        failures.push("baseline grew");
      }
      if (git({ gitArgs: ["diff", "--quiet", baseRef, "--", CONFIG, PLUGINS] }).status !== 0) {
        console.error(`\n${CONFIG} or ${PLUGINS}/ changed compared to ${baseRef}.`);
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
  if (growth.length > 0 && !has("--allow-growth")) {
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
