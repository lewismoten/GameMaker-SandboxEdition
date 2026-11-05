// Pictures of the three rooms (never on the disk), for the progress shots: level 1's pads, level 2's crowd and
// level 3's sky at two frames of its drift.
//   cd web && npx vite-node ../games/slow-computers/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels, finishBlocks } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const view = (i: number, col: number, name: string, frame?: string) => {
  const l = levels[i];
  const m = l.map.done();
  if (frame) {
    const from = l.book.n('bz.start');
    const to = l.book.n(`bz.${frame}`);
    for (let k = 0; k < m.blocks.length; k++) if (m.blocks[k] === from) m.blocks[k] = to;
  }
  writePng(join(out, name), renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN, 16, 11), pal.pal, 3);
};
view(0, 14, '1-pads.png');
view(1, 10, '2-crowd.png');
view(2, 2, '3-sky-frame-0.png', 'f0');
view(2, 2, '3-sky-frame-4.png', 'f4');
console.log(`shots in ${out}`);
