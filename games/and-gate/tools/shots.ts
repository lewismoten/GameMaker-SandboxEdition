// Pictures of the lessons (never on the disk), for the progress shots: level 1 with one dial on and a
// spark on its way to the one still off, then both on with the lamp lit and its light at the foot of
// the post; level 2 with three dials, one up on the ledge.
//   cd web && npx vite-node ../games/and-gate/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishBlocks } from '../src/gateBlocks';
import { DIAL_OFF, DIAL_ON, LAMP, LIGHT, SPARK, finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = finishBlocks(book);
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
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
/** The level's map with exactly these monsters: [monster number, column, row]. */
const withMonsters = (level: number, list: [number, number, number][]) => {
  const m = levels[level].map.done();
  m.monsters = list.map(([monnum, x, y]) => ({ monnum, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 }));
  return m;
};
const save = (name: string, level: number, map: ReturnType<typeof withMonsters>, col: number, w: number, extra: Sprite[]) =>
  writePng(join(out, name), renderRegion(map, bbl, mbl, monsterSet(mb, levels[level].route), ORIGIN + col, ORIGIN, w, 12, extra), pal.pal, 3);

save(
  '1-one-dial-on.png',
  0,
  withMonsters(0, [
    [DIAL_ON, 12, 6],
    [DIAL_OFF, 17, 6],
    [SPARK, 14, 6],
    [LAMP, 23, 1],
  ]),
  3,
  24,
  kit(['stand.top', 'stand'], 12),
);
save(
  '2-both-on-lamp-lit.png',
  0,
  withMonsters(0, [
    [DIAL_ON, 12, 6],
    [DIAL_ON, 17, 6],
    [LIGHT, 23, 9],
  ]),
  3,
  24,
  kit(['cheer.top', 'jump'], 21),
);
save(
  '3-three-dials.png',
  1,
  withMonsters(1, [
    [DIAL_ON, 5, 6],
    [DIAL_OFF, 13, 1],
    [DIAL_OFF, 22, 7],
    [LAMP, 24, 1],
  ]),
  3,
  24,
  kit(['stand.top', 'stand'], 9),
);
