// Pictures of the lessons (never on the disk), for the progress shots: Kit and the calm Big Bug, a star
// in the air, the sting, then the hurried orange bug, the tiny purple one, and the puff.
//   cd web && npx vite-node ../games/boss-phases/tools/shots.ts <outDir>
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

// level 1: the calm bug before, mid-throw, the sting, then the hurried one; level 2: the tiny last face, and the puff
save('1-calm.png', region(empty(0), 14, 18, [...kit(['stand.top', 'stand'], 18), thing('calm0', 26)]));
save('2-throw.png', region(empty(0), 14, 18, [...kit(['cheer.top', 'throw1'], 20), thing('star0', 22), thing('calm0', 26)]));
save('3-sting.png', region(empty(0), 14, 18, [...kit(['hurt.top', 'hurt'], 24), thing('calm1', 26)]));
save('4-hurried.png', region(empty(0), 14, 18, [...kit(['stand.top', 'throw2'], 20), thing('hurry0', 25), thing('hurry1', 27)]));
save('5-tiny.png', region(empty(1), 14, 18, [...kit(['stand.top', 'throw2'], 20), thing('tiny0', 25)]));
save('6-poof.png', region(empty(1), 14, 18, [...kit(['cheer.top', 'jump'], 20), thing('poof1', 25)]));
console.log(`shots in ${out}`);
