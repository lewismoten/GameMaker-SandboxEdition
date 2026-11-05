// Pictures of the lessons (never on the disk), for the progress shots: Plop on its crate and dropped into the dip
// in level 1, and Pip on its two crates and drifted down in level 2.
//   cd web && npx vite-node ../games/drop-down/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { CORK_ROW, GROUND, buildLevels } from '../src/levels';

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

/** The map with the crates at (x, rows) turned to rubble and the monsters taken out. */
const broken = (level: number, x: number, rows: number[]) => {
  const m = empty(level);
  for (const y of rows) m.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = book.n('rubble');
  return m;
};
const full = (level: number) => levels[level].map.done();

// level 1: Plop on its crate, then Plop in the dip with the rubble; level 2: Pip on two crates, then Pip drifted down through Kit
save('1-plop-on-crate.png', region(full(0), 16, 18, [...kit(['stand.top', 'stand'], 21)]));
save('2-plop-in-dip.png', region(broken(0, 24, [CORK_ROW]), 16, 18, [...kit(['stand.top', 'stand'], 22), thing('plop1', 24, GROUND + 1)]));
save('3-pip-on-crates.png', region(full(1), 8, 18, [...kit(['stand.top', 'stand'], 15)]));
save('4-pip-drifted-down.png', region(broken(1, 19, [CORK_ROW, CORK_ROW - 1]), 8, 18, [...kit(['stand.top', 'stand'], 21), thing('pip1', 19, GROUND)]));
