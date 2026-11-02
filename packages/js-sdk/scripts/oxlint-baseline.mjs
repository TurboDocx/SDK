// Ratchet for lint violations that predate a rule. Two generated files, both committed:
//
//   .oxlint-baseline.json         For each rule, the files that already break it. .oxlintrc.json extends
//                                 it, so editors and `npm run lint` stay quiet about old code.
//   .oxlint-baseline-counts.json  For each rule and file, how many violations exist. `--check` fails when
//                                 any count goes up, so a listed file cannot gain new violations either.
//
//   node scripts/oxlint-baseline.mjs                  after fixing violations: shrink both files
//   node scripts/oxlint-baseline.mjs --check          fail on any violation the counts do not cover
//   node scripts/oxlint-baseline.mjs --check --base <ref>
//                                                     CI on a pull request: also fail if the committed
//                                                     counts grew compared to <ref>, unless
//                                                     --allow-base-growth is passed (CI passes it when
//                                                     the PR carries the lint-baseline-growth label)
//   node scripts/oxlint-baseline.mjs --allow-growth   regenerate even though counts grow; only for turning
//                                                     on a new rule
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const CONFIG = ".oxlintrc.json";
const BASELINE = ".oxlint-baseline.json";
const COUNTS = ".oxlint-baseline-counts.json";
const UNBASELINED_CONFIG = ".oxlintrc.unbaselined.json"; // gitignored, removed after every run
const EXTENDS_LINE = /^\s*"extends": \["\.\/\.oxlint-baseline\.json"\],\n/m;
const LINT_ARGS = ["--type-aware", "-f", "json", "."];

const args = process.argv.slice(2);
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : null;

// "eslint(no-console)" -> "no-console"; "typescript(no-explicit-any)" -> "typescript/no-explicit-any"
const ruleName = ({ diagnostic }) => {
  const [, scope, rule] = diagnostic.code?.match(/^(.+?)\((.+)\)$/) ?? [];
  if (!rule) throw new Error(`${diagnostic.filename}: ${diagnostic.message} (cannot be baselined, fix it first)`);
  return scope === "eslint" ? rule : `${scope.replace("_", "-")}/${rule}`;
};

// Lint as if nothing were baselined, without touching the committed files: a failed or interrupted run
// leaves them as they were.
const lintUnbaselined = () => {
  const config = readFileSync(CONFIG, "utf8");
  if (!EXTENDS_LINE.test(config)) throw new Error(`${CONFIG} must extend ./${BASELINE} on its own line`);
  writeFileSync(UNBASELINED_CONFIG, config.replace(EXTENDS_LINE, ""));
  try {
    const { stdout, stderr, status, error } = spawnSync("npx", ["oxlint", "-c", UNBASELINED_CONFIG, ...LINT_ARGS], {
      encoding: "utf8",
      maxBuffer: 1024 ** 3,
    });
    if (error) throw error;
    if (status !== 0 && status !== 1) throw new Error(`oxlint exited with status ${status}\n${stderr}`);
    return JSON.parse(stdout).diagnostics;
  } finally {
    rmSync(UNBASELINED_CONFIG, { force: true });
  }
};

const countViolations = ({ diagnostics }) => {
  const counts = {};
  for (const diagnostic of diagnostics) {
    const rule = ruleName({ diagnostic });
    counts[rule] ??= {};
    counts[rule][diagnostic.filename] = (counts[rule][diagnostic.filename] ?? 0) + 1;
  }
  return counts;
};

// Every rule and file whose count in `current` is above the one in `allowed`.
const findGrowth = ({ current, allowed }) =>
  Object.entries(current).flatMap(([rule, files]) =>
    Object.entries(files)
      .filter(([file, count]) => count > (allowed[rule]?.[file] ?? 0))
      .map(([file, count]) => ({ rule, file, count, allowed: allowed[rule]?.[file] ?? 0 }))
  );

const printGrowth = ({ growth, diagnostics }) => {
  for (const { rule, file, count, allowed } of growth) {
    console.error(`${file}: ${rule}, ${count} violation(s) where ${allowed} existed`);
    for (const diagnostic of diagnostics.filter((d) => d.filename === file && ruleName({ diagnostic: d }) === rule)) {
      const line = diagnostic.labels?.[0]?.span?.line ?? "?";
      console.error(`  ${file}:${line} ${diagnostic.message}`);
    }
  }
};

const total = ({ counts }) =>
  Object.values(counts).reduce((sum, files) => sum + Object.values(files).reduce((a, b) => a + b, 0), 0);

// Stable key order so a regenerated file only differs where the violations did.
const sortDeep = ({ value }) =>
  Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, typeof value[key] === "object" ? sortDeep({ value: value[key] }) : value[key]])
  );

// Baseline paths are globs in the config, so escape the route-param brackets in pages/[id].tsx.
const escapeGlob = ({ file }) => file.replace(/[[\]]/g, "\\$&");

// Counts the committed baseline covered at `ref`, or null when the baseline did not exist there yet.
// `./` makes the path relative to this package, not the repository root.
const countsAt = ({ ref }) => {
  const { stdout, status } = spawnSync("git", ["show", `${ref}:./${COUNTS}`], { encoding: "utf8", maxBuffer: 1024 ** 3 });
  return status === 0 ? JSON.parse(stdout) : null;
};

const committed = existsSync(COUNTS) ? JSON.parse(readFileSync(COUNTS, "utf8")) : {};
const diagnostics = lintUnbaselined();
const current = countViolations({ diagnostics });
const growth = findGrowth({ current, allowed: committed });

if (args.includes("--check")) {
  let failed = growth.length > 0;
  if (failed) {
    console.error("New lint violations. Fix them; the baseline only covers code that predates a rule.\n");
    printGrowth({ growth, diagnostics });
  }
  const base = baseRef ? countsAt({ ref: baseRef }) : null;
  if (base && !args.includes("--allow-base-growth")) {
    const baselineGrowth = findGrowth({ current: committed, allowed: base });
    if (baselineGrowth.length > 0) {
      failed = true;
      console.error(
        `\n${COUNTS} grew compared to ${baseRef}. If that is intended (a newly enabled rule), add the lint-baseline-growth label:`
      );
      for (const { rule, file, count, allowed } of baselineGrowth)
        console.error(`  ${file}: ${rule} ${allowed} -> ${count}`);
    }
  }
  if (failed) process.exit(1);
  const fixed = total({ counts: committed }) - total({ counts: current });
  console.log(
    `No new lint violations.${fixed > 0 ? ` ${fixed} fixed: run npm run lint:baseline to lock them in.` : ""}`
  );
} else {
  if (growth.length > 0 && !args.includes("--allow-growth")) {
    console.error("Refusing to grow the baseline. Fix these instead:\n");
    printGrowth({ growth, diagnostics });
    process.exit(1);
  }
  const overrides = Object.keys(current)
    .sort()
    .map((rule) => ({
      files: Object.keys(current[rule])
        .sort()
        .map((file) => escapeGlob({ file })),
      rules: { [rule]: "off" },
    }));
  writeFileSync(BASELINE, `${JSON.stringify({ overrides }, null, 2)}\n`);
  writeFileSync(COUNTS, `${JSON.stringify(sortDeep({ value: current }), null, 2)}\n`);
  console.log(
    `${COUNTS}: ${total({ counts: current })} violations in ${overrides.length} rules (was ${total({
      counts: committed,
    })})`
  );
}
