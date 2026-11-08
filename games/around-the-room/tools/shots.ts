// Pictures of the lessons (never on the disk), for the progress shots: each room as the player's screen (16 by 10
// blocks) with the hero standing at the start and before the first trench, and each level's whole map.
//   cd web && npx vite-node ../games/around-the-room/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildRoomHeroBlocks } from '../src/hero';
import { buildLevels } from '../src/levels';
import { roomPalette } from '../src/palettes';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);

levels.forEach((l, i) => {
  const bbl = l.book.finish();
  const hero = buildRoomHeroBlocks(pal, l.frame).pics.get('fs')!;
  const map = l.map.done();
  const view = (u: number, h = 0) => {
    const [x, y] = l.frame.at(u, h);
    const sprite = { pixels: Uint8Array.from(hero.px), x: ORIGIN + x, y: ORIGIN + y };
    return renderRegion(map, bbl, mbl, set, ORIGIN + x - 8, ORIGIN + y - 5, 16, 10, [sprite]);
  };
  const first = l.course.trenches[0][0];
  writePng(join(out, `room-${i + 1}-start.png`), view(5), roomPalette(pal, l.frame.k), 3);
  writePng(join(out, `room-${i + 1}-trench.png`), view(first - 1), roomPalette(pal, l.frame.k), 3);
  writePng(join(out, `room-${i + 1}-map.png`), renderRegion(map, bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), roomPalette(pal, l.frame.k), 1);
});
console.log(`shots in ${out}`);
