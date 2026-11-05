// Pictures of the lessons (never on the disk), for the progress shots: the lamp walking, Kit seen by it,
// Kit hiding in a trench with the light overhead, and level 2's two lights.
//   cd web && npx vite-node ../games/searchlight/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level), his feet on row `feet`, in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, feet = GROUND - 1): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};
/** A monster picture in block (col, row). */
const thing = (name: string, col: number, row: number): Sprite => ({ pixels: Uint8Array.from(mbl[mb.n(name)].pixels), x: ORIGIN + col, y: ORIGIN + row });
/** A light (lamp, then four pieces of cone) with its lamp at column `col`. */
const light = (col: number): Sprite[] => [thing('lamp0', col, 5), ...[0, 1, 2, 3].map((i) => thing(`cone${i}_0`, col, 6 + i))];
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 2, w, 12, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: the light and Kit before; Kit seen; Kit hiding in the first trench with the light overhead
save('1-before.png', region(empty(0), 12, 20, [...kit(['stand.top', 'stand'], 16), ...light(21)]));
save('2-seen.png', region(empty(0), 12, 20, [...kit(['hurt.top', 'hurt'], 20), ...light(21)]));
save('3-hiding.png', region(empty(0), 12, 20, [...kit(['stand.top', 'stand'], 21, GROUND + 1), ...light(21)]));
// level 2: both lights
save('4-two-lights.png', region(empty(1), 18, 30, [...kit(['stand.top', 'stand'], 31), ...light(24), ...light(36)]));
console.log(`shots in ${out}`);
