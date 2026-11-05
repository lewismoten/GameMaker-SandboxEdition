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
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { buildCornerHeroBlocks } from '../src/cornerHero';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const top = buildCornerHeroBlocks(pal);

/** Kit from above on level block (col, row). */
const kit = (name: string, col: number, row: number) => [{ pixels: Uint8Array.from(top.pics.get(name)!.px), x: ORIGIN + col, y: ORIGIN + row }];
const shot = (file: string, level: number, sprites: ReturnType<typeof kit>) => {
  const l = levels[level];
  const pic = renderRegion(l.map.done(), l.book.finish(), mbl, set, ORIGIN, ORIGIN, 16, 10, sprites);
  writePng(join(out, file), pic, pal.pal, 3);
};
shot('1-start.png', 0, kit('dr.stand', START[0], START[1]));
shot('2-wall.png', 0, kit('dr.stand', 10, 5));
shot('3-round-the-end.png', 0, kit('dr.0', 13, 2));
shot('4-start.png', 1, kit('dl.stand', START[0], START[1]));
shot('5-stair.png', 1, kit('dl.stand', 7, 5));
shot('6-in-front.png', 1, kit('dl.0', 5, 8));

// Kit's four facings, three poses each, on the floor's paper color, enlarged
const sheet = new Pixels(3 * 20 * 4 + 5 * 4, 20, pal.c('parch', 3));
['dr', 'dl', 'ur', 'ul'].forEach((f, i) => ['0', 'stand', '1'].forEach((s, j) => sheet.blit(top.pics.get(`${f}.${s}`)!, i * 64 + j * 20, 0, 255)));
writePng(join(out, 'kit-four-facings.png'), sheet, pal.pal, 8);
shot('7-start.png', 2, kit('dr.stand', START[0], START[1]));
shot('8-up.png', 2, kit('ur.0', 10, 4));
shot('9-exit.png', 2, kit('dr.stand', 12, 5));
console.log(`shots in ${out}`);
