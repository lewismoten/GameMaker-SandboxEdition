// Design previews (never on the disk): the title, a talk page, the block sets and a stretch of
// each map, as PNGs in a folder you name.
//   cd web && npx vite-node ../games/lark/tools/preview.ts <folder>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '../../../web/src/formats/gif';
import { MLEN } from '../../../web/src/formats/map';
import { Pixels } from '../../kit/pixels';
import { blockSheet, writePng } from '../../kit/png';
import { buildPalette } from '../src/art/pal';
import { compile } from '../src/game';

const out = process.argv[2];
if (!out) throw new Error('name a folder for the previews');
const disk = new URL('../disk/', import.meta.url);
for (const name of ['title', 'menu', 'talkleo7', 'card1', 'story']) {
  const img = decodeGif(new Uint8Array(readFileSync(new URL(`${name}.gif`, disk))));
  const p = new Pixels(img.width, img.height);
  p.px.set(img.pixels);
  writePng(join(out, `${name}.png`), p, img.palette, 2);
}
const all = compile();
for (const [name, set] of Object.entries(all.sets)) writePng(join(out, `${name}.png`), blockSheet(set.build().slice(0, 60)), buildPalette('day').pal, 3);
for (const pl of all.places.filter((p) => p.file !== 'pass')) {
  const set = all.sets[pl.set].build();
  const w = pl.stamped.width;
  const h = pl.stamped.height;
  const p = new Pixels(w * 20, h * 20);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const b = set[pl.stamped.map.blocks[(y + 2) * MLEN + x + 2]];
      for (let k = 0; k < 400; k++) p.set(x * 20 + (k % 20), y * 20 + Math.floor(k / 20), b.pixels[k]);
    }
  writePng(join(out, `map-${pl.file}.png`), p, buildPalette(pl.light).pal, 1);
}
console.log(`previews -> ${out}`);
