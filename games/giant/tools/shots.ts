// Pictures of the lessons (never on the disk), for the progress shots: Rocky whole, hit from the ground, with his
// bottom gone, hit from the step; then Beep fresh, blinking (both colors) and a star going through.
//   cd web && npx vite-node ../games/giant/tools/shots.ts <outDir>
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
/** Kit standing in column `col` (in the level) in `pose`, `lift` blocks above the ground, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, lift = 0): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 - lift },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 - lift },
  ];
};
/** A monster picture standing at level block (col, row). */
const thing = (name: string, col: number, row = GROUND - 1): Sprite => ({ pixels: Uint8Array.from(mbl[mb.n(name)].pixels), x: ORIGIN + col, y: ORIGIN + row });
/** A whole giant whose parts are named `<prefix>_<tl|tr|bl|br><frame>`, its top left part at (col, GROUND - 2). */
const giant = (prefix: string, suffix: string, col: number, gone: string[] = []): Sprite[] =>
  (['tl', 'tr', 'bl', 'br'] as const)
    .filter((k) => !gone.includes(k))
    .map((k) => thing(`${prefix}_${k}${suffix}`, col + (k === 'tr' || k === 'br' ? 1 : 0), GROUND - (k === 'tl' || k === 'tr' ? 2 : 1)));
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  m.monsters = [];
  return m;
};
const region = (map: ReturnType<typeof empty>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(map, bbl, mbl, set, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: Rocky whole, a star from the ground, the bottom gone, then the step
save('1-before.png', region(empty(0), 12, 18, [...kit(['stand.top', 'stand'], 21), ...giant('gol', '0', 24)]));
save('2-from-ground.png', region(empty(0), 12, 18, [...kit(['cheer.top', 'throw1'], 21), thing('star0', 22), ...giant('gol', '1', 24)]));
save(
  '3-bottom-gone.png',
  region(empty(0), 12, 18, [
    ...kit(['stand.top', 'throw2'], 21),
    thing('star0', 22),
    ...giant('gol', '0', 24, ['bl', 'br']),
    thing('poof1', 24),
    thing('poof1', 25),
  ]),
);
save(
  '4-from-step.png',
  region(empty(0), 12, 18, [...kit(['cheer.top', 'throw1'], 19, 1), thing('star0', 21, GROUND - 2), ...giant('gol', '1', 24, ['bl', 'br'])]),
);
// level 2: Beep fresh, hurt blinking (cracked, then red), and a star going through
save('5-fresh.png', region(empty(1), 12, 18, [...kit(['stand.top', 'stand'], 22), ...giant('rob', '0', 24)]));
save('6-hurt-a.png', region(empty(1), 12, 18, [...kit(['stand.top', 'throw2'], 22), ...giant('rob', '0', 24, ['bl']), thing('crk_bl0', 24)]));
save('7-hurt-red.png', region(empty(1), 12, 18, [...kit(['stand.top', 'throw2'], 22), ...giant('rob', '0', 24, ['bl']), thing('hot_bl', 24)]));
save(
  '8-through.png',
  region(empty(1), 12, 18, [...kit(['cheer.top', 'throw1'], 22), thing('star0', 23), ...giant('rob', '0', 24, ['bl']), thing('hot_bl', 24)]),
);
console.log(`shots in ${out}`);
