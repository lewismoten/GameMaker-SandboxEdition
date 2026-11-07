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
import { heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND } from '../src/lay';
import { buildLevels } from '../src/levels';
import { buildPennyBlocks } from '../src/look';
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
const hero = heroPicture(buildPennyBlocks(pal), 'stand.top', 'stand');
const shot = (name: string, level: number, col: number, penny: number) => {
  const l = levels[level];
  const sprites = [
    { pixels: Uint8Array.from(hero.px.subarray(0, 400)), x: ORIGIN + penny, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(hero.px.subarray(400)), x: ORIGIN + penny, y: ORIGIN + GROUND - 1 },
  ];
  writePng(join(out, name), renderRegion(l.map.done(), l.book.finish(), mbl, set, ORIGIN + col, ORIGIN, 16, 11, sprites), l.pal.pal, 3);
};
shot('level2-gust.png', 1, 0, 6);
shot('level4-beat.png', 3, 14, 20);
shot('level5-route.png', 4, 12, 24);
shot('level1-pond.png', 0, 54, 60);

for (const [file, frames] of [
  ['parade.fli', [8]],
  ['parade2.fli', [30]],
  ['ending.fli', [20, 35]],
  ['ending2.fli', [10, 30]],
  ['ending3.fli', [25]],
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
