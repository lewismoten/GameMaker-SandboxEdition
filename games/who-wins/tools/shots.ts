// Pictures of the lessons (never on the disk), for the progress shots: the big one and the pips
// in level 1, and in level 2 a star fizzling on the big one and one popping the pip.
//   cd web && npx vite-node ../games/who-wins/tools/shots.ts <outDir>
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

// level 1: the signs, the big one on its way and the pips in the tunnel, then a pop; level 2: the
// chart, a star fizzling on the big one, then a star popping the pip
save('1-signs-and-big-one.png', region(empty(0), 2, 27, [...kit(['stand.top', 'stand'], 16), thing('pip0', 24), thing('pip1', 27), thing('big0', 21)]));
save('2-big-pops.png', region(empty(0), 14, 18, [...kit(['stand.top', 'stand'], 18), thing('twinkle0', 24), thing('pip0', 27), thing('big0', 25)]));
save('3-chart-and-star.png', region(empty(1), 2, 20, [...kit(['cheer.top', 'throw1'], 15), thing('star0', 17), thing('big0', 19)]));
save('4-star-fizzles.png', region(empty(1), 2, 20, [...kit(['stand.top', 'throw2'], 15), thing('fizzle0', 18), thing('big0', 19)]));
save(
  '5-star-pops-pip.png',
  region(empty(1), 16, 18, [...kit(['stand.top', 'throw2'], 21), thing('twinkle0', 27), thing('fizzle1', 26), thing('mid0', 30), thing('big0', 19)]),
);
