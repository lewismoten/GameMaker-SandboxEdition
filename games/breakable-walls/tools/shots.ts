// Pictures of the lessons (never on the disk), for the progress shots: a wall of crates, the rubble
// after a bump (the top crates stay), the coin that stays a coin, and the spinning gem's four frames.
//   cd web && npx vite-node ../games/breakable-walls/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, L1, L2, L3, buildLevels } from '../src/levels';
import { finishBlocks } from '../src/breakBlocks';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = finishBlocks(book);
const bbl2 = finishBlocks(levels[1].book);
const bbl3 = finishBlocks(levels[2].book);
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
const region = (level: number, map: Map, col: number, w: number, extra: ReturnType<typeof kit> = [], top = 2, h = 10) =>
  renderRegion(map, [bbl, bbl2, bbl3][level], mbl, set, ORIGIN + col, ORIGIN + top, w, h, extra);
const stand: [string, string] = ['stand.top', 'stand'];

// level 1: the wall, then the rubble after the bump
const l1 = levels[0].map;
writePng(join(out, 'smash-1-wall.png'), region(0, l1.done(), 8, 24, kit(stand, L1.wallA - 2)), pal.pal, 3);
for (const j of [1, 2]) l1.set(L1.wallA, GROUND - j, 'rubble');
writePng(join(out, 'smash-2-rubble.png'), region(0, l1.done(), 8, 24, kit(['cheer.top', 'jump'], L1.wallA + 2)), pal.pal, 3);

// level 2: the coin that stays a coin, and the ordinary coins past it
const l2 = levels[1].map.done();
writePng(join(out, 'coins-1-stuck.png'), region(1, l2, 6, 26, kit(stand, L2.stuck[0] - 2)), pal.pal, 3);

// level 3: the gem's four frames, then the row of gems
const l3 = levels[2].map.done();
writePng(join(out, 'gems-1-row.png'), region(2, l3, 8, 26, kit(stand, L3.gems[0] - 2)), pal.pal, 3);
writePng(join(out, 'level-1.png'), renderRegion(levels[0].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[0].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-2.png'), renderRegion(l2, bbl2, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-3.png'), renderRegion(l3, bbl3, mbl, set, ORIGIN, ORIGIN, levels[2].map.width, 12), pal.pal, 2);
console.log(`shots in ${out}`);
