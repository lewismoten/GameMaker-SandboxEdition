// Pictures of the lessons (never on the disk), for the progress shots: the screen at each level's key moment,
// with Kit in it, and each level's whole map.
//   cd web && npx vite-node ../games/walk-the-ground/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
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
const kit = (col: number, feet: number) => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
const maps = levels.map((l) => l.map.done());
const tunnel = book.n('tunnel');
/** Level `i`'s map with the cells (x, y) turned into tunnel, as if Kit had dug them. */
const dug = (i: number, cells: [number, number][]) => {
  const m = { ...maps[i], blocks: Uint8Array.from(maps[i].blocks as ArrayLike<number>) } as (typeof maps)[number];
  for (const [x, y] of cells) m.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = tunnel;
  return m;
};
const run = (x0: number, x1: number, y0: number, y1: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
/** One 16 by 10 block screen of `map` with its top left at (col, row). */
const screen = (map: (typeof maps)[number], col: number, row: number, ...sprites: ReturnType<typeof kit>[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + row, 16, 10, sprites.flat());

const G = L1.ground;
writePng(join(out, 'one-1-the-rock.png'), screen(maps[0], 8, 1, kit(L1.rock - 1, G - 1)), pal.pal, 3);
writePng(join(out, 'one-2-dug-over-it.png'), screen(dug(0, run(L1.rock, L1.rock + 4, G - 3, G - 2).concat([[L1.rock + 5, G - 1], [L1.rock + 5, G - 2]])), 12, 1, kit(L1.rock + 3, G - 3)), pal.pal, 3);
writePng(join(out, 'one-3-through-the-hill.png'), screen(dug(0, run(L1.rock + 1, 27, G - 2, G - 1)), 18, 1, kit(26, G - 1)), pal.pal, 3);
const S = L2.surface;
writePng(join(out, 'two-1-the-trapdoor.png'), screen(maps[1], 5, 1, kit(L2.shaft[0], S - 1)), pal.pal, 3);
writePng(join(out, 'two-2-sinking.png'), screen(dug(1, run(L2.shaft[0], L2.shaft[1], S, S + 3)), 6, 4, kit(L2.shaft[0], S + 4)), pal.pal, 3);
writePng(join(out, 'two-3-under-the-spikes.png'), screen(dug(1, run(L2.shaft[0], 24, S + 3, S + 4)), 14, 2, kit(22, S + 4)), pal.pal, 3);
writePng(join(out, 'two-4-the-ladder.png'), screen(dug(1, run(L2.shaft[0], L2.ladder - 1, S + 3, S + 4)), 22, 1, kit(L2.ladder, S + 2)), pal.pal, 3);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(maps[i], bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);
console.log(`shots in ${out}`);
