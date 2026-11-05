// Pictures of the lessons (never on the disk), for the progress shots and a stranger's look at the art, zoomed:
//   compare.png   Kit and a pip standing on sand, grass and soil: a solid shadow on the top row, a dithered one on the bottom
//   hop.png       the hop's six pictures for each of the three pips, on grass
//   hover.png     the bee's four pictures over its shadow block: right under it, and three blocks up
//   plus views of every room (what preview.ts writes as view-*.png)
//   cd web && npx vite-node ../games/shadows/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { buildAssets } from '../src/assets';
import { GROUNDS, groundColors } from '../src/blocks';
import { BOB_DOWN, HOP_LIFT, beeBody, hopPicture, shadePicture } from '../src/critters';
import { buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal } = buildLevels();
const assets = buildAssets(pal);
const grass = groundColors(pal, 'grass').base;

/** Puts `pic` at (x, y) of `p`, skipping clear pixels. */
const put = (p: Pixels, pic: Pixels, x: number, y: number) => p.blit(pic, x, y, 255);

// compare: three grounds across, two looks down
{
  const p = new Pixels(3 * 80, 2 * 60, 0);
  for (const [row, look] of [
    [0, assets.solid],
    [1, assets.dither],
  ] as const)
    GROUNDS.forEach((g, i) => {
      p.rect(i * 80, row * 60, 80, 60, groundColors(pal, g).base);
      for (let k = 0; k < 30; k++) p.set(i * 80 + ((k * 37) % 80), row * 60 + ((k * 53) % 60), groundColors(pal, g).dark);
      put(p, heroPicture(look.hero, 'stand.top', 'stand'), i * 80 + 8, row * 60 + 18 - 0);
      put(p, look.critters.pics.get('pip0')!, i * 80 + 44, row * 60 + 38);
    });
  writePng(join(out, 'compare.png'), p, pal.pal, 5);
}
// the hop: three rows of six
{
  const p = new Pixels(6 * 24, 3 * 24, grass);
  (['none', 'same', 'shrink'] as const).forEach((kind, r) => HOP_LIFT.forEach((_l, k) => put(p, hopPicture(pal, kind, k), k * 24 + 2, r * 24 + 2)));
  writePng(join(out, 'hop.png'), p, pal.pal, 5);
}
// the hover: the bee over its shadow block (left), and three blocks up (right), in its four bobbing pictures
{
  const p = new Pixels(8 * 24 + 8, 84, groundColors(pal, 'sand').base);
  BOB_DOWN.forEach((d, k) => {
    put(p, beeBody(pal, d, k % 2 === 0), k * 24 + 2, 2);
    put(p, shadePicture(pal, k), k * 24 + 2, 22);
    put(p, beeBody(pal, d, k % 2 === 0), (k + 4) * 24 + 10, 2);
    put(p, shadePicture(pal, k), (k + 4) * 24 + 10, 62);
  });
  writePng(join(out, 'hover.png'), p, pal.pal, 5);
}
console.log(`shots in ${out}`);
