// Pictures of the lessons (never on the disk), for the progress shots: Kit under the ledge, the stars,
// Kit on the ledge after a high jump; the canyon, the sneakers and Kit across the canyon.
//   cd web && npx vite-node ../games/power-up/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, LEDGE_ROW, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

/** Kit standing in column `col` with his feet on level row `feet` (the row he stands in), in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, feet = GROUND - 1) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const region = (map: ReturnType<(typeof levels)[0]['map']['done']>, col: number, w: number, extra: ReturnType<typeof kit> = [], top = 1, h = 11) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + top, w, h, extra);

const m1 = levels[0].map.done();
writePng(join(out, 'ledge-1-too-high.png'), region(m1, 8, 16, kit(['stand.top', 'stand'], 15)), pal.pal, 3);
writePng(join(out, 'ledge-2-the-stars.png'), region(m1, 28, 16, kit(['stand.top', 'stand'], 32)), pal.pal, 3);
writePng(join(out, 'ledge-3-high-jump-lands.png'), region(m1, 8, 16, kit(['stand.top', 'stand'], 19, LEDGE_ROW - 1)), pal.pal, 3);

const m2 = levels[1].map.done();
writePng(join(out, 'gap-1-too-wide.png'), region(m2, 22, 16, kit(['stand.top', 'stand'], 28)), pal.pal, 3);
writePng(join(out, 'gap-2-the-sneakers.png'), region(m2, 0, 16, kit(['stand.top', 'stand'], 7)), pal.pal, 3);
writePng(join(out, 'gap-3-across.png'), region(m2, 32, 16, kit(['cheer.top', 'jump'], 39)), pal.pal, 3);
writePng(join(out, 'level-1.png'), renderRegion(m1, bbl, mbl, set, ORIGIN, ORIGIN, levels[0].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-2.png'), renderRegion(m2, bbl, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, 15), pal.pal, 2);
console.log(`shots in ${out}`);
