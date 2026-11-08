// Pictures of the lessons (never on the disk), for the progress shots: the nest hatching a bird in level 1 and
// the blue flock and the emptied nest in level 2.
//   cd web && npx vite-node ../games/things-that-grow/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, PATH_NEST_X, buildLevels } from '../src/levels';

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

// level 1: the shelf nest hatching a bird over Kit; level 2: a flock of blue birds from the path nest, then the nest empty and the birds gone
const L1 = empty(0);
save('1-nest-hatches.png', region(L1, 16, 18, [...kit(['stand.top', 'stand'], 22), thing('bird0', 26), { ...thing('bird1', 28), y: ORIGIN + GROUND - 5 }]));
const L2 = empty(1);
const flock = [thing('bluebird0', 33), { ...thing('bluebird1', 35), y: ORIGIN + GROUND - 4 }, { ...thing('bluebird0', 31), y: ORIGIN + GROUND - 5 }];
save('2-blue-flock.png', region(L2, 22, 18, [...kit(['stand.top', 'stand'], 28), ...flock]));
const spent = empty(1);
spent.blocks[(ORIGIN + GROUND - 1) * 100 + ORIGIN + PATH_NEST_X] = book.n('nestEmpty');
save('3-nest-empty.png', region(spent, 22, 18, kit(['cheer.top', 'jump'], 33)));
