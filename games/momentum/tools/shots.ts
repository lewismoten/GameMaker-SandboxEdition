// Pictures of the lessons (never on the disk), for the progress shots: the screen at each level's key moment,
// with Kit in it, and each level's whole map.
//   cd web && npx vite-node ../games/momentum/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { L1, L2, buildLevels } from '../src/levels';

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

writePng(join(out, 'one-1-hop.png'), screen(0, 3, 5, kit(13, L1.wallTop - 1)), pal.pal, 3);
writePng(join(out, 'one-2-lifting.png'), screen(0, 22, 0, kit(28, 7)), pal.pal, 3);
writePng(join(out, 'one-3-on-the-cliff.png'), screen(0, 30, 0, kit(33, L1.cliffTop - 1)), pal.pal, 3);
writePng(join(out, 'two-1-dash-over-the-gap.png'), screen(1, 36, 2, kit(44, 8)), pal.pal, 3);
writePng(join(out, 'two-2-before-the-widest-gap.png'), screen(1, 33, 2, kit(40, L2.ground - 1)), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
