// Pictures of the lessons (never on the disk), for the progress shots: Kit before the first gumdrop,
// mid-throw with the star in the air, the pop, the far gumdrop with the star falling short, and
// the grump in its tunnel before and after.
//   cd web && npx vite-node ../games/throw-it/tools/shots.ts <outDir>
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
/** Kit standing in column `col` (in the level) in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
/** A monster picture standing in column `col`, on the ground. */
const thing = (name: string, col: number): Sprite => ({ pixels: Uint8Array.from(mbl[mb.n(name)].pixels), x: ORIGIN + col, y: ORIGIN + GROUND - 1 });
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

save('1-before.png', region(empty(0), 4, 14, [...kit(['stand.top', 'stand'], 10), thing('target0', 15)]));
save('2-throw.png', region(empty(0), 4, 14, [...kit(['cheer.top', 'throw1'], 10), thing('star0', 12), thing('target0', 15)]));
save('3-pop.png', region(empty(0), 4, 14, [...kit(['stand.top', 'throw2'], 10), thing('twinkle0', 15)]));
save('4-too-far.png', region(empty(0), 18, 18, [...kit(['stand.top', 'throw2'], 22), thing('twinkle1', 27), thing('target0', 34)]));
save('5-grump.png', region(empty(1), 14, 18, [...kit(['stand.top', 'stand'], 18), thing('guard0', 26)]));
save('6-way-open.png', region(empty(1), 14, 18, [...kit(['stand.top', 'throw2'], 21), thing('twinkle0', 26)]));
console.log(`shots in ${out}`);
