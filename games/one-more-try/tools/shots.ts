// Pictures of the lessons (never on the disk), for the progress shots: Kit in the pit with the post,
// and the three ways back out of a pit in level 2.
//   cd web && npx vite-node ../games/one-more-try/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { DEPTH, GROUND, L1, L2, buildLevels } from '../src/levels';

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

const floor = GROUND + DEPTH - 1;

// level 1: the pit with its post and coin, then Kit at the bottom looking up
const l1 = levels[0].map.done();
writePng(join(out, 'post-1-pit.png'), region(l1, 17, 16, kit(stand, L1.pit - 2)), pal.pal, 3);
writePng(join(out, 'post-2-inside.png'), region(l1, 20, 12, kit(['cheer.top', 'jump'], L1.pit + 1, floor), 4, 11), pal.pal, 3);

// level 2: a pit for each way back
const l2 = levels[1].map.done();
writePng(join(out, 'back-1-ladder.png'), region(l2, L2.ladder.pit - 2, 8, kit(stand, L2.ladder.pit + 1, floor), 4, 11), pal.pal, 4);
writePng(join(out, 'back-2-planks.png'), region(l2, L2.steps.pit - 2, 8, kit(stand, L2.steps.pit + 1, floor), 4, 11), pal.pal, 4);
writePng(join(out, 'back-3-blocks.png'), region(l2, L2.stairs.pit - 2, 8, kit(stand, L2.stairs.pit + 1, floor), 4, 11), pal.pal, 4);
for (const [i, m] of [l1, l2].entries())
  writePng(join(out, `level-${i + 1}.png`), renderRegion(m, bbl, mbl, set, ORIGIN, ORIGIN, levels[i].map.width, 15), pal.pal, 2);
console.log(`shots in ${out}`);
