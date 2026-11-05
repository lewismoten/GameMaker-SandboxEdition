// Checks the Pocket Player's play loop (hardware/pocket-player/src/gmcore.h) against the real engine,
// game by game. Each game's committed walkthrough (games/<id>/walkthrough.json) is replayed on the
// engine's headless player (kit/gameSim.ts); the state after every tick (position, sequence, scroll,
// score, hit points, lives, the counters and a hash of the 312 by 196 picture) is recorded. The C++ core
// is built for the Mac (needs c++ and zlib), replays the same keys on the same packed data files
// (data/<id>.cfg, from pocketData.ts) and the two are compared tick by tick. One line per game;
// exit 1 if any game differs.
//   cd web && npx vite-node scripts/pocketHostCheck.ts [id ...] [--ticks N] [--keep dir]
// With no ids it checks every game in data/games.txt.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderWorld, VISIBLE_H, VISIBLE_W } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { decodeKeys, type Walkthrough } from './../src/walkthrough/format';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const limit = Number(opt('--ticks') ?? 1e9);
const work = opt('--keep') ?? mkdtempSync(join(tmpdir(), 'pocket-host-'));
const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
const games = new URL('../../games/', import.meta.url).pathname;
const skipArg = new Set([opt('--ticks'), opt('--keep')]);
let ids = args.filter((a) => !a.startsWith('--') && !skipArg.has(a));
if (!ids.length)
  ids = readFileSync(here + 'data/games.txt', 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.split('|')[0]);

// A canvas stand-in: the engine's Screen only needs a 2d context to exist.
const canvas = { width: 0, height: 0, getContext: () => ({ createImageData: () => ({ data: new Uint8ClampedArray(320 * 200 * 4) }) }) };
const screen = new Screen(canvas as unknown as HTMLCanvasElement);
const hash = (): number => {
  let h = 2166136261;
  for (let y = 0; y < VISIBLE_H; y++) for (let x = 0; x < VISIBLE_W; x++) h = Math.imul(h ^ screen.pixels[y * 320 + x], 16777619) >>> 0;
  return h;
};

const exe = join(work, 'hosttest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/hosttest.cpp', '-o', exe, '-lz'], { stdio: 'inherit' });

const names = 'S tick code level x0 x1 y0 y1 seq frame mx my nx ny lsx lsy score nextx nexty scrx scry hp lives meters hash'.split(' ');
const play = (g: GameSim, n: number) =>
  g.game.scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.gametype === 10)
    .findIndex((p) => p.i === n);

async function checkGame(id: string): Promise<string> {
  const walk = JSON.parse(readFileSync(`${games}${id}/walkthrough.json`, 'utf8')) as Walkthrough;
  const sim = new GameSim(readDisk(`${games}${id}/disk`), walk.rand.seed);
  const script: string[] = [];
  const expected: string[] = [];
  const segs = walk.segments.map((s) => decodeKeys(s.keys));
  let seg = 0;
  let ki = 0;
  let at = 0;
  let tickNo = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ev = (sim as any).event.bind(sim) as (k: number) => void;
  const nextAt = () => (ki < segs[seg].length ? at + segs[seg][ki].delta : Infinity);
  at = 0;
  while (tickNo < limit && !sim.ended) {
    while (seg < segs.length && ki < segs[seg].length && nextAt() === sim.ticks + 1) {
      at = nextAt();
      script.push(`K ${tickNo + 1} ${segs[seg][ki].key}`);
      ev(segs[seg][ki].key);
      ki++;
    }
    tickNo++;
    const r = await sim.tick();
    const w = sim.w;
    renderWorld(screen, w);
    const code = r === 'link' ? 'L' : r === 'dead' ? 'D' : r === 'end' ? 'W' : '-';
    const c = w.chr;
    const s = w.scroll;
    const meters = w.ci.meter.slice(0, 30).reduce((a, b) => (a + b) | 0, 0);
    expected.push(
      [
        'S',
        tickNo,
        code,
        play(sim, sim.scene),
        c.x[0],
        c.x[1],
        c.y[0],
        c.y[1],
        c.cseq,
        c.cframe,
        w.mx,
        w.my,
        s.nx,
        s.ny,
        s.littleShiftx,
        s.littleShifty,
        w.ci.score,
        w.ci.nextx,
        w.ci.nexty,
        w.ci.scrx,
        w.ci.scry,
        w.ci.hitpts,
        w.ci.lives,
        meters,
        hash(),
      ].join(' '),
    );
    if (r === 'link' && seg + 1 < segs.length) {
      seg++;
      ki = 0;
      at = 0;
    }
  }
  const total = expected.length;
  const dir = join(work, id);
  execFileSync('mkdir', ['-p', dir]);
  writeFileSync(join(dir, 'keys.txt'), script.join('\n') + `\nT ${total}\n`);
  writeFileSync(join(dir, 'expected.txt'), expected.join('\n') + '\n');
  let out: string;
  try {
    out = execFileSync(exe, [here + 'data', id, join(dir, 'keys.txt')], { maxBuffer: 1 << 28 }).toString();
  } catch (e) {
    return `FAIL  ${id}: the board code stopped (${String(e).split('\n')[0]})`;
  }
  const got = out.trim().split('\n');
  for (let i = 0; i < total; i++) {
    if (got[i] !== expected[i]) {
      const a = expected[i].split(' '),
        b = (got[i] ?? '').split(' ');
      const diffs = names.map((n, k) => (a[k] !== b[k] ? `${n}: engine ${a[k]}, board ${b[k]}` : '')).filter(Boolean);
      return `FAIL  ${id}: tick ${i + 1} of ${total}: ${diffs.slice(0, 4).join('; ')}`;
    }
  }
  if (sim.ended !== 'won' && limit > 1e8) return `FAIL  ${id}: the walkthrough did not reach the ending on the engine (${sim.ended ?? 'ran out of keys'})`;
  const n = (c: string) => expected.filter((l) => l.split(' ')[2] === c).length;
  return `ok    ${id}: ${total} ticks match (${n('L')} level changes, ${n('D')} deaths, ${n('W')} win)`;
}

let bad = 0;
for (const id of ids) {
  const line = await checkGame(id).catch((e) => `FAIL  ${id}: ${String(e).split('\n')[0]}`);
  if (line.startsWith('FAIL')) bad++;
  console.log(line);
}
console.log(`${ids.length - bad} of ${ids.length} games match the engine tick for tick${bad ? `; ${bad} differ` : ''}`);
process.exit(bad ? 1 : 0);
