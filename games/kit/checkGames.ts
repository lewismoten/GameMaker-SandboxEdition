// Checks every game for regressions (each step its own niced process), and prints a table; exits 1 when anything fails. `npm run check:games` in web/ runs it.
//   build   rebuilds twice into temp folders: the results must match byte for byte,
//           and the build must not change the game's other committed files
//   check   tools/check.ts (the bot wins without losing a life)
//   walk    kit/walkCheck.ts (walkthrough.json replays to the ending, frames and chapters as
//           recorded, no voice clip cut off: clipCheck's check)
//   bounds  no text is cut off by the edge of its picture (kit/textBounds.ts: the rebuild runs
//           with TEXT_BOUNDS on; with --quick, kit/textBoundsCheck.ts builds on its own)
//   text    kit/textfitCheck.ts      hidden  kit/hiddenView.ts      level  kit/levelCheck.ts
//           (the Level check's static findings, new ones only, against levelCheck.baseline.json)
//   player  kit/playerCheck.ts (games/<id>/player.json, its DOS player look, keeps the rules)
//   controls kit/controlsCheck.ts (games/<id>/controls.json describes exactly the keys, joystick buttons and counters the game uses)
// then once: kit/tinHearts.ts check, kit/saveSignCheck.ts (one save sign per felt-egg game, none
// elsewhere), kit/syncCheck.ts (levelSecrets.json and box hours) and kit/versionCheck.ts (a game
// whose disk/ changed since the last push to master has a higher about.json version than it had there).
// With --play, each game is also played by the Level check's bot (kit/levelCheck.ts --play: one-way
// spots, things left behind, steady hands, its walkthrough's pace), which only reports.
//
// Builds (and the rebuild compare) run first, one game at a time, since they share
// games/.build-cache.json; then up to --jobs games are checked at once, each game's checks in order,
// each game's output printed together when it finishes. A lock file in the temp folder makes a
// second run wait for the first (a lock whose process has died is ignored).
//
//   npx vite-node ../games/kit/checkGames.ts [--game <id>]... [--quick] [--no-level] [--play] [--verbose] [--jobs N]
//     --jobs N    games checked at once (default: half the CPUs, at least 1; 1 is the old serial run)
//     --quick     skip the rebuild compare (the slowest step)
//     --no-level  skip the Level check
//     --play      also list each game's play findings (slow: minutes a game; never fails)
//     --verbose   print every step's output, not only a failing step's last lines
// Games are those with an about.json; a game marked secret is left out unless named with --game.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, readdirSync, readFileSync, rmSync, cpSync, mkdirSync, renameSync } from 'node:fs';
import { cpus, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, readBounds } from '@lewismoten/gamemaker-sandbox-tools/kit/textBounds';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(gamesDir, '../web');
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const named = args.flatMap((a, i) => (args[i - 1] === '--game' ? [a] : []));
const quick = flag('--quick');
const verbose = flag('--verbose');
const jobsAt = args.indexOf('--jobs');
const jobs = Math.max(1, jobsAt >= 0 ? Math.floor(Number(args[jobsAt + 1])) || 1 : Math.floor(cpus().length / 2));
const cacheFile = join(gamesDir, '.build-cache.json');
const frameCache = existsSync(cacheFile) ? (JSON.parse(readFileSync(cacheFile, 'utf8')) as { frames?: string }).frames : undefined;

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
const viteNode = join(webDir, '../node_modules/.bin/vite-node');

/** Runs one script with vite-node from web/, niced; logs its tail when it fails. Output goes to `log`. */
function step(log: string[], label: string, script: string, scriptArgs: string[] = [], env: Record<string, string> = {}): Promise<Status> {
  const cmd = hasNice ? 'nice' : viteNode;
  const cmdArgs = [...(hasNice ? ['-n', '10', viteNode] : []), script, ...scriptArgs];
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, { cwd: webDir, env: { ...process.env, DEPTH_FRAME_CACHE: frameCache ?? '', ...env } });
    let text = '';
    let error = '';
    const timer = setTimeout(() => child.kill(), 30 * 60_000);
    child.stdout.on('data', (d: Buffer) => (text += d));
    child.stderr.on('data', (d: Buffer) => (text += d));
    child.on('error', (e) => (error = String(e)));
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const out = text.split('\n').filter((l) => l && !/ExperimentalWarning|--trace-warnings/.test(l));
      const ok = code === 0;
      if (verbose || !ok) {
        log.push(`  ${label}${ok ? '' : ` failed (${error || `exit ${code ?? signal}`})`}:`);
        for (const l of verbose ? out : out.slice(-20)) log.push(`    ${l}`);
      }
      resolve(ok ? 'ok' : 'FAIL');
    });
  });
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
const buildSec = new Map<string, number>();

