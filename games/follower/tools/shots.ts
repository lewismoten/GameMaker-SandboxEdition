// Pictures of the lessons (never on the disk), for the progress shots: Puff falling behind and
// catching up in level 1, and Puff stuck under the ledge in level 2.
//   cd web && npx vite-node ../games/follower/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, LEDGE, buildLevels } from '../src/levels';

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
const kit = (pose: [string, string], col: number, ground = GROUND): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + ground - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + ground - 1 },
  ];
};
/** A monster picture standing in column `col`, on the ground. */
const thing = (name: string, col: number, ground = GROUND): Sprite => ({
  pixels: Uint8Array.from(mbl[mb.n(name)].pixels),
  x: ORIGIN + col,
  y: ORIGIN + ground - 1,
});
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: Kit runs ahead and Puff is far behind, then Puff is at his side; level 2: Kit on the ledge, Puff under it
save('1-puff-behind.png', region(empty(0), 4, 20, [...kit(['stand.top', 'stand'], 15), thing('puff1', 6)]));
save('2-puff-catches-up.png', region(empty(0), 4, 20, [...kit(['stand.top', 'stand'], 15), thing('puff0', 14)]));
save('3-puff-under-ledge.png', region(empty(1), 0, 26, [...kit(['stand.top', 'stand'], 8, LEDGE), thing('puff0', 8, LEDGE + 1)]));
