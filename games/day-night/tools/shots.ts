// Pictures of the lessons (never on the disk), for the progress shots: level 1 at 9, at 3 and at 0 with
// the door open, and level 2 at 99, with the floor flashing at 03, and with the floor open and Kit dropping.
//   cd web && npx vite-node ../games/day-night/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, MAT_ROW, buildLevels, finishBlocks, type Level } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level), his feet on row `feet`. */
const kit = (col: number, feet = GROUND - 1): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};

/** The level's map as the clock leaves it. Level 1: the number `n` and the door open or shut. Level 2: the number and the floor. */
function at(l: Level, o: { n?: number; open?: boolean; floor?: 'shut' | 'warn' | 'open' }) {
  // a fresh copy of the level each time, so one picture's changes stay out of the next
  const m = buildLevels().levels[l.file === 'one' ? 0 : 1].map.done();
  const swap = (from: string, to: string) => {
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === l.book.n(from)) m.blocks[i] = l.book.n(to);
  };
  const n = o.n ?? (l.file === 'one' ? 9 : 99);
  if (l.file === 'one') {
    for (const q of ['tl', 'tr', 'bl', 'br']) {
      swap(`big9.${q}`, `big${n}.${q}`);
      if (o.open) swap(`door.shut.${q}`, `door.open.${q}`);
    }
  } else {
    swap('ten9', `ten${Math.floor(n / 10)}`);
    swap('one99', `one${Math.floor(n / 10)}${n % 10}`);
    if (o.floor && o.floor !== 'shut') swap('trap.shut', o.floor === 'warn' ? 'trap.warn' : 'shaft');
  }
  return m;
}
const region = (l: Level, m: ReturnType<typeof at>, col: number, row: number, w: number, extra: Sprite[]) =>
  renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN + row, w, 11, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);
const [one, two] = levels;

save('1-nine.png', region(one, at(one, { n: 9 }), 10, 0, 16, kit(14)));
save('2-three.png', region(one, at(one, { n: 3 }), 10, 0, 16, kit(18)));
save('3-zero-door-open.png', region(one, at(one, { n: 0, open: true }), 10, 0, 16, kit(19)));
save('4-ninety-nine.png', region(two, at(two, { n: 99 }), 0, 0, 16, kit(6)));
save('5-floor-flashes.png', region(two, at(two, { n: 3, floor: 'warn' }), 0, 0, 16, kit(8)));
save('6-the-drop.png', region(two, at(two, { n: 0, floor: 'open' }), 0, 9, 16, kit(8, MAT_ROW - 3)));
console.log(`shots in ${out}`);
