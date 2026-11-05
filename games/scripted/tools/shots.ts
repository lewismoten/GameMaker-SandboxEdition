// Pictures of the lessons (never on the disk), for the progress shots: the stage waiting with eyes peeking
// out of the curtains, the two actors saying HI, the signs, and level 2's cameo waving.
//   cd web && npx vite-node ../games/scripted/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { CAMEO_SPOT, GROUND, STAGE_ONE, STAGE_TWO, buildLevels } from '../src/levels';

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
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 2, w, 12, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);
const row = GROUND - 1;

// level 1: the stage waiting (eyes in the curtains); then the actors in, saying HI; then the empty stage after the play
const s1 = STAGE_ONE;
save('1-waiting.png', region(empty(0), 8, 24, [...kit(['stand.top', 'stand'], 14), thing('peek0', s1.left, row), thing('peek1', s1.right, row)]));
save(
  '2-hello.png',
  region(empty(0), 8, 24, [
    ...kit(['stand.top', 'stand'], 14),
    thing('pipsays', s1.left + 4, row),
    thing('pipbubble', s1.left + 4, row - 1),
    thing('blu0', s1.right - 4, row),
  ]),
);
save('3-late.png', region(empty(0), 8, 24, [...kit(['stand.top', 'stand'], 17)]));
// level 2: the cameo waving in the middle of the stage
save('4-cameo.png', region(empty(1), 16, 24, [...kit(['stand.top', 'stand'], 21), thing('camsays', CAMEO_SPOT, row), thing('cambubble', CAMEO_SPOT, row - 1)]));
void STAGE_TWO;
console.log(`shots in ${out}`);
