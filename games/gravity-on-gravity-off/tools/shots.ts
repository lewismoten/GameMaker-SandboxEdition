// Pictures of the lessons (never on the disk), for the progress shots: level 1 with Kit before the wall and in
// the air over it, level 2 (the same place from above) with Kit at the wall and on the deck, and Kit's four
// facings from above.
//   cd web && npx vite-node ../games/gravity-on-gravity-off/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, PATH_Y, WALL_X, buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../src/topHero';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, topBook, pal, levels } = buildLevels();
const bbl = book.finish();
const tbl = topBook.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);
const top = buildTopHeroBlocks(pal);

/** Kit from the side, with his feet at level block (col, row), as two sprites for renderRegion. */
const side = (pose: [string, string], col: number, row: number) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + row - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + row },
  ];
};
/** Kit from above on level block (col, row). */
const above = (name: string, col: number, row: number) => [{ pixels: Uint8Array.from(top.pics.get(name)!.px), x: ORIGIN + col, y: ORIGIN + row }];

const m1 = levels[0].map.done();
const m2 = levels[1].map.done();
const r1 = (col: number, w: number, extra: ReturnType<typeof side> = []) => renderRegion(m1, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const r2 = (col: number, w: number, extra: ReturnType<typeof above> = []) => renderRegion(m2, tbl, mbl, set, ORIGIN + col, ORIGIN, w, 11, extra);
writePng(join(out, 'on-1-before.png'), r1(8, 14, side(['stand.top', 'stand'], 11, GROUND - 1)), pal.pal, 3);
writePng(join(out, 'on-2-over.png'), r1(8, 14, side(['cheer.top', 'jump'], WALL_X, GROUND - 4)), pal.pal, 3);
writePng(join(out, 'on-3-ledge.png'), r1(17, 14, side(['stand.top', 'stand'], 22, 7)), pal.pal, 3);
writePng(join(out, 'off-1-start.png'), r2(1, 16, above('down.stand', 3, PATH_Y)), pal.pal, 3);
writePng(join(out, 'off-2-wall.png'), r2(8, 16, above('right.stand', WALL_X - 1, PATH_Y)), pal.pal, 3);
writePng(join(out, 'off-3-deck.png'), r2(16, 16, above('right.0', 22, 4)), pal.pal, 3);

// Kit's four facings from above, two strides each
const sheet = new Pixels(5 * 24 + 4, 4 * 24 + 4, pal.r('grass')[2]);
['down', 'up', 'right', 'left'].forEach((f, row) =>
  ['0', 'stand', '1'].forEach((s, col) => sheet.blit(top.pics.get(`${f}.${s}`)!, 4 + col * 24, 4 + row * 24, 255)),
);
writePng(join(out, 'kit-from-above.png'), sheet, pal.pal, 6);