async function rebuild(id: string, log: string[]): Promise<Status> {
  const out = mkdtempSync(join(tmpdir(), 'gm-check-'));
  const report = `${out}-bounds.json`;
  const again = mkdtempSync(join(tmpdir(), 'gm-repeat-'));
  try {
    const before = dirtyFiles(id);
    if ((await step(log, 'build', `../games/${id}/build.ts`, [], { GAME_DISK_OUT: out, TEXT_BOUNDS: report })) === 'FAIL') return 'FAIL';
    const { cut } = readBounds(report);
    if (cut.length) {
      log.push(`  bounds: ${cut.length} text cut off at the edge of its picture:`);
      for (const o of cut.slice(0, 20)) log.push(`    ${describe(o)}`);
    }
    boundsOf.set(id, cut.length ? 'FAIL' : 'ok');
    if ((await step(log, 'repeat build', `../games/${id}/build.ts`, [], { GAME_DISK_OUT: again })) === 'FAIL') return 'FAIL';
    const problems = diskDiff(out, again).map((n) => `disk/${n} differs between identical builds`);
    const after = dirtyFiles(id);
    if (after !== before) problems.push(`the build changed committed files:\n${after}`);
    if (problems.length) {
      log.push('  build: not reproducible:');
      for (const p of problems.slice(0, 20)) log.push(`    ${p}`);
      if (problems.length > 20) log.push(`    and ${problems.length - 20} more`);
    }
    const disk = join(gamesDir, id, 'disk');
    if (!problems.length && diskDiff(out, disk).length) {
      // file by file, renamed into place, so the dev server never finds disk/ empty
      mkdirSync(disk, { recursive: true });
      const fresh = new Set(readdirSync(out));
      for (const name of fresh) {
        const part = join(disk, `.${name}.${process.pid}.part`);
        cpSync(join(out, name), part, { recursive: true });
        renameSync(part, join(disk, name));
      }
      for (const name of readdirSync(disk)) if (!fresh.has(name)) rmSync(join(disk, name), { recursive: true, force: true });
    }
    return problems.length ? 'FAIL' : 'ok';
  } finally {
    rmSync(out, { recursive: true, force: true });
    rmSync(again, { recursive: true, force: true });
    rmSync(report, { force: true });
  }
}

const COLS = ['build', 'bounds', 'check', 'walk', 'text', 'hidden', 'level', 'player', 'controls'] as const;
type Row = Record<(typeof COLS)[number], Status> & { sec: number };
const rows = new Map<string, Row>();
const t0 = Date.now();

