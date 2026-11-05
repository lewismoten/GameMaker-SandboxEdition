// Real frames from the engine (the way PLAYGAME draws the scene the simulator is in), as PNGs: each level at its
// start and with Kit stopped at the wall or the stair. It shows what the player sees, the view's alignment included.
//   cd web && npx vite-node ../games/corner-view/tools/frames.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { cornerRoom, towers } from './route';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: frames.ts <outDir>');
mkdirSync(out, { recursive: true });
let sim = new GameSim(undefined, 1);
let bot = new StarterBot(sim);

function snap(file: string): void {
  const screen = new Screen(headlessCanvas());
  const pal = sim.files.get(sim.game.scenes[sim.scene].files[0]) ?? sim.w.palette;
  screen.setPalette(pal);
  renderWorld(screen, sim.w);
  const p = new Pixels(320, 200);
  p.px.set(screen.pixels);
  writePng(join(out, file), p, pal, 3);
}

await bot.wait(8);
snap('engine-1-start.png');
sim.press(SCAN.right);
await bot.wait(60);
sim.release(SCAN.right);
await bot.wait(4);
snap('engine-2-at-the-wall.png');
// to the far upper right corner: does the view stay where it is?
sim.press(SCAN.up);
await bot.wait(120);
sim.release(SCAN.up);
sim.press(SCAN.right);
await bot.wait(200);
sim.release(SCAN.right);
await bot.wait(4);
snap('engine-3-top-right.png');
// level 3 on the engine: at the start, then walking Up (upper right) and Right (lower right)
sim = new GameSim(undefined, 1);
bot = new StarterBot(sim);
await cornerRoom(bot);
await towers(bot);
await bot.wait(30);
snap('engine-4-level3-start.png');
sim.press(SCAN.up);
await bot.wait(24);
snap('engine-5-level3-up-walking.png');
sim.release(SCAN.up);
sim.press(SCAN.right);
await bot.wait(8);
snap('engine-6-level3-right-walking.png');
sim.release(SCAN.right);
console.log(`frames in ${out}`);
