// Quick pre-merge check: only what this branch touched against a base (default origin/develop).
// `npm run verify` stays the full check. Usage: npm run verify:changed [-- --base <ref>]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const bi = args.indexOf('--base');
const base = bi >= 0 && args[bi + 1] ? args[bi + 1] : 'origin/develop';

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim();
const lines = (s) => s.split('\n').filter(Boolean);
let mergeBase;
try {
  mergeBase = git('merge-base', base, 'HEAD');
} catch {
  console.error(`verify:changed: cannot find a merge base with ${base} (try git fetch origin).`);
  process.exit(2);
}
// Committed on the branch, plus staged/unstaged edits and new untracked files.
const changed = [
  ...new Set([...lines(git('diff', '--name-only', '--diff-filter=ACMR', mergeBase)), ...lines(git('ls-files', '--others', '--exclude-standard'))]),
]
  .filter((f) => existsSync(resolve(root, f)))
  .sort();

const rows = [];
let failed = false;
function step(name, cwd, cmd, cmdArgs, note = '') {
  const t0 = Date.now();
  console.log(`\n== ${name}: ${cmd} ${cmdArgs.join(' ').slice(0, 160)}`);
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit' });
  const ok = r.status === 0;
  if (!ok) failed = true;
  rows.push([name, ok ? 'pass' : 'FAIL', `${((Date.now() - t0) / 1000).toFixed(1)}s`, note]);
}
const skip = (name, note) => rows.push([name, 'skip', '-', note]);

console.log(`verify:changed: base ${base} (${mergeBase.slice(0, 9)}), ${changed.length} changed file(s)`);

const fmt = changed.filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html|yml|yaml)$/.test(f));
if (fmt.length) step('prettier', root, 'npx', ['prettier', '--check', '--ignore-unknown', ...fmt], `${fmt.length} files`);
else skip('prettier', 'no changed files');

const lint = changed.filter((f) => f.startsWith('web/') && /\.(ts|tsx|js|mjs|cjs)$/.test(f)).map((f) => relative('web', f));
if (lint.length) step('eslint', resolve(root, 'web'), 'npx', ['eslint', '--no-warn-ignored', ...lint], `${lint.length} files`);
else skip('eslint', 'no changed web scripts');

// tsc cannot be limited to files safely (types flow between modules), so it checks the whole project.
step('tsc', resolve(root, 'web'), 'npm', ['run', 'typecheck'], 'whole project (cannot be limited to files)');

step(
  'vitest',
  resolve(root, 'web'),
  'npx',
  ['vitest', 'run', '--changed', mergeBase, '--maxWorkers=2', '--passWithNoTests'],
  'vitest --changed (related tests only)',
);

const games = [...new Set(changed.map((f) => /^games\/([^/]+)\//.exec(f)?.[1]).filter((g) => g && g !== 'kit'))];
const kitChanged = changed.some((f) => f.startsWith('games/kit/'));

const pkgSrc = changed.some((f) => /^web\/packages\/[^/]+\/src\//.test(f));
if (pkgSrc) step('release:check', root, 'npm', ['run', 'release:check'], 'package src changed');
else skip('release:check', 'no package src changed');

const w = rows.reduce((m, r) => Math.max(m, r[0].length), 4);
console.log('\nverify:changed summary');
for (const [n, s, t, note] of rows) console.log(`  ${n.padEnd(w)}  ${s.padEnd(4)}  ${t.padStart(7)}  ${note}`);
for (const g of games) console.log(`  not run: npm run check:games -- --game ${g} --quick`);
if (kitChanged) console.log('  note: games/kit changed; consider npm run check:games for the games that use it.');
console.log(failed ? 'verify:changed: FAILED' : 'verify:changed: ok (the full check is npm run verify)');
process.exit(failed ? 1 : 0);