/** One lock for the machine: a second run waits for the first. A dead process's lock is stale. */
const lockFile = join(tmpdir(), 'gm-check-games.lock');
async function takeLock(): Promise<void> {
  let told = false;
  for (;;) {
    try {
      writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
      break;
    } catch {
      const pid = Number(readFileSync(lockFile, 'utf8').trim() || 0);
      let alive = false;
      try {
        if (pid) process.kill(pid, 0);
        alive = !!pid;
      } catch (e) {
        alive = (e as NodeJS.ErrnoException).code === 'EPERM';
      }
      if (!alive) {
        rmSync(lockFile, { force: true });
        continue;
      }
      if (!told) console.log('waiting for another check:games…');
      told = true;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const release = () => {
    try {
      if (readFileSync(lockFile, 'utf8').trim() === String(process.pid)) rmSync(lockFile, { force: true });
    } catch {
      /* already gone */
    }
  };
  process.on('exit', release);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const)
    process.on(sig, () => {
      release();
      process.exit(130);
    });
}
await takeLock();

// Builds first, in sequence: they share games/.build-cache.json.
const builds = new Map<string, Status>();
if (!quick)
  for (const id of games) {
    const log: string[] = [`== ${id}: build`];
    const t = Date.now();
    builds.set(id, await rebuild(id, log));
    buildSec.set(id, Math.round((Date.now() - t) / 1000));
    console.log(log.join('\n'));
  }

async function checkGame(id: string): Promise<void> {
  const t = Date.now();
  const log: string[] = [`== ${id}`];
  const row: Row = {
    build: quick ? 'skip' : (builds.get(id) ?? 'FAIL'),
    bounds: quick ? await step(log, 'bounds', '../games/kit/textBoundsCheck.ts', [id]) : (boundsOf.get(id) ?? 'FAIL'),
    check: has(id, 'tools/check.ts') ? await step(log, 'check', `../games/${id}/tools/check.ts`) : 'skip',
    walk: has(id, 'walkthrough.json') ? await step(log, 'walk', '../games/kit/walkCheck.ts', [id]) : 'skip',
    text: await step(log, 'text', '../games/kit/textfitCheck.ts', [id]),
    hidden: has(id, 'about.json') ? await step(log, 'hidden', '../games/kit/hiddenView.ts', [id]) : 'skip',
    level: flag('--no-level') ? 'skip' : await step(log, 'level', '../games/kit/levelCheck.ts', [id]),
    player: has(id, 'player.json') ? await step(log, 'player', '../games/kit/playerCheck.ts', [id]) : 'skip',
    controls: has(id, 'controls.json') ? await step(log, 'controls', '../games/kit/controlsCheck.ts', [id]) : 'skip',
    sec: 0,
  };
  row.sec = Math.round((Date.now() - t) / 1000) + (buildSec.get(id) ?? 0);
  rows.set(id, row);
  log.push(`  -> ${COLS.map((c) => `${c} ${row[c]}`).join(', ')} (${row.sec}s)`);
  console.log(log.join('\n'));
}
const queue = [...games];
await Promise.all(
  Array.from({ length: Math.min(jobs, games.length) }, async () => {
    for (let id = queue.shift(); id; id = queue.shift()) await checkGame(id);
  }),
);

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
const once = async (label: string, script: string, scriptArgs: string[]): Promise<Status> => {
  const log: string[] = [];
  const status = await step(log, label, script, scriptArgs);
  if (log.length) console.log(log.join('\n'));
  return status;
};
const hearts = hearted.length ? await once('tin hearts', '../games/kit/tinHearts.ts', ['check', ...hearted]) : 'skip';
const signs = await once('save signs', '../games/kit/saveSignCheck.ts', games);
const sync = await once('levelSecrets and box hours', '../games/kit/syncCheck.ts', games);
const versions = await once('versions', '../games/kit/versionCheck.ts', games);

const pad = (s: string, n: number) => s.padEnd(n);
console.log(`\n${pad('game', 10)} ${COLS.map((c) => pad(c, 6)).join(' ')}   time`);
for (const id of games) {
  const r = rows.get(id)!;
  console.log(`${pad(id, 10)} ${COLS.map((c) => pad(r[c], 6)).join(' ')} ${String(r.sec).padStart(5)}s`);
}
console.log(`tin hearts: ${hearts}   save signs: ${signs}   levelSecrets and box hours: ${sync}   versions: ${versions}`);
const failed =
  [...rows.values()].filter((r) => COLS.some((c) => r[c] === 'FAIL')).length +
  (hearts === 'FAIL' ? 1 : 0) +
  (signs === 'FAIL' ? 1 : 0) +
  (sync === 'FAIL' ? 1 : 0) +
  (versions === 'FAIL' ? 1 : 0);
const min = (Date.now() - t0) / 60_000;
console.log(`${games.length} games in ${min.toFixed(1)} min: ${failed ? `${failed} failing (see above)` : 'all pass'}`);
process.exit(failed ? 1 : 0);
