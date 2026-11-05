// Pictures of the lessons (never on the disk), for the progress shots: the V of five birds in level 1, and the
// V coming apart in level 2.
//   cd web && npx vite-node ../games/flock/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { FLOCK_AT, GROUND, V, buildLevels } from '../src/levels';

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
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

/** The five birds with their wings up or down, `names[i]` being the i-th from the left; `shift[i]` moves a bird right by that many blocks. */
const vee = (names: string[], shift: number[], dx = 0): Sprite[] =>
  V.map(([x, y], i) => ({ pixels: Uint8Array.from(mbl[mb.n(names[i])].pixels), x: ORIGIN + FLOCK_AT[0] + dx + x + shift[i], y: ORIGIN + FLOCK_AT[1] + y }));

// level 1: the V over Kit, then the V after the birds flew on (still a V); level 2: the gold birds out in front
const blue = ['bird0', 'bird1', 'bird0', 'bird1', 'bird0'];
const mixed = ['bird0', 'quick1', 'bird0', 'quick1', 'bird0'];
save('1-the-v.png', region(empty(0), 8, 24, [...kit(['stand.top', 'stand'], 18), ...vee(blue, [0, 0, 0, 0, 0])]));
save('2-the-v-flown-on.png', region(empty(0), 8, 24, [...kit(['stand.top', 'stand'], 18), ...vee(blue, [0, 0, 0, 0, 0], 6)]));
save('3-out-of-step.png', region(empty(1), 8, 24, [...kit(['stand.top', 'stand'], 18), ...vee(mixed, [0, 6, 0, 6, 0])]));
