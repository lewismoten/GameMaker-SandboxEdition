// Progress PNGs from the real renderer and live map/animation state, not a reconstructed preview.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import { StarterBot } from '../../kit/starter/bot';
import { snowyWalk } from './route';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const sim = new GameSim();
const bot = new StarterBot(sim);
const screen = new Screen(headlessCanvas());
function shot(name: string): void {
  // GameSim loads collision/art data only; the playing scene names its palette in slot 0.
  screen.setPalette(parsePalette(sim.files.get(sim.game.scenes[sim.scene].files[0])!));
  renderWorld(screen, sim.w);
  const p = new Pixels(320, 200);
  p.px.set(screen.pixels);
  writePng(join(out, name), p.crop(0, 0, 312, 196), screen.palette, 3);
}
const title = decodeGif(sim.files.get('title.gif')!);
const p = new Pixels(title.width, title.height);
p.px.set(title.pixels);
writePng(join(out, 'title.png'), p, title.palette, 3);
await bot.walk(6);
shot('one-snow-t0.png');
await bot.wait(5);
shot('one-snow-t5.png');
await bot.walk(12);
await bot.jump('right', 16);
shot('one-hop-gap.png');
await bot.walk(20);
await bot.walk(12);
shot('one-footprints.png');
// Replay the first route from a clean game so level 2 starts on the normal door link.
const start = new GameSim();
sim.restore(start.snapshot());
await snowyWalk(bot);
await bot.walk(7);
shot('two-drift-early.png');
await bot.wait(54);
shot('two-drift-deep.png');
await bot.walk(19);
await bot.walk(14);
shot('two-snow-drift-footprints.png');
console.log(`snow: 8 real-render PNGs in ${out}`);
