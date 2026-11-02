/**
 * Locks what .oxlintrc.json enforces and how the baseline ratchet behaves. Runs the real oxlint binary,
 * config, tsconfigs and scripts/oxlint-baseline.mjs against throwaway projects, because a wrong rule
 * name, override order or ratchet comparison fails silently: lint just passes.
 *
 * Oxlint needs Node 20.19 or later, so jest.config.js skips this file on older Node; the lint job runs it.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import type { SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

// Jest runs from the package root (npm test, and npm test -w from the repository root).
const PACKAGE_ROOT = process.cwd();
const COUNTS = '.oxlint-baseline-counts.json';
const ANY_CODE = 'export const value: any = 1;\n';

// npm workspaces hoist oxlint to the repository root, so look for it upwards.
const findNodeModules = ({ from }: { from: string }): string => {
  const candidate = path.join(from, 'node_modules');
  if (existsSync(path.join(candidate, 'oxlint'))) {
    return candidate;
  }
  const parent = path.dirname(from);
  if (parent === from) {
    throw new Error('oxlint is not installed');
  }
  return findNodeModules({ from: parent });
};
const NODE_MODULES = findNodeModules({ from: PACKAGE_ROOT });

interface Diagnostic {
  code: string;
  filename: string;
}

interface ProjectParams {
  files: Record<string, string>;
  baseline?: object;
}

interface RunParams {
  dir: string;
  command: string;
  args: string[];
}

const projects: string[] = [];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const readJson = ({ text }: { text: string }): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(text);
  return isRecord(parsed) ? parsed : {};
};

// A throwaway project: the package's lint config, tsconfigs, baseline script and package.json, plus the given files.
const makeProject = ({ files, baseline = {} }: ProjectParams): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'oxlint-config-'));
  projects.push(dir);
  for (const entry of ['.oxlintrc.json', 'tsconfig.json', 'tests/tsconfig.json', 'scripts/oxlint-baseline.mjs', 'package.json']) {
    mkdirSync(path.dirname(path.join(dir, entry)), { recursive: true });
    cpSync(path.join(PACKAGE_ROOT, entry), path.join(dir, entry));
  }
  symlinkSync(NODE_MODULES, path.join(dir, 'node_modules'));
  // Oxlint skips what .gitignore lists; without it, linting "." would walk the linked node_modules.
  writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');
  writeFileSync(path.join(dir, '.oxlint-baseline.json'), JSON.stringify(baseline));
  for (const [file, code] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), code);
  }
  return dir;
};

const run = ({ dir, command, args }: RunParams): SpawnSyncReturns<string> => {
  const result = spawnSync(command, args, { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error !== undefined) {
    throw result.error;
  }
  return result;
};

const lint = ({ dir, extra = [] }: { dir: string; extra?: string[] }): Diagnostic[] => {
  const { stdout, stderr, status } = run({
    dir,
    command: path.join(dir, 'node_modules/.bin/oxlint'),
    args: [...extra, '-f', 'json', 'src', 'tests'],
  });
  if (status !== 0 && status !== 1) {
    throw new Error(`oxlint exited with status ${String(status)}: ${stderr}`);
  }
  const { diagnostics } = readJson({ text: stdout });
  if (!Array.isArray(diagnostics)) {
    throw new TypeError(`oxlint printed no report: ${stdout}`);
  }
  return diagnostics.filter(
    (entry: unknown): entry is Diagnostic =>
      isRecord(entry) && typeof entry.code === 'string' && typeof entry.filename === 'string'
  );
};

const ratchet = ({ dir, args = [] }: { dir: string; args?: string[] }): SpawnSyncReturns<string> =>
  run({ dir, command: process.execPath, args: ['scripts/oxlint-baseline.mjs', ...args] });

const removeProjects = (): void => {
  for (const dir of projects.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe('oxlint config', () => {
  let diagnostics: Diagnostic[] = [];
  const rules = ({ filename }: { filename: string }): string[] =>
    diagnostics.filter((diagnostic) => diagnostic.filename === filename).map((diagnostic) => diagnostic.code);

  beforeAll(() => {
    const dir = makeProject({
      files: {
        'src/uses-any.ts': ANY_CODE,
        'src/baselined-file.ts': `${ANY_CODE}export const evaluated = eval('1');\n`,
        'src/suppressed-line.ts': '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const value: any = 1;\n',
        'src/endless-loop.ts': 'export const spin = (): void => {\n  while (true) {\n    break;\n  }\n};\n',
        'src/type-and-value-import.ts':
          "import type { A } from './a';\nimport { b } from './a';\n\nexport const value: A = b;\n",
        'src/modules/parent-import.ts': "import { b } from '../a';\n\nexport const value = b;\n",
        'src/fire-and-forget.ts':
          'const dispatch = async (): Promise<number> => 1;\nexport const start = (): void => {\n  void dispatch();\n};\n',
        'src/utils/client-context.ts': 'export const ok = 1;\n',
        'src/utils/clientContext.ts': 'export const ok = 1;\n',
        'tests/new-feature.test.ts':
          "import { b } from '../src/a';\n\ndescribe('a feature', () => {\n  it('works', () => {\n    expect(b).toBe(1);\n  });\n});\n",
        'src/a.ts': 'export type A = number;\nexport const b = 1;\n',
      },
      baseline: { overrides: [{ files: ['src/baselined-file.ts'], rules: { 'typescript/no-explicit-any': 'off' } }] },
    });
    diagnostics = lint({ dir, extra: ['--type-aware'] });
  });

  afterAll(removeProjects);

  it('rejects any in new source files', () => {
    expect(rules({ filename: 'src/uses-any.ts' })).toContain('typescript(no-explicit-any)');
  });

  it('exempts a baselined file from its listed rule and no other', () => {
    const fileRules = rules({ filename: 'src/baselined-file.ts' });
    expect(fileRules).not.toContain('typescript(no-explicit-any)');
    expect(fileRules).toContain('eslint(no-eval)');
  });

  it('honours existing eslint-disable comments', () => {
    expect(rules({ filename: 'src/suppressed-line.ts' })).not.toContain('typescript(no-explicit-any)');
  });

  it('flags `while (true)`', () => {
    expect(rules({ filename: 'src/endless-loop.ts' })).toContain('eslint(no-constant-condition)');
  });

  it('allows `import type` beside a value import from the same module', () => {
    expect(rules({ filename: 'src/type-and-value-import.ts' })).not.toContain('eslint(no-duplicate-imports)');
  });

  it('allows ../ imports, the only way tests and modules reach src/', () => {
    expect(rules({ filename: 'src/modules/parent-import.ts' })).not.toContain('import(no-relative-parent-imports)');
    expect(rules({ filename: 'tests/new-feature.test.ts' })).not.toContain('import(no-relative-parent-imports)');
  });

  it('allows `void` to mark a deliberate fire-and-forget', () => {
    expect(rules({ filename: 'src/fire-and-forget.ts' })).not.toContain('eslint(no-void)');
  });

  it('requires kebab-case file names, as the SDK conventions document', () => {
    expect(rules({ filename: 'src/utils/client-context.ts' })).not.toContain('unicorn(filename-case)');
    expect(rules({ filename: 'src/utils/clientContext.ts' })).toContain('unicorn(filename-case)');
  });

  it('types a new test with Jest, so its describe, it and expect are not unsafe any', () => {
    const fileRules = rules({ filename: 'tests/new-feature.test.ts' });
    expect(fileRules).not.toContain('typescript(no-unsafe-call)');
    expect(fileRules).not.toContain('typescript(no-unsafe-member-access)');
  });
});

describe('baseline ratchet (scripts/oxlint-baseline.mjs)', () => {
  // The tests run in order against one project, each starting from the state the previous one left.
  const LEGACY = 'src/legacy.ts';
  const MOVED = 'src/moved.ts';
  const STABLE = 'src/stable.ts';
  const UNRELATED = 'src/unrelated.ts';
  const TWO_ANY = `${ANY_CODE}export const more: any = 2;\n`;
  let dir = '';
  const counts = (): Record<string, unknown> => readJson({ text: readFileSync(path.join(dir, COUNTS), 'utf8') });
  const write = ({ file, code }: { file: string; code: string }): void => {
    writeFileSync(path.join(dir, file), code);
  };
  const check = ({ extra = [] }: { extra?: string[] } = {}): SpawnSyncReturns<string> =>
    ratchet({ dir, args: ['--check', ...extra] });
  const git = ({ args }: { args: string[] }): SpawnSyncReturns<string> =>
    run({ dir, command: 'git', args: ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args] });

  beforeAll(() => {
    dir = makeProject({ files: { [LEGACY]: ANY_CODE, [STABLE]: ANY_CODE } });
    const created = ratchet({ dir, args: ['--allow-growth'] });
    if (created.status !== 0) {
      throw new Error(`baseline script failed: ${created.stderr}`);
    }
    for (const args of [['init', '-q'], ['add', '-A'], ['commit', '-qm', 'base']]) {
      const result = git({ args });
      if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
      }
    }
  });

  afterAll(removeProjects);

  it('records the exact count per rule and file', () => {
    expect(counts()['typescript/no-explicit-any']).toStrictEqual({ [LEGACY]: 1, [STABLE]: 1 });
  });

  it('passes the full and the fast check while no count goes up', () => {
    expect(check().status).toBe(0);
    expect(check({ extra: ['--fast'] }).status).toBe(0);
  });

  it('passes a pull request whose counts and lint rules match the base branch', () => {
    expect(check({ extra: ['--base', 'HEAD'] }).status).toBe(0);
  });

  it('rejects unknown flags and a regenerate from a partial run', () => {
    expect(ratchet({ dir, args: ['--chek'] }).status).not.toBe(0);
    expect(ratchet({ dir, args: ['--fast'] }).status).not.toBe(0);
    expect(ratchet({ dir, args: [LEGACY] }).status).not.toBe(0);
  });

  it('fails the check, naming the file and marking the new line, when a baselined file gains a violation', () => {
    write({ file: LEGACY, code: TWO_ANY });
    const result = check();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${LEGACY}: typescript/no-explicit-any, 2 violation(s) where 1 existed`);
    expect(result.stderr).toContain(`  > ${LEGACY}:2 `);
  });

  it('catches the same growth in the fast check of just that file', () => {
    expect(check({ extra: ['--fast', path.join(dir, LEGACY)] }).status).toBe(1);
  });

  it('refuses to regenerate a baseline that would grow', () => {
    expect(ratchet({ dir }).status).toBe(1);
    expect(counts()['typescript/no-explicit-any']).toStrictEqual({ [LEGACY]: 1, [STABLE]: 1 });
  });

  it('reports a file that does not parse instead of crashing', () => {
    write({ file: LEGACY, code: ANY_CODE });
    write({ file: 'src/broken.ts', code: 'export const = ;\n' });
    const result = check();
    rmSync(path.join(dir, 'src/broken.ts'));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('cannot be baselined');
  });

  it("keeps a renamed file's allowance", () => {
    git({ args: ['mv', LEGACY, MOVED] });
    expect(ratchet({ dir }).status).toBe(0);
    expect(counts()['typescript/no-explicit-any']).toStrictEqual({ [MOVED]: 1, [STABLE]: 1 });
    expect(check().status).toBe(0);
  });

  it("does not hand a deleted file's allowance to an unrelated file", () => {
    git({ args: ['rm', '-q', '-f', MOVED] });
    write({ file: UNRELATED, code: 'export const other: any = 2;\nexport const plain = 3;\n' });
    git({ args: ['add', UNRELATED] });
    const result = ratchet({ dir });
    git({ args: ['rm', '-q', '-f', UNRELATED] });
    write({ file: MOVED, code: ANY_CODE });
    git({ args: ['add', MOVED] });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${UNRELATED}: typescript/no-explicit-any, 1 violation(s) where 0 existed`);
  });

  it('fails when .oxlint-baseline.json is edited by hand', () => {
    const baselinePath = path.join(dir, '.oxlint-baseline.json');
    const original = readFileSync(baselinePath, 'utf8');
    const edited = original.replace('"overrides": [', '"overrides": [{ "files": ["src/other.ts"], "rules": { "no-console": "off" } },');
    expect(edited).not.toBe(original);
    writeFileSync(baselinePath, edited);
    const result = check();
    writeFileSync(baselinePath, original);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match');
  });

  it('only warns about a lower count in a file the change did not touch', () => {
    const countsPath = path.join(dir, COUNTS);
    const original = readFileSync(countsPath, 'utf8');
    const raised = { ...readJson({ text: original }), 'typescript/no-explicit-any': { [MOVED]: 1, [STABLE]: 3 } };
    writeFileSync(countsPath, JSON.stringify(raised));
    const result = check();
    writeFileSync(countsPath, original);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('went down elsewhere');
  });

  it('fails until fixed violations in a touched file are locked in, then shrinks both files', () => {
    write({ file: MOVED, code: 'export const value = 1;\n' });
    const stale = check();
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('went down');
    expect(ratchet({ dir }).status).toBe(0);
    expect(counts()['typescript/no-explicit-any']).toStrictEqual({ [STABLE]: 1 });
    expect(readFileSync(path.join(dir, '.oxlint-baseline.json'), 'utf8')).not.toContain(MOVED);
    expect(check().status).toBe(0);
  });

  it('fails a pull request whose committed counts grew against the base branch', () => {
    write({ file: MOVED, code: TWO_ANY });
    expect(ratchet({ dir, args: ['--allow-growth'] }).status).toBe(0);
    const result = check({ extra: ['--base', 'HEAD'] });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('grew compared to HEAD');
  });

  it('fails a pull request that changes the lint config, even by a comment', () => {
    write({ file: MOVED, code: 'export const value = 1;\n' });
    expect(ratchet({ dir }).status).toBe(0);
    const configPath = path.join(dir, '.oxlintrc.json');
    writeFileSync(configPath, `${readFileSync(configPath, 'utf8')}\n`);
    const result = check({ extra: ['--base=HEAD'] });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('changed compared to HEAD');
  });

  it('accepts it with --allow-base-growth, which the lint-baseline-growth label sets', () => {
    expect(check({ extra: ['--base', 'HEAD', '--allow-base-growth'] }).status).toBe(0);
  });

  it('fails loudly on a --base ref the checkout does not have', () => {
    const result = check({ extra: ['--base', 'no-such-ref'] });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('not a commit');
  });
});
