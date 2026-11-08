// Pictures of the lessons (never on the disk), for the progress shots: level 1's sand at each stage of
// sinking under the hero and the hole she drops into, and level 2's stones and wet sand.
//   cd web && npx vite-node ../games/quicksand/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { DRY, GROUND_ONE, GROUND_TWO, SAND_ONE, STONES, buildLevels, holeOf, link, type Level } from '../src/levels';
import { STAGES } from '../src/props';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** The hero standing in column `col` (in the level), her feet on row `feet`. */
const kit = (col: number, feet: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
/** A fresh copy of level `l`'s map with the cells in `cells` set to blocks by name. */
function at(l: Level, i: number, cells: [number, number, string][]) {
  const m = buildLevels().levels[i].map.done();
  for (const [x, y, name] of cells) m.blocks[(ORIGIN + y) * 100 + ORIGIN + x] = l.book.n(name);
  return m;
}
const region = (l: Level, m: ReturnType<typeof at>, col: number, row: number, w: number, h: number, extra: Sprite[]) =>
  renderRegion(m, l.book.finish(), mbl, set, ORIGIN + col, ORIGIN + row, w, h, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

const [one, two] = levels;
const spot = SAND_ONE[0] + 3;
const G = GROUND_ONE;
for (let s = 0; s < STAGES; s++) save(`1-stage-${s}.png`, region(one, at(one, 0, [[spot, G, link('sand', s * DRY)]]), spot - 7, 2, 15, 10, kit(spot, G - 1)));
save(`1-hole.png`, region(one, at(one, 0, [[spot, G, holeOf('sand')]]), spot - 7, 2, 15, 10, kit(spot, G)));
save('2-stones.png', region(two, at(two, 1, []), STONES[1] - 7, 2, 16, 10, kit(STONES[1], GROUND_TWO - 1)));
console.log(`shots in ${out}`);
