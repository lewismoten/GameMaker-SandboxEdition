// Pictures of the lessons (never on the disk), for the progress shots: Kit stopped by the table facing it, his four
// facings, the meadow as it opens, the village house, the shop, and the whole world map.
//   cd web && npx vite-node ../games/overhead/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildTopHeroBlocks } from '../../kit/starter/topHero';
import { TABLE, area, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const top = buildTopHeroBlocks(pal);
const topBl = top.finish();
const save = (name: string, pic: Pixels | ReturnType<typeof renderRegion>, scale = 3) => writePng(join(out, name), pic, pal.pal, scale);
/** Kit in `pose` (`right.stand`, ...) standing in level block (x, y). */
const kit = (pose: string, x: number, y: number) => [{ pixels: Uint8Array.from(topBl[top.n(pose)].pixels), x: ORIGIN + x, y: ORIGIN + y }];
/** The screen around level block (cx, cy), as the game shows it. */
const screen = (level: number, cx: number, cy: number, sprites: ReturnType<typeof kit>) =>
  renderRegion(levels[level].map.done(), bbl, mbl, set, ORIGIN + cx - 8, ORIGIN + cy - 5, 16, 10, sprites);

// level 1: Kit facing the table he cannot walk through
save('1-table.png', screen(0, TABLE.x - 2, TABLE.y, kit('right.stand', TABLE.x - 1, TABLE.y + 1)));
// his four facings, on the room's floor
const sheet = new Pixels(4 * 24 + 4, 28, pal.r('wood')[3]);
['down', 'up', 'left', 'right'].forEach((f, i) => sheet.blit(top.pics.get(`${f}.stand`)!, 4 + i * 24, 4, 255));
save('2-four-facings.png', sheet, 8);
// level 2: the meadow as it opens, the village with its door, the shop, and the whole map
const meadow = area('meadow');
const village = area('village');
const shop = area('shop');
const at = (a: { landing: [number, number] }): [number, number] => [a.landing[0] - ORIGIN, a.landing[1] - ORIGIN];
save('3-meadow.png', screen(1, ...at(meadow), kit('down.stand', ...at(meadow))));
save('4-village.png', screen(1, ...at(village), kit('up.stand', village.rl + 8, village.rt + 3)));
save('5-shop.png', screen(1, ...at(shop), kit('left.stand', shop.rl + 6, shop.rt + 5)));
save('6-the-roads.png', renderRegion(levels[1].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, levels[1].map.height), 2);
