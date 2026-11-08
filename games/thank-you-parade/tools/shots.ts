// Pictures of the game (never on the disk), for the progress shots: the title, a stretch of the parade route with Penny,
// and frames of the intro and the ending cartoons.
//   cd web && npx vite-node ../games/thank-you-parade/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';

import { ORIGIN } from '../../kit/starter/map';
import { GROUND } from '../src/lay';
import { buildLevels } from '../src/levels';
import { figure } from '../src/figure';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const disk = new URL('../disk/', import.meta.url);

const g = decodeGif(readFileSync(new URL('title.gif', disk)));
const t = new Pixels(g.width, g.height);
t.px.set(g.pixels);
writePng(join(out, 'title.png'), t, g.palette, 3);

const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const shot = (name: string, level: number, col: number, penny: number, y = GROUND - 2) => {
  const l = levels[level];
  const hero = figure(l.pal, l.hero ?? 'penny', 'stand');
  const top = y > 10 ? y - 8 : 0;
  const sprites = [
    { pixels: Uint8Array.from(hero.px.subarray(0, 400)), x: ORIGIN + penny, y: ORIGIN + y },
    { pixels: Uint8Array.from(hero.px.subarray(400)), x: ORIGIN + penny, y: ORIGIN + y + 1 },
  ];
  writePng(join(out, name), renderRegion(l.map.done(), l.book.finish(), mbl, set, ORIGIN + col, ORIGIN + top, 16, 11, sprites), l.pal.pal, 3);
};
shot('calltime-tree.png', 0, 22, 25);
shot('calltime-pond.png', 0, 54, 60);
shot('gust-street.png', 1, 0, 6);
shot('bakery-roofs.png', 2, 8, 12, 20);
shot('bakery-tower.png', 2, 40, 47, 8);
shot('airstrip-hangar.png', 3, 0, 10, 3);
shot('airstrip-bales.png', 3, 24, 33, 4);
shot('creek-bridge.png', 4, 22, 28, 14);
shot('creek-bed.png', 4, 34, 40, 20);
shot('float-hall.png', 5, 6, 12);
shot('hall-shelves.png', 6, 18, 26, 22);
shot('hall-basement.png', 6, 44, 52, 28);
shot('drumoff-cannons.png', 7, 36, 42);
shot('route-judges.png', 8, 18, 24);
shot('stands-rows.png', 9, 24, 30, 14);
shot('truck-boss.png', 10, 60, 66, 14);
shot('stepoff-llamas.png', 11, 42, 47);

for (const [file, frames] of [
  ['parade.fli', [20]],
  ['parade2.fli', [10]],
  ['parade3.fli', [10]],
  ['ending.fli', [30]],
  ['ending3.fli', [20]],
  ['ending5.fli', [10]],
] as const) {
  const anim = parseFli(readFileSync(new URL(file, disk)));
  const canvas = newFliCanvas(anim);
  for (let n = 0; n < anim.frameCount; n++) {
    applyFliFrame(anim, n, canvas);
    if ((frames as readonly number[]).includes(n)) {
      const p = new Pixels(anim.width, anim.height);
      p.px.set(canvas.pixels);
      writePng(join(out, `${file.replace('.fli', '')}-frame${n}.png`), p, canvas.palette, 3);
    }
  }
}
console.log(`shots in ${out}`);
