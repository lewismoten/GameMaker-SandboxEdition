// Pictures of the lessons (never on the disk), for the progress shots: the screen at each level's key moment,
// with Kit in it, and each level's whole map.
//   cd web && npx vite-node ../games/swim/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { L1, L2, L3, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit standing in column `col` with his feet on level row `feet`, as two sprites for renderRegion. */
const kit = (col: number, feet: number) => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const maps = levels.map((l) => l.map.done());
/** One 16 by 10 block screen of level `i` with its top left at (col, row). */
const screen = (i: number, col: number, row: number, ...sprites: ReturnType<typeof kit>[]) =>
  renderRegion(maps[i], bbl, mbl, set, ORIGIN + col, ORIGIN + row, 16, 10, sprites.flat());

writePng(join(out, 'one-1-bank.png'), screen(0, 0, 2, kit(3, L1.ground - 1)), pal.pal, 3);
writePng(join(out, 'one-2-in-the-creek.png'), screen(0, 8, 2, kit(L1.creek[0], L1.ground + 1)), pal.pal, 3);
writePng(join(out, 'one-3-on-a-stone.png'), screen(0, 12, 2, kit(L1.stones[1], L1.ground - 1)), pal.pal, 3);
writePng(join(out, 'two-1-floating.png'), screen(1, 10, 2, kit(20, L2.ground)), pal.pal, 3);
writePng(join(out, 'three-1-the-bottom.png'), screen(2, 20, 3, kit(L3.pool[1] + 1, L3.floor - 1)), pal.pal, 3);
writePng(join(out, 'three-2-at-the-top.png'), screen(2, 4, 2, kit(10, L3.top)), pal.pal, 3);
levels.forEach((l, i) => writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2));
console.log(`shots in ${out}`);
