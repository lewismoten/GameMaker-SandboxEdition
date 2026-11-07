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
import { snowyWalk, pilesUp } from './route';
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
await bot.walk(15);
await bot.jump('right', 19);
shot('one-hop-gap.png');
await bot.walk(22);
await bot.walk(15);
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
// Level 3 from a clean game: the first two lessons, then the open field.
sim.restore(start.snapshot());
await snowyWalk(bot);
await pilesUp(bot);
await bot.wait(40);
shot('three-start.png');
await bot.walk(10);
shot('three-right.png');
await bot.climb('up', 3);
shot('three-up.png');
await bot.walk(7);
shot('three-left.png');
await bot.climb('down', 12);
shot('three-down.png');
// a frame strip of the fade: the trail one beat after he stops, then every ~1.5 s until it is gone
await bot.wait(2);
for (let i = 0; i < 6; i++) {
  shot(`three-fade-${i}.png`);
  await bot.wait(28);
}
console.log(`snow: real-render PNGs in ${out}`);
