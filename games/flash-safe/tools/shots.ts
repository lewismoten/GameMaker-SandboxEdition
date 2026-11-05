// Pictures of the lessons (never on the disk), for the progress shots: level 1 before and after a hit (Kit's
// ouch face and the rising -5), level 2's lamp dark, lit and mid-pulse, and level 3's sky calm and held.
//   cd web && npx vite-node ../games/flash-safe/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { BURR_X, GROUND, LAMP_X, buildLevels, finishBlocks, type Level } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { minusFive } from '../src/props';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit in column `col`, his feet on row `feet`, standing or hurt. */
const kit = (col: number, pose: 'stand' | 'hurt' = 'stand'): Sprite[] => {
  const h = pose === 'hurt' ? heroPicture(hero, 'hurt.top', 'hurt') : heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};

/** A fresh copy of level `i`'s map with every ring (`x.start`) showing its `state` block. */
function at(i: number, state: string) {
  const l: Level = buildLevels().levels[i];
  const m = l.map.done();
  for (const [name, n] of l.book.index) {
    if (!name.endsWith('.start')) continue;
    const to = name.replace('.start', `.${state}`);
    if (!l.book.has(to)) continue;
    for (let k = 0; k < m.blocks.length; k++) if (m.blocks[k] === n) m.blocks[k] = l.book.n(to);
  }
  return { l, m };
}
const region = (i: number, m: ReturnType<typeof at>['m'], col: number, row: number, extra: Sprite[]) => {
  const l = buildLevels().levels[i];
  return renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN + row, 16, 11, extra);
};
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

{
  const { m } = at(0, 'start');
  save('1-before-the-hit.png', region(0, m, 9, 0, kit(14)));
  // after the hit: the first burr is gone, Kit makes his ouch face and a -5 rises
  const after = at(0, 'start').m;
  after.monsters.forEach((x) => {
    if (x.monnum === 3 && x.curx === ORIGIN + BURR_X[0]) x.monnum = 0xff;
  });
  const five: Sprite = { pixels: Uint8Array.from(minusFive(pal).px), x: ORIGIN + BURR_X[0], y: ORIGIN + GROUND - 3 };
  save('2-after-the-hit.png', region(0, after, 9, 0, [...kit(BURR_X[0] + 1, 'hurt'), five]));
}
save('3-lamp-dark.png', region(1, at(1, 'off').m, LAMP_X[0] - 6, 0, kit(LAMP_X[0] - 3)));
save('4-lamp-lit.png', region(1, at(1, 'on').m, LAMP_X[0] - 6, 0, kit(LAMP_X[0] - 3)));
save('5-sky-calm.png', region(2, at(2, 'calm').m, 13, 0, kit(17)));
save('6-sky-held.png', region(2, at(2, 'hold').m, 13, 0, kit(17)));
console.log(`shots in ${out}`);
