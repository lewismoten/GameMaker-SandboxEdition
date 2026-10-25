// Checks every game for regressions, one game at a time (each step its own niced process), and
// prints a table; exits 1 when anything fails. `npm run check:games` in web/ runs it.
//   build   rebuilds into a temp folder: the result must match the committed disk/ byte for byte,
//           and the build must not change the game's other committed files
//   check   tools/check.ts (the bot wins without losing a life)
//   walk    kit/walkCheck.ts (walkthrough.json replays to the ending, frames and chapters as
//           recorded, no voice clip cut off: clipCheck's check)
//   bounds  no text is cut off by the edge of its picture (kit/textBounds.ts: the rebuild runs
//           with TEXT_BOUNDS on; with --quick, kit/textBoundsCheck.ts builds on its own)
//   text    kit/textfitCheck.ts      hidden  kit/hiddenView.ts      level  kit/levelCheck.ts
//           (the Level check's static findings, new ones only, against levelCheck.baseline.json)
// then once: kit/tinHearts.ts check and kit/syncCheck.ts (levelSecrets.json and box hours).
// With --play, each game is also played by the Level check's bot (kit/levelCheck.ts --play: one-way
// spots, things left behind, steady hands, its walkthrough's pace), which only reports.
//
//   npx vite-node ../games/kit/checkGames.ts [--game <id>]... [--quick] [--no-level] [--play] [--verbose]
//     --quick     skip the rebuild compare (the slowest step)
//     --no-level  skip the Level check
//     --play      also list each game's play findings (slow: minutes a game; never fails)
//     --verbose   print every step's output, not only a failing step's last lines
// Games are those with an about.json; a game marked secret is left out unless named with --game.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, readBounds } from './textBounds';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(gamesDir, '../web');
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const named = args.flatMap((a, i) => (args[i - 1] === '--game' ? [a] : []));
const quick = flag('--quick');
const verbose = flag('--verbose');

function listed(): string[] {
  return readdirSync(gamesDir)
    .filter((id) => existsSync(join(gamesDir, id, 'about.json')))
    .filter((id) => !(JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as { secret?: boolean }).secret)
    .sort();
}
const games = named.length ? named : listed();
for (const id of games) if (!existsSync(join(gamesDir, id, 'build.ts'))) throw new Error(`${id}: no games/${id}/build.ts`);

const has = (id: string, f: string) => existsSync(join(gamesDir, id, f));

type Status = 'ok' | 'FAIL' | 'skip';
const hasNice = process.platform !== 'win32' && spawnSync('nice', ['true']).status === 0;
const viteNode = join(webDir, 'node_modules/.bin/vite-node');

