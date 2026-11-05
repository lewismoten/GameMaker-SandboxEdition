// Pictures of the lessons (never on the disk), for the progress shots: a real wall beside a picture
// of one, the loose wall cracking and crumbling, and the wall with coins showing in it.
//   cd web && npx vite-node ../games/secret-doors/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { GROUND, L1, L2, L3, buildLevels } from '../src/levels';

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

// level 1: the real wall and the picture of a wall, side by side (they look the same), then Kit inside the picture
const l1 = levels[0].map.done();
writePng(join(out, 'wall-1-alike.png'), region(l1, 14, 26, kit(stand, L1.real - 2)), pal.pal, 3);
writePng(join(out, 'wall-2-inside.png'), region(l1, 28, 14, kit(['cheer.top', 'jump'], L1.fake)), pal.pal, 3);

// level 2: the loose wall, then the cracked block Kit walks into
const l2 = levels[1].map;
writePng(join(out, 'crack-1-loose.png'), region(l2.done(), 12, 14, kit(stand, L2.wallA - 2)), pal.pal, 3);
for (const j of [1, 2]) l2.set(L2.wallA, GROUND - j, 'cracked');
writePng(join(out, 'crack-2-cracked.png'), region(l2.done(), 12, 14, kit(stand, L2.wallA - 1)), pal.pal, 3);
for (const j of [1, 2]) l2.set(L2.wallA, GROUND - j, 'chips');
writePng(join(out, 'crack-3-chips.png'), region(l2.done(), 12, 14, kit(['cheer.top', 'jump'], L2.wallA + 1)), pal.pal, 3);

// level 3: the wall with coins showing in it
const l3 = levels[2].map.done();
writePng(join(out, 'window-1-coins.png'), region(l3, 24, 16, kit(stand, L3.x - 3)), pal.pal, 3);
writePng(join(out, 'level-1.png'), renderRegion(levels[0].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[0].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-2.png'), renderRegion(levels[1].map.done(), bbl, mbl, set, ORIGIN, ORIGIN, levels[1].map.width, 12), pal.pal, 2);
writePng(join(out, 'level-3.png'), renderRegion(l3, bbl, mbl, set, ORIGIN, ORIGIN, levels[2].map.width, 12), pal.pal, 2);
console.log(`shots in ${out}`);
