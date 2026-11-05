// Checks the Pocket Player's play loop (hardware/pocket-player/src/gmcore.h) against the real engine,
// game by game. Each game's committed walkthrough (games/<id>/walkthrough.json) is replayed on the
// engine's headless player (kit/gameSim.ts); the state after every tick (position, sequence, scroll,
// score, hit points, lives, the counters and a hash of the 312 by 196 picture) is recorded. The C++ core
// is built for the Mac (needs c++ and zlib), replays the same keys on the same packed data files
// (data/<id>.cfg, from pocketData.ts) and the two are compared tick by tick. One line per game;
// exit 1 if any game differs. It also records every PC speaker effect the engine starts (tick, number, hash of
// its 36 frequencies) and compares that schedule with the one the board code queues (Q lines), and the board's
// tone player (pcspeaker.h) is timed against 1/145.6 s steps for up to 40 of the effects (the Z line).
//   cd web && npx vite-node scripts/pocketHostCheck.ts [id ...] [--ticks N] [--keep dir]
// With no ids it checks every game in data/games.txt.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderWorld, VISIBLE_H, VISIBLE_W } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { LASTSND } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { decodeKeys, type Walkthrough } from './../src/walkthrough/format';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const limit = Number(opt('--ticks') ?? 1e9);
const work = opt('--keep') ?? mkdtempSync(join(tmpdir(), 'pocket-host-'));
const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
// --data <dir>: a folder with <id>.cfg and the files (a card's /pocket folder, with its .cfg copied to <id>.cfg)
const dataDir = opt('--data') ?? here + 'data';
const games = new URL('../../games/', import.meta.url).pathname;
const skipArg = new Set([opt('--ticks'), opt('--keep'), opt('--data')]);
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
const fnv = (b: Uint8Array): number => {
  let h = 2166136261;
  for (const x of b) h = Math.imul(h ^ x, 16777619) >>> 0;
  return h;
};
const play = (g: GameSim, n: number) =>
  g.game.scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.gametype === 10)
    .findIndex((p) => p.i === n);

