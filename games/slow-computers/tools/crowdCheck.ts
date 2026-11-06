// Actual 312x196 crowd visibility, support and jump/return camera regression on the built disk.
// Optional output folder receives 2x gameplay PNGs, including 73 consecutive 18.2 Hz frames.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import { StarterBot } from '../../kit/starter/bot';
import { MON, SCAN } from '../../kit/starter/ids';
import { SOLID } from '../../kit/starter/book';
import { GameSim } from './sim';
import { shortAndLong } from './route';
import { replay } from '../../kit/walkthrough';
import { rectInView } from '../../kit/inView';
import type { Walkthrough } from '../../../web/src/walkthrough/format';

const out = process.argv[2];
if (out) mkdirSync(out, { recursive: true });
const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
await shortAndLong(bot);
assert.equal(sim.scene, 3);
await bot.walk(15, 'the crowd');
const screen = new Screen(headlessCanvas());
screen.setPalette(parsePalette(sim.files.get(sim.game.scenes[3].files[0])!));
const shot = (name: string) => {
  renderWorld(screen, sim.w);
  if (!out) return;
  const p = new Pixels(312, 196);
  for (let y = 0; y < 196; y++) p.px.set(screen.pixels.subarray(y * 320, y * 320 + 312), y * 312);
  writePng(join(out, `${name}.png`), p, screen.palette, 2);
};
shot('standing');
const hp = sim.ci.hitpts;
// No orphaned platform collision; the roof and the whole cave floor remain visible earth.
for (let x = 11; x <= 27; x++) {
  assert.equal(sim.shown(x + 10, 16).solid, 0);
  assert.equal(sim.shown(x + 10, 20).solid, SOLID);
  assert.equal(sim.shown(x + 10, 23).solid, SOLID);
  assert.equal(sim.shown(x + 10, 21).solid, 0);
  assert.equal(sim.shown(x + 10, 22).solid, 0);
}
const errors = new Set<string>();
const tops: number[] = [];
let frames = 0;
const check = () => {
  const w = sim.w;
  renderWorld(screen, w);
  const slots = w.mm.map((m, i) => ({ m, i })).filter(({ m }) => m.monnum <= MON.shelly);
  assert.equal(slots.length, 36);
  assert.equal(sim.ci.hitpts, hp);
  assert.equal(sim.deaths, 0);
  if (bot.px.y !== 180) return;
  frames++;
  tops.push((w.my - 10) * 20 + w.scroll.ny + w.scroll.littleShifty);
  for (const { m, i } of slots) {
    const mi = w.mi[i];
    const x = mi.scrPos.x - w.scroll.littleShiftx;
    const y = mi.scrPos.y - w.scroll.littleShifty;
    if (x < 0 || x + 20 > 312 || y < 0 || y + 20 > 196 || !mi.picDrawn) errors.add(`monster ${i} type ${m.monnum} clipped at ${x},${y}`);
    if (m.monnum === MON.shelly) {
      const cx = mi.curx[0],
        cy = mi.cury[0];
      if (cy !== 22 || (w.bg[w.map[(cy + 1) * 100 + cx]].solid & SOLID) !== SOLID) errors.add(`snail ${i} unsupported/outside cave at ${cx},${cy}`);
    }
  }
};
for (let i = 0; i < 120; i++) {
  await bot.tick();
  check();
  if (i < 73) shot(`frame-${String(i).padStart(3, '0')}`);
}
for (let j = 0; j < 3; j++) {
  // Space may be tapped again in the air (PLAYGAME has no ground check). This
  // crosses the vertical scroll threshold; a single small hop need not do so.
  sim.press(SCAN.space);
  await bot.wait(2);
  sim.release(SCAN.space);
  await bot.wait(8);
  sim.press(SCAN.space);
  await bot.wait(2);
  sim.release(SCAN.space);
  await bot.land();
  for (let i = 0; i < 120; i++) {
    await bot.tick();
    check();
  }
  shot(`jump-return-${j}`);
}
console.log(JSON.stringify({ frames, viewTopPixels: [Math.min(...tops), Math.max(...tops)], errors: [...errors] }, null, 2));
assert.deepEqual([...errors], []);
assert.ok(Math.max(...tops) >= 120, 'exercise downward scroll after returning from a jump');
console.log('crowd: all 36 fully visible and harmless; eight snails supported; three jump/return cycles');

// The whole-scene CLI also includes the far-away entrance and exit. Check its
// exact rectangle predicate at the walkthrough's crowd pause, not just in GameSim.
let crowdFrames = 0;
const signFrames = [0, 0];
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8')) as Walkthrough;
const result = await replay('slow-computers', walk, {
  onWorld(w, scene) {
    if (scene !== 3 || w.chr.y[0] !== 19 || w.chr.y[1] !== 0) return;
    const x = (w.chr.x[0] - 10) * 20 + w.chr.x[1];
    if (x === 300) {
      assert.ok(rectInView(w, [22, 17, 13, 2]), 'upper bee row and bob envelope');
      assert.ok(rectInView(w, [22, 18, 13, 2]), 'lower bee row and bob envelope');
      crowdFrames++;
    }
    for (const [i, col] of [6, 29].entries())
      if (x === col * 20) {
        assert.ok(rectInView(w, [i ? 38 : 15, 15, 4, 4]), 'the sign is readable at its pause');
        signFrames[i]++;
      }
  },
});
assert.equal(result.won, true);
assert.equal(result.keysLeft, 0);
assert.equal(result.error, undefined);
assert.ok(crowdFrames >= 70);
assert.ok(signFrames.every((n) => n >= 60));
console.log(JSON.stringify({ walkthroughCrowdFrames: crowdFrames, signFrames, won: result.won }));
