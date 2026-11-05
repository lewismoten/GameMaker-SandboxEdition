// Pictures of the lessons (never on the disk), for the progress shots: each level with Kit on his start pad, and
// at the wall of cubes and in front of the stair of towers, drawn the way the screen shows them.
//   cd web && npx vite-node ../games/corner-view/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { START, buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../src/topHero';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const top = buildTopHeroBlocks(pal);

/** Kit from above on level block (col, row). */
const kit = (name: string, col: number, row: number) => [{ pixels: Uint8Array.from(top.pics.get(name)!.px), x: ORIGIN + col, y: ORIGIN + row }];
const shot = (file: string, level: number, sprites: ReturnType<typeof kit>) => {
  const l = levels[level];
  const pic = renderRegion(l.map.done(), l.book.finish(), mbl, set, ORIGIN, ORIGIN, 16, 10, sprites);
  writePng(join(out, file), pic, pal.pal, 3);
};
shot('1-start.png', 0, kit('down.stand', START[0], START[1]));
shot('2-wall.png', 0, kit('right.stand', 10, 5));
shot('3-round-the-end.png', 0, kit('right.0', 13, 2));
shot('4-start.png', 1, kit('left.stand', START[0], START[1]));
shot('5-stair.png', 1, kit('left.stand', 7, 5));
shot('6-in-front.png', 1, kit('left.0', 5, 8));
console.log(`shots in ${out}`);
