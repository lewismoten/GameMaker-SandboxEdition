// Pictures of the lessons (never on the disk), for the progress shots: the screen at each level's key moment,
// with Kit in it, and each level's whole map.
//   cd web && npx vite-node ../games/jump-boots/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { cameraTop, renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
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
const kit = (col: number, feet: number, top = 'stand.top', bottom = 'stand') => {
  const h = heroPicture(hero, top, bottom);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const maps = levels.map((l) => l.map.done());
/** One 16 by 10 block screen of level `i` with its top left at (col, row). */
const screen = (i: number, col: number, row: number | null, ...sprites: ReturnType<typeof kit>[]) =>
  renderRegion(maps[i], bbl, mbl, set, ORIGIN + col, row === null ? cameraTop(sprites.flat()) : ORIGIN + row, 16, 10, sprites.flat());

writePng(join(out, 'one-1-the-foot-of-the-cliff.png'), screen(0, 8, null, kit(19, L1.ground - 1)), pal.pal, 3);
writePng(join(out, 'one-2-tapping-up.png'), screen(0, 14, 6, kit(19, 14, 'up.top', 'jumpup')), pal.pal, 3);
writePng(join(out, 'one-3-across-the-gap.png'), screen(0, 30, 0, kit(38, 4, 'cheer.top', 'jump')), pal.pal, 3);
writePng(join(out, 'two-1-the-blue-bubbles.png'), screen(1, 4, null, kit(8, L2.ground - 1)), pal.pal, 3);
writePng(join(out, 'two-2-the-tall-step.png'), screen(1, 18, null, kit(26, L2.ground - 1)), pal.pal, 3);
writePng(join(out, 'two-3-over-the-pit.png'), screen(1, 38, 7, kit(46, 12, 'cheer.top', 'jump')), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
