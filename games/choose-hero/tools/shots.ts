// Pictures of the lessons (never on the disk), for the progress shots: the two heroes side by side, the room
// at the moment of choosing, and each hero in the climb, with the whole of each map.
//   cd web && npx vite-node ../games/choose-hero/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { bigBlocks } from '../src/hero';
import { L1, L2, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const fast = buildHeroBlocks(pal);
const big = bigBlocks(fast, pal);

/** A hero standing in column `col` with his feet on level row `feet`, as two sprites for renderRegion. */
const stand = (hero: typeof fast, col: number, feet: number, top = 'stand.top', bottom = 'stand') => {
  const h = heroPicture(hero, top, bottom);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const maps = levels.map((l) => l.map.done());
/** One 16 by 10 block screen of level `i` with its top left at (col, row). */
const screen = (i: number, col: number, row: number, ...sprites: ReturnType<typeof stand>[]) =>
  renderRegion(maps[i], bbl, mbl, set, ORIGIN + col, ORIGIN + row, 16, 10, sprites.flat());

const G1 = L1.ground - 1;
const G2 = L2.ground - 1;
writePng(join(out, 'one-1-fast-feet-door.png'), screen(0, 0, 3, stand(fast, 5, G1)), pal.pal, 3);
writePng(join(out, 'one-2-big-hops-door.png'), screen(0, 20, 3, stand(big, 29, G1)), pal.pal, 3);
writePng(join(out, 'two-1-fast-feet-on-the-steps.png'), screen(1, 10, 6, stand(fast, 17, G2 - L2.steps[1].height)), pal.pal, 3);
writePng(join(out, 'two-2-big-hops-skips-a-step.png'), screen(1, 10, 3, stand(big, 15, G2 - L2.steps[1].height - 3, 'cheer.top', 'jump')), pal.pal, 3);
writePng(join(out, 'two-3-big-hops-high-coins.png'), screen(1, 17, 0, stand(big, 25, G2 - L2.plateau.height - 5, 'cheer2.top', 'cheer')), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
