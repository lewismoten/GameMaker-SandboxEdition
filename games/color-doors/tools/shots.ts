// Pictures for the progress shots (never on the disk): the gallery's swatch wall and the traffic light and fruit, in each view's
// palette, side by side, with Kit standing in the middle; plus the hall.
//   cd web && npx vite-node ../games/color-doors/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { VIEWS, viewPalette } from '../src/views';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, hall, gallery } = buildLevels();
const bbl = book.finish();
const spots: [string, typeof hall, number, number][] = [
  ['hall', hall, 0, 16],
  ['swatches', gallery, 11, 16],
  ['light-and-fruit', gallery, 44, 16],
];
for (const v of VIEWS)
  for (const [name, level, col, w] of spots) {
    const pic = renderRegion(level.map.done(), bbl, [], [], ORIGIN + col, ORIGIN, w, 12);
    writePng(join(out, `${name}-${v.file.replace('.pal', '')}.png`), pic, viewPalette(pal.pal, v.kind), 3);
  }
console.log(`shots in ${out}`);
