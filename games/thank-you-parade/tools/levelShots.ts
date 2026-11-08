// A whole level as one picture (monsters in place, no hero), for looking at a layout: one PNG per level into <outDir>.
//   cd web && npx vite-node ../games/thank-you-parade/tools/levelShots.ts <outDir> [file ...]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const [out, ...only] = process.argv.slice(2);
if (!out) throw new Error('usage: levelShots.ts <outDir> [file ...]');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
for (const l of levels) {
  if (only.length && !only.includes(l.file)) continue;
  const pic = renderRegion(l.map.done(), l.book.finish(), mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height, []);
  writePng(join(out, `${l.file}.png`), pic, l.pal.pal, 1);
}
console.log(`level pictures in ${out}`);