/** Runs one script with vite-node from web/, niced; prints its tail when it fails. */
function step(label: string, script: string, scriptArgs: string[] = [], env: Record<string, string> = {}): Status {
  const cmd = hasNice ? 'nice' : viteNode;
  const cmdArgs = [...(hasNice ? ['-n', '10', viteNode] : []), script, ...scriptArgs];
  const r = spawnSync(cmd, cmdArgs, { cwd: webDir, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 256 << 20, timeout: 30 * 60_000 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter((l) => l && !/ExperimentalWarning|--trace-warnings/.test(l));
  const ok = r.status === 0;
  if (verbose || !ok) {
    console.log(`  ${label}${ok ? '' : ` failed (${r.error ? String(r.error) : `exit ${r.status ?? r.signal}`})`}:`);
    for (const l of verbose ? out : out.slice(-20)) console.log(`    ${l}`);
  }
  return ok ? 'ok' : 'FAIL';
}

/** The game's files git sees as changed, outside disk/ (a build should leave them as they are). */
function dirtyFiles(id: string): string {
  const r = spawnSync('git', ['status', '--porcelain', '--', `games/${id}`, `:!games/${id}/disk`], { cwd: join(gamesDir, '..'), encoding: 'utf8' });
  return r.status === 0 ? r.stdout : '';
}

/** Names that differ between two folders of files. */
function diskDiff(a: string, b: string): string[] {
  const names = new Set([...readdirSync(a), ...(existsSync(b) ? readdirSync(b) : [])]);
  return [...names].sort().filter((n) => {
    const [pa, pb] = [join(a, n), join(b, n)];
    return !existsSync(pa) || !existsSync(pb) || !readFileSync(pa).equals(readFileSync(pb));
  });
}

/** Text the last rebuild found cut off at the edge of its picture, per game. */
const boundsOf = new Map<string, Status>();

function rebuild(id: string): Status {
  const out = mkdtempSync(join(tmpdir(), 'gm-check-'));
  const report = `${out}-bounds.json`;
  try {
    const before = dirtyFiles(id);
    if (step('build', `../games/${id}/build.ts`, [], { GAME_DISK_OUT: out, TEXT_BOUNDS: report }) === 'FAIL') return 'FAIL';
    const { cut } = readBounds(report);
    if (cut.length) {
      console.log(`  bounds: ${cut.length} text cut off at the edge of its picture:`);
      for (const o of cut.slice(0, 20)) console.log(`    ${describe(o)}`);
    }
    boundsOf.set(id, cut.length ? 'FAIL' : 'ok');
    const problems = diskDiff(out, join(gamesDir, id, 'disk')).map((n) => `disk/${n} differs from a fresh build`);
    const after = dirtyFiles(id);
    if (after !== before) problems.push(`the build changed committed files:\n${after}`);
    if (problems.length) {
      console.log(`  build: stale (rebuild with npx vite-node ../games/${id}/build.ts and commit disk/):`);
      for (const p of problems.slice(0, 20)) console.log(`    ${p}`);
      if (problems.length > 20) console.log(`    and ${problems.length - 20} more`);
    }
    return problems.length ? 'FAIL' : 'ok';
  } finally {
    rmSync(out, { recursive: true, force: true });
    rmSync(report, { force: true });
  }
}

const COLS = ['build', 'bounds', 'check', 'walk', 'text', 'hidden', 'level'] as const;
type Row = Record<(typeof COLS)[number], Status> & { sec: number };
const rows = new Map<string, Row>();
const t0 = Date.now();
for (const id of games) {
  const t = Date.now();
  console.log(`== ${id}`);
  const row: Row = {
    build: quick ? 'skip' : rebuild(id),
    bounds: quick ? step('bounds', '../games/kit/textBoundsCheck.ts', [id]) : (boundsOf.get(id) ?? 'FAIL'),
    check: has(id, 'tools/check.ts') ? step('check', `../games/${id}/tools/check.ts`) : 'skip',
    walk: has(id, 'walkthrough.json') ? step('walk', '../games/kit/walkCheck.ts', [id]) : 'skip',
    text: step('text', '../games/kit/textfitCheck.ts', [id]),
    hidden: has(id, 'about.json') ? step('hidden', '../games/kit/hiddenView.ts', [id]) : 'skip',
    level: flag('--no-level') ? 'skip' : step('level', '../games/kit/levelCheck.ts', [id]),
    sec: 0,
  };
  row.sec = Math.round((Date.now() - t) / 1000);
  rows.set(id, row);
}

if (flag('--play'))
  for (const id of games) {
    console.log(`== ${id}: play findings`);
    const cmd = hasNice ? 'nice' : viteNode;
    const r = spawnSync(cmd, [...(hasNice ? ['-n', '10', viteNode] : []), '../games/kit/levelCheck.ts', id, '--play'], {
      cwd: webDir,
      encoding: 'utf8',
      maxBuffer: 256 << 20,
      timeout: 120 * 60_000,
    });
    for (const l of `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n')) if (l && !/ExperimentalWarning|--trace-warnings/.test(l)) console.log(`  ${l}`);
  }

console.log('== every game');
const hearted = games.filter((id) => has(id, 'about.json') && 'tinHeart' in JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')));
const hearts = hearted.length ? step('tin hearts', '../games/kit/tinHearts.ts', ['check', ...hearted]) : 'skip';
const sync = step('levelSecrets and box hours', '../games/kit/syncCheck.ts', games);

const pad = (s: string, n: number) => s.padEnd(n);
console.log(`\n${pad('game', 10)} ${COLS.map((c) => pad(c, 6)).join(' ')}   time`);
for (const [id, r] of rows) console.log(`${pad(id, 10)} ${COLS.map((c) => pad(r[c], 6)).join(' ')} ${String(r.sec).padStart(5)}s`);
console.log(`tin hearts: ${hearts}   levelSecrets and box hours: ${sync}`);
const failed = [...rows.values()].filter((r) => COLS.some((c) => r[c] === 'FAIL')).length + (hearts === 'FAIL' ? 1 : 0) + (sync === 'FAIL' ? 1 : 0);
const min = (Date.now() - t0) / 60_000;
console.log(`${games.length} games in ${min.toFixed(1)} min: ${failed ? `${failed} failing (see above)` : 'all pass'}`);
process.exit(failed ? 1 : 0);
