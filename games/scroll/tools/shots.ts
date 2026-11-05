// Pictures of the lessons (never on the disk), for the progress shots: the screen the first level shows
// (the whole room, which never moves), then three screens of the second level as the view follows Kit.
//   cd web && npx vite-node ../games/scroll/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { L1, L2, SCREEN, buildLevels } from '../src/levels';

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

// level 1: what the screen shows the whole time (Kit in the middle at the start)
const l1 = levels[0].map.done();
writePng(join(out, 'one-1-screen.png'), renderRegion(l1, bbl, mbl, set, ORIGIN, ORIGIN, SCREEN.w, SCREEN.h, kit(L1.start, L1.ground - 1)), pal.pal, 3);

// level 2: the screen at the start, midway and at the end; Kit is in the middle of each as the view follows him
const l2 = levels[1].map.done();
const at = (col: number) => renderRegion(l2, bbl, mbl, set, ORIGIN + col - SCREEN.w / 2, ORIGIN + L2.ground - 6, SCREEN.w, SCREEN.h, kit(col, L2.ground - 1));
for (const [name, col] of [
  ['start', 3],
  ['middle', 30],
  ['end', 54],
] as const)
  writePng(join(out, `two-${name}.png`), at(col), pal.pal, 3);
writePng(join(out, 'level-1.png'), renderRegion(l1, bbl, mbl, set, ORIGIN, ORIGIN, levels[0].map.width, levels[0].map.height), pal.pal, 2);
writePng(join(out, 'level-2.png'), renderRegion(l2, bbl, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, 12), pal.pal, 2);
console.log(`shots in ${out}`);
