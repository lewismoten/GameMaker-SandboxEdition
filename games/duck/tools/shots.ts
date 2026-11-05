// Pictures of the lessons (never on the disk), for the progress shots: the screen at each key moment, with Kit and the fliers in
// place, and each level's whole map.
//   cd web && npx vite-node ../games/duck/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks2 } from '../src/hero';
import { L1, L2, buildLevels } from '../src/levels';
import { buildMonsterBlocks, buildMonsters } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks2(pal);

/** Kit in column `col` (pixels `dx` right of it) with his feet on level row `feet`: standing, or ducking (only the bottom picture). */
const kit = (col: number, feet: number, pose: 'stand' | 'duck' | 'hurt' = 'stand', dx = 0) => {
  const h = pose === 'hurt' ? heroPicture(hero, 'hurt.top', 'hurt') : heroPicture(hero, 'stand.top', 'stand');
  const bottom = pose === 'duck' ? hero.pics.get('duck1')!.px : h.px.subarray(400);
  const parts = [{ pixels: Uint8Array.from(bottom), x: ORIGIN + col + dx / 20, y: ORIGIN + feet }];
  if (pose !== 'duck') parts.unshift({ pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col + dx / 20, y: ORIGIN + feet - 1 });
  return parts;
};
const maps = levels.map((l) => l.map.done());
/** Puts every monster of level `i` where the shot wants it: `where[k]` is the k-th one's column (pixels allowed). */
const place = (i: number, where: Record<number, number>) => {
  const m = maps[i];
  for (const [k, col] of Object.entries(where)) m.monsters[+k].curx = ORIGIN + Math.floor(col);
};
const screen = (i: number, col: number, row: number, ...sprites: ReturnType<typeof kit>[]) =>
  renderRegion(maps[i], bbl, mbl, set, ORIGIN + col, ORIGIN + row, 16, 10, sprites.flat());

const G1 = L1.ground;
place(0, { 0: 23 });
writePng(join(out, 'one-1-a-bird-comes.png'), screen(0, 12, 3, kit(15, G1 - 1)), pal.pal, 3);
place(0, { 0: 17 });
writePng(join(out, 'one-2-ducking-the-bird-flies-over.png'), screen(0, 12, 3, kit(17, G1 - 1, 'duck')), pal.pal, 3);
writePng(join(out, 'one-3-standing-it-hits.png'), screen(0, 12, 3, kit(17, G1 - 1, 'hurt')), pal.pal, 3);
const G2 = L2.ground;
place(1, { 0: 20, 1: 38 });
writePng(join(out, 'two-1-ball-rolls-in.png'), screen(1, 29, 3, kit(34, G2 - 1)), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
