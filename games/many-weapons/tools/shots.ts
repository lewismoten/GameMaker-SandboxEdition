// Pictures of the lessons (never on the disk), for the progress shots: the screen at each level's key moment,
// with Kit in it, and each level's whole map.
//   cd web && npx vite-node ../games/many-weapons/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { cameraTop, renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { heroPicture } from '../../kit/starter/hero';
import { buildWeaponHeroBlocks } from '../src/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { L2, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildWeaponHeroBlocks(pal);

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
const screen = (i: number, col: number, row: number | null, ...sprites: ReturnType<typeof kit>[]) =>
  renderRegion(maps[i], bbl, mbl, set, ORIGIN + col, row === null ? cameraTop(sprites.flat()) : ORIGIN + row, 16, 10, sprites.flat());

/** A monster picture as a sprite at level block (col, row). */
const thing = (name: string, col: number, row: number) => [{ pixels: Uint8Array.from(mb.pics.get(name)!.px), x: ORIGIN + col, y: ORIGIN + row }];
const feet = 9;
writePng(join(out, 'one-1-empty-hands.png'), screen(0, 2, null, kit(8, feet)), pal.pal, 3);
writePng(join(out, 'one-2-a-star-flies.png'), screen(0, 11, 3, kit(16, feet), thing('star0', 18, feet)), pal.pal, 3);
writePng(join(out, 'two-1-a-star-on-frost.png'), screen(1, 16, 3, kit(22, feet), thing('star1', 24, feet)), pal.pal, 3);
writePng(join(out, 'two-2-the-ledge.png'), screen(1, 8, null, kit(17, L2.ledgeRow - 1)), pal.pal, 3);
writePng(join(out, 'two-3-a-flame-flies.png'), screen(1, 16, 3, kit(22, feet), thing('flame0', 24, feet)), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
