// Pictures of the lessons (never on the disk), for the progress shots: the coin and the number it
// becomes in level 1, and the three numbers and the stuck one in level 2.
//   cd web && npx vite-node ../games/popups/tools/shots.ts <outDir>
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
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: a coin waiting, then Kit with the 100 rising over it; level 2: the gem and box, then the number that stays
const at = (name: string, col: number, row: number): Sprite => ({ pixels: Uint8Array.from(mbl[mb.n(name)].pixels), x: ORIGIN + col, y: ORIGIN + row });
const stand = ['stand.top', 'stand'] as [string, string];
save('1-coin-waits.png', region(empty(0), 12, 18, [...kit(stand, 15), at('coin0', 18, GROUND - 1), at('coin0', 21, GROUND - 2)]));
save('2-number-rises.png', region(empty(0), 12, 18, [...kit(stand, 19), at('num100', 18, GROUND - 2), at('coin0', 21, GROUND - 2)]));
save(
  '3-own-pictures.png',
  region(empty(1), 8, 18, [
    ...kit(stand, 9),
    at('gem0', 11, GROUND - 1),
    at('box0', 14, GROUND - 2),
    at('num200', 11, GROUND - 3),
    at('num500', 14, GROUND - 4),
  ]),
);
save('4-stuck.png', region(empty(1), 16, 18, [...kit(stand, 27), at('num100', 24, GROUND - 1)]));
