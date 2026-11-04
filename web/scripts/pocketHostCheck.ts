// Checks the Pocket Player's play loop (hardware/pocket-player/src/gmcore.h) against the real engine.
// The walkthrough bot plays First Steps on the engine's headless player; every key it presses is
// written to a script, and the engine's state after each tick (position, sequence, scroll, score and
// a hash of the picture) is recorded. The C++ core is built for the Mac, replays the same keys on the
// same data files, and the two are compared tick by tick. Exits 1 on the first difference.
//   cd web && npx vite-node scripts/pocketHostCheck.ts [--ticks N] [--keep dir]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderWorld, VISIBLE_H, VISIBLE_W } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { play } from '../../games/first-steps/tools/play';
import { GameSim } from '../../games/first-steps/tools/sim';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const limit = Number(opt('--ticks') ?? 1e9);
const work = opt('--keep') ?? mkdtempSync(join(tmpdir(), 'pocket-host-'));
const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;

// A canvas stand-in: the engine's Screen only needs a 2d context to exist.
const canvas = { width: 0, height: 0, getContext: () => ({ createImageData: () => ({ data: new Uint8ClampedArray(320 * 200 * 4) }) }) };
const screen = new Screen(canvas as unknown as HTMLCanvasElement);

const hash = (): number => {
  let h = 2166136261;
  for (let y = 0; y < VISIBLE_H; y++) for (let x = 0; x < VISIBLE_W; x++) h = Math.imul(h ^ screen.pixels[y * 320 + x], 16777619) >>> 0;
  return h;
};

// Record the bot's play: key events and the state after each tick.
const script: string[] = [];
const expected: string[] = [];
let tickNo = 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const P = GameSim.prototype as unknown as Record<string, any>;
const origTick = P.tick;
const origEvent = P.event;
P.event = function (this: GameSim, k: number) {
  if (!this.ended) script.push(`K ${tickNo + 1} ${k}`);
  return origEvent.call(this, k);
};
P.tick = async function (this: GameSim) {
  if (tickNo >= limit) return 'end';
  tickNo++;
  const r = (await origTick.call(this)) as string | undefined;
  const w = this.w;
  renderWorld(screen, w);
  const code = r === 'link' ? 'L' : r === 'dead' ? 'D' : r === 'end' ? 'W' : '-';
  const lv = this.scene - 2;
  const c = w.chr;
  const s = w.scroll;
  expected.push(
    [
      'S',
      tickNo,
      code,
      lv,
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
      hash(),
    ].join(' '),
  );
  return r;
};

try {
  await play();
} catch (e) {
  if (tickNo < limit) throw e; // stopped by --ticks: the bot gives up when the game ends early
}
const total = expected.length;
writeFileSync(join(work, 'keys.txt'), script.join('\n') + `\nT ${total}\n`);
writeFileSync(join(work, 'expected.txt'), expected.join('\n') + '\n');

const exe = join(work, 'hosttest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-Wformat', '-I', here + 'src', here + 'host/hosttest.cpp', '-o', exe], { stdio: 'inherit' });
const got = execFileSync(exe, [here + 'data', join(work, 'keys.txt')], { maxBuffer: 1 << 28 })
  .toString()
  .trim()
  .split('\n');
copyFileSync(join(work, 'expected.txt'), join(work, 'expected.keep.txt'));

const names = 'S tick code level x0 x1 y0 y1 seq frame mx my nx ny lsx lsy score nextx nexty scrx scry hash'.split(' ');
let bad = -1;
for (let i = 0; i < total; i++) {
  if (got[i] !== expected[i]) {
    bad = i;
    break;
  }
}
if (bad >= 0) {
  const a = expected[bad].split(' '),
    b = (got[bad] ?? '').split(' ');
  console.log(`FAIL at tick ${bad + 1} of ${total}`);
  names.forEach((n, k) => {
    if (a[k] !== b[k]) console.log(`  ${n}: engine ${a[k]}, board code ${b[k]}`);
  });
  console.log(`  last matching: ${bad > 0 ? expected[bad - 1] : '(none)'}`);
  process.exit(1);
}
const lastCode = (re: RegExp) => expected.filter((l) => re.test(l)).length;
console.log(
  `OK: ${total} ticks match the engine (position, sequence, scroll, score and the picture hash each tick); ${lastCode(/^S \d+ L /)} level change(s), ${lastCode(/^S \d+ D /)} death(s), ${lastCode(/^S \d+ W /)} win.`,
);
console.log(`files in ${work}`);
