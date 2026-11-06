// Pictures of the lessons (never on the disk), for the progress shots: the levers, the dotted planks,
// the built bridge with Kit on it, and the hatch shut and open.
//   cd web && npx vite-node ../games/puzzle-room/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, L1, L2, buildLevels } from '../src/levels';
import { HATCH_CELLS, PLANKS } from '../src/wireBlocks';

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
type Map = ReturnType<(typeof levels)[0]['map']['done']>;
const region = (map: Map, col: number, w: number, extra: ReturnType<typeof kit> = [], top = 2, h = 10) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + top, w, h, extra);
const stand: [string, string] = ['stand.top', 'stand'];

// level 1: the first lever waiting and pulled, the dotted planks, and the whole bridge built with Kit on it
const l1 = levels[0].map;
const l1Waiting = l1.done();
writePng(join(out, 'wired-1-levers.png'), region(l1Waiting, 4, 30, kit(stand, 7)), pal.pal, 3);
writePng(join(out, 'wired-2-dotted-planks.png'), region(l1Waiting, 20, 24, kit(stand, L1.pool - 2)), pal.pal, 3);
l1.set(L1.leverA, GROUND - 1, 'leverRedOn');
writePng(join(out, 'wired-3-first-pulled.png'), region(l1.done(), 4, 30, kit(stand, L1.leverA + 2)), pal.pal, 3);
for (let i = 0; i < PLANKS; i++) l1.set(L1.pool + i, GROUND, 'plank');
writePng(join(out, 'wired-4-bridge-built.png'), region(l1.done(), 20, 24, kit(['cheer.top', 'jump'], L1.pool + 3)), pal.pal, 3);

// level 2: the ledge with the blue lever and the odd red lever, the hatch shut and open, and the blue bridge
const l2 = levels[1].map;
const l2Shut = l2.done();
writePng(join(out, 'wired-5-ledge.png'), region(l2Shut, 6, 28, kit(stand, 14), 2, 10), pal.pal, 3);
writePng(join(out, 'wired-6-hatch-shut.png'), region(l2Shut, 28, 28, kit(stand, L2.hatch - 3)), pal.pal, 3);
for (let i = 0; i < HATCH_CELLS; i++) l2.set(L2.hatch + i, GROUND, 'hatchOpen');
writePng(join(out, 'wired-7-hatch-open.png'), region(l2.done(), 28, 28, kit(stand, L2.hatch - 3)), pal.pal, 3);
writePng(join(out, 'level-1.png'), renderRegion(levels[0].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[0].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-2.png'), renderRegion(levels[1].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, 12), pal.pal, 2);
console.log(`shots in ${out}`);
