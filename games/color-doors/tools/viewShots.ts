// What Lena's view looks like after a jump and a landing, in the real engine, headless. For each place she
// jumps from (a few ways: Space, Up+Space, Space while walking) it lets the view settle, then reports how far
// the view has scrolled and whether the swatch wall, the names and the lamps are still on screen, and with
// --out <dir> it writes a PNG of each rest view (in the palette of the room, 2x).
//   cd web && npx vite-node ../games/color-doors/tools/viewShots.ts [--out dir] [--view 0..4] [--hall]
// Exits 1 if a landmark is cut off by the top or bottom of the 312x196 picture (the top row of a board may lose 5 pixels of frame).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { renderWorld, VISIBLE_H, VISIBLE_W } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { SCAN } from '../../kit/starter/ids';
import { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { HALL_DOORS, LANDMARK_ROWS, LIGHT_X, SWATCH_X, TABLE_X } from '../src/levels';
import { VIEWS } from '../src/views';
import { GameSim } from './sim';

const arg = (n: string): string | undefined => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const out = arg('--out');
if (out) mkdirSync(out, { recursive: true });
const viewIx = Number(arg('--view') ?? 0);
const inHall = process.argv.includes('--hall');

const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
await bot.wait(5);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const W = (): any => (sim as any).w;
const topPx = (): number => W().my * 20 + W().scroll.ny + W().scroll.littleShifty;
const mapRow = (px: number): number => px / 20 - ORIGIN;

if (!inHall) {
  await bot.walk(HALL_DOORS[viewIx], 'door', 2000);
  await bot.wait(20);
}
const palFile = sim.game.scenes[sim.scene].files[0];
const pal = (sim as unknown as { files: Map<string, Uint8Array> }).files.get(palFile)!;

function shot(name: string): void {
  const canvas = { getContext: () => ({ createImageData: () => ({ data: new Uint8ClampedArray(320 * 200 * 4) }) }) } as unknown as HTMLCanvasElement;
  const fake = new Screen(canvas);
  renderWorld(fake, W());
  const p = new Pixels(VISIBLE_W, VISIBLE_H);
  for (let y = 0; y < VISIBLE_H; y++) for (let x = 0; x < VISIBLE_W; x++) p.px[y * VISIBLE_W + x] = fake.pixels[y * 320 + x];
  if (out) writePng(join(out, `${name}.png`), p, pal, 2);
}

let bad = 0;
const rows = inHall ? LANDMARK_ROWS.hall : LANDMARK_ROWS.gallery;
const spots = inHall ? [6, 9, 11] : [SWATCH_X + 2, SWATCH_X + 10, SWATCH_X + 22, LIGHT_X + 2, TABLE_X + 2];
const tries: [string, boolean, boolean][] = [
  ['space', false, false],
  ['up-space', true, false],
  ['walking', false, true],
];
shot(`${inHall ? 'hall' : 'gallery' + viewIx}-0-before`);
for (const bx of spots) {
  for (const [label, up, walk] of tries) {
    await bot.walk(bx, 'x', 2000);
    await bot.wait(30);
    if (up) sim.press(SCAN.up);
    sim.press(SCAN.space);
    if (walk) sim.press(SCAN.right);
    for (let t = 0; t < 70; t++) {
      if (t === 2) sim.release(SCAN.space);
      if (t === 12) sim.release(SCAN.right);
      await sim.tick();
    }
    sim.release(SCAN.up);
    sim.releaseAll();
    await bot.wait(60);
    const top = mapRow(topPx());
    const cut = rows.filter(([name, a, b]) => a < top - 0.25 || b + 1 > top + VISIBLE_H / 20).map(([name]) => name);
    console.log(
      `x ${bx} ${label}: view top at map row ${top.toFixed(2)}, shows rows ${top.toFixed(1)} to ${(top + VISIBLE_H / 20).toFixed(1)}${cut.length ? '  CUT: ' + cut.join(', ') : ''}`,
    );
    if (cut.length) bad++;
    shot(`${inHall ? 'hall' : 'gallery' + viewIx}-x${bx}-${label}`);
  }
}
if (bad) {
  console.log(`${bad} rest views cut a landmark off`);
  process.exit(1);
}
console.log(`${VIEWS[viewIx].name}: every landmark stays on screen after a jump`);