async function checkGame(id: string): Promise<string> {
  const walk = JSON.parse(readFileSync(`${games}${id}/walkthrough.json`, 'utf8')) as Walkthrough;
  const sim = new GameSim(readDisk(`${games}${id}/disk`), walk.rand.seed);
  const script: string[] = [];
  const sounds: string[] = [];
  const wrapped = new WeakSet<object>();
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
  // A runaway guard: once a segment's keys are all used, the game gets 2000 more ticks to leave it before the run stops.
  let lastKeyTick = 0;
  const skip = new Set<number>();
  const dropKey = sim.w.chr.sequences[4].key >> 8;
  while (tickNo < limit && !sim.ended) {
    if (ki >= segs[seg].length && tickNo > lastKeyTick + 2000) break;
    while (seg < segs.length && ki < segs[seg].length && nextAt() === sim.ticks + 1) {
      at = nextAt();
      const key = segs[seg][ki].key;
      if (skip.has(seg * 1e6 + ki)) {
        ki++;
        continue;
      }
      lastKeyTick = tickNo + 1;
      if (key === dropKey) {
        // The walkthrough holds the drop picker's keys (Right per column, Down for row two, Enter) after D.
        // The engine here has no picker window: read the slot from them, hand it over, and leave them out.
        let col = 0,
          row = 0,
          j = ki + 1;
        for (; j < segs[seg].length && segs[seg][j].key !== 28; j++) {
          if (segs[seg][j].key === 77) col++;
          if (segs[seg][j].key === 80) row = 1;
        }
        if (j < segs[seg].length) {
          const slot = row * 5 + col;
          sim.dropSlot = slot;
          script.push(`K ${tickNo + 1} ${256 + slot}`);
          for (let q = ki + 1; q <= j + 1 && q < segs[seg].length; q++) skip.add(seg * 1e6 + q);
        }
      }
      script.push(`K ${tickNo + 1} ${key}`);
      ev(key);
      ki++;
    }
    tickNo++;
    if (!wrapped.has(sim.w.sound)) {
      // record each effect the engine starts: its tick, number and the hash of its frequencies
      wrapped.add(sim.w.sound);
      const orig = sim.w.sound.play.bind(sim.w.sound);
      sim.w.sound.play = (n: number) => {
        const ok = orig(n);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = ok && n >= 0 && n < LASTSND ? ((sim as any).file(sim.scene, 7) as Uint8Array | undefined) : undefined;
        if (raw) sounds.push(`Q ${tickNo} ${n} ${fnv(raw.subarray(n * 72, n * 72 + 72))}`);
        return ok;
      };
    }
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
    // The next segment is the one recorded for the scene just entered (as the walkthrough player picks it, runtime.ts
    // SegmentRecorder.enterScene): a scene with no segment of its own, such as a pass-through drive between two
    // levels, leaves the current one in place instead of using up the next level's keys.
    if (r === 'link') {
      const next = walk.segments.findIndex((s, k) => k > seg && s.scene === sim.scene);
      if (next >= 0) {
        seg = next;
        ki = 0;
        at = 0;
      }
    }
  }
  const total = expected.length;
  const dir = join(work, id);
  execFileSync('mkdir', ['-p', dir]);
  writeFileSync(join(dir, 'keys.txt'), `R ${walk.rand.seed}\n` + script.join('\n') + `\nT ${total}\n`);
  writeFileSync(join(dir, 'expected.txt'), expected.join('\n') + '\n');
  let out: string;
  try {
    out = execFileSync(exe, [dataDir, id, join(dir, 'keys.txt')], { maxBuffer: 1 << 28 }).toString();
  } catch (e) {
    return `FAIL  ${id}: the board code stopped (${String(e).split('\n')[0]})`;
  }
  const lines = out.trim().split('\n');
  const got = lines.filter((l) => l.startsWith('S '));
  const gotQ = lines.filter((l) => l.startsWith('Q ')).join('\n');
  const timing = (lines.find((l) => l.startsWith('Z ')) ?? 'Z 0 1').split(' ');
  for (let i = 0; i < total; i++) {
    if (got[i] !== expected[i]) {
      const a = expected[i].split(' '),
        b = (got[i] ?? '').split(' ');
      const diffs = names.map((n, k) => (a[k] !== b[k] ? `${n}: engine ${a[k]}, board ${b[k]}` : '')).filter(Boolean);
      return `FAIL  ${id}: tick ${i + 1} of ${total}: ${diffs.slice(0, 4).join('; ')}`;
    }
  }
  if (gotQ !== sounds.join('\n')) {
    const a = sounds,
      b = gotQ ? gotQ.split('\n') : [];
    const k = a.findIndex((l, i) => l !== b[i]);
    return `FAIL  ${id}: sound schedule differs at event ${k < 0 ? Math.min(a.length, b.length) : k + 1} of ${a.length} (engine "${a[k] ?? 'none'}", board "${b[k] ?? 'none'}")`;
  }
  if (timing[2] !== '0') return `FAIL  ${id}: the tone player's steps are off time in ${timing[2]} places`;
  if (sim.ended !== 'won' && limit > 1e8) return `FAIL  ${id}: the walkthrough did not reach the ending on the engine (${sim.ended ?? 'ran out of keys'})`;
  const n = (c: string) => expected.filter((l) => l.split(' ')[2] === c).length;
  return `ok    ${id}: ${total} ticks match (${n('L')} level changes, ${n('D')} deaths, ${n('W')} win), ${sounds.length} sound events match`;
}

let bad = 0;
for (const id of ids) {
  const line = await checkGame(id).catch((e) => `FAIL  ${id}: ${String(e).split('\n')[0]}`);
  if (line.startsWith('FAIL')) bad++;
  console.log(line);
}
console.log(`${ids.length - bad} of ${ids.length} games match the engine tick for tick${bad ? `; ${bad} differ` : ''}`);
process.exit(bad ? 1 : 0);
