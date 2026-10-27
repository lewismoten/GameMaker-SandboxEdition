// JAMIE.BBL's own blocks: the long slanted run down Jamie Street needs more than SNOW.BBL's
// 150 (it is full), so Jamie Street gets a copy of the set with blocks it never shows (the
// houses, the mall and the arcade) given to the run's banks, birches, lit firs and distance
// boards. Every other level keeps SNOW.BBL as it was.
//
// The banks: the run slants a column to the right every three rows (levels/slant.ts), and
// the snow along each side is banked up. The left bank (two columns) pulls the sled right and
// the right bank (one column) pulls it left, both keeping its speed down the hill, so a sled
// left alone rides along the left bank with the slant instead of running into the trees.
// Banked turns (wind ripples pointing the way) pull the same way before a squeeze between
// trees, so a sled coming down the side is carried round into the gap. A
// bank is drawn from the slant's true line, so each of its three phases (a row's place in the
// three-row step) is its own block, and the shadow and lip run on unbroken from row to row.
import { rng } from '../../../kit/pixels';
import type { Pal } from '../art/pal';
import { blob, shadeAt } from '../art/draw';
import { text } from '../art/font';
import { blockContext, SOLID, type BlockBook } from './book';
import { drawFir, slopePainter } from './sled';
import { RISE } from '../levels/slant';

/** SNOW.BBL blocks Jamie Street never shows (houses, the mall, the stores and the arcade), whose slots the run's blocks take, in order. */
const SPARE = [
  'roofL',
  'roofM',
  'roofR',
  'eaveL',
  'eaveL2',
  'eaveM',
  'eaveM2',
  'eaveR',
  'eaveR2',
  'chimney',
  'chimney2',
  'redWin',
  'redDoor',
  'redGarageL',
  'redGarageR',
  'blueWin',
  'blueDoor',
  'blueGarageL',
  'blueGarageR',
  'yellowWin',
  'yellowDoor',
  'yellowGarageL',
  'yellowGarageR',
  'flatRoof',
  'mallWall',
  'mall0',
  'mall1',
  'mall2',
  'mall3',
  'mall4',
  'mall5',
  'mallDoor',
];

/** Grav bits: 1 up, 2 right, 4 down, 8 left. Up and down at once keep the sled's speed down the hill. */
const KEEP = 1 | 4;
const PULL_RIGHT = KEEP | 2;
const PULL_LEFT = KEEP | 8;

/** The distance boards count down from this to 1 on the way to the bottom. */
export const BOARDS = 9;

/** The copy of `book` (SNOW.BBL, finished) for Jamie Street, with the run's own blocks in it. */
export function hillBook(book: BlockBook, pal: Pal): BlockBook {
  const fork = book.fork();
  const k = { ...blockContext(pal), book: fork };
  const { R, c, snow } = k;
  const slope = slopePainter(k);
  const spare = [...SPARE];
  const add = (name: string, ...rest: Parameters<BlockBook['add']> extends [string, ...infer T] ? T : never) => {
    const old = spare.shift();
    if (!old) throw new Error('Jamie Street: out of spare blocks');
    fork.swap(old, name, ...rest);
  };

  // ---------- the banks ----------
  // d: pixels from the slant's true tree line, into the run. The snow there is in the trees'
  // shadow, then heaped up in a lip, then the run's own snow.
  const bankPic = (seed: number, d: (x: number, y: number) => number, lip: number) => {
    const p = slope(seed, false);
    const r = rng(seed * 31);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dd = d(x, y);
        const n = (r() - 0.5) * 0.16;
        if (dd < lip - 9) p.set(x, y, shadeAt(snow, 2, 5, 0.25 + (dd / (lip - 9)) * 0.45 + n, x, y));
        else if (dd < lip + 5) {
          // the lip: lit on its uphill side
          const t = (dd - (lip - 9)) / 14;
          p.set(x, y, shadeAt(snow, 3, 6, 0.6 + Math.sin(t * Math.PI) * 0.4 + n, x, y));
        } else if (dd < lip + 12) p.set(x, y, shadeAt(snow, 3, 6, 0.68 + n, x, y));
      }
    return p;
  };
  for (let ph = 0; ph < RISE; ph++) {
    const line = (y: number) => (20 * ph + y) / RISE;
    for (const i of [1, 2])
      add(
        `bankL${i}${ph}`,
        bankPic(40 + i * 3 + ph, (x, y) => i * 20 + x - line(y), 30),
        { grav: PULL_RIGHT },
      );
    add(
      `bankR${ph}`,
      bankPic(50 + ph, (x, y) => 20 + line(y) - x, 14),
      { grav: PULL_LEFT },
    );
  }

  // ---------- banked turns: snow heaped to carry the sled round a stand of trees ----------
  // Wind ripples in the snow point the way it pulls: the run's own telegraph for a squeeze.
  const drift = (seed: number, dir: 1 | -1) => {
    const p = slope(seed, false);
    for (const [cx, cy] of [
      [5, 5],
      [13, 14],
    ])
      for (let t = 0; t < 7; t++) {
        // a chevron, > or <, its dark edge leading and a light one behind
        const x = cx + dir * (3 - Math.abs(t - 3));
        p.set(x, cy + t - 3, c('snow', 1))
          .set(x - dir, cy + t - 3, c('snow', 2))
          .set(x - 2 * dir, cy + t - 3, c('snow', 6));
      }
    return p;
  };
  add('driftR', drift(81, 1), { grav: PULL_RIGHT });
  add('driftL', drift(82, -1), { grav: PULL_LEFT });

  // ---------- birches (the middle of the run) ----------
  // A clump of white birches filling the block (the sled only hits what it can see); like
  // the firs, each hurts once and then is a harmless look-alike.
  const birch = () => {
    const p = slope(61, false);
    // a crown of bare twigs, gray-brown, round like the firs so the sled hits what it sees
    const r = rng(62);
    for (let y = 0; y < 13; y++)
      for (let x = 0; x < 20; x++) {
        const nx = (x + 0.5 - 10) / 9.5;
        const ny = (y + 0.5 - 7) / 6.5;
        if (nx * nx + ny * ny > 1 || r() < 0.45) continue;
        p.set(x, y, r() < 0.3 ? c('wood', 3) : c('wood', 1 + (r() < 0.5 ? 1 : 0)));
      }
    // snow caught in the twigs
    for (let n = 0; n < 10; n++) p.set(2 + Math.floor(r() * 16), 1 + Math.floor(r() * 8), c('snow', 6));
    // three white trunks with black marks, the right side in shade
    for (const [x, top] of [
      [2, 6],
      [8, 3],
      [14, 7],
    ]) {
      p.rect(x, top, 4, 19 - top, c('snow', 6));
      p.rect(x + 3, top, 1, 19 - top, c('snow', 3));
      for (let y = top + 1; y < 18; y += 3) p.rect(x + ((y * 7) % 3), y, 2, 1, c('ink', 1));
    }
    blob(p, 10, 19, 9, 1.6, snow, 3, 5);
    return p;
  };
  add('birch', birch(), { solid: SOLID, hp: -10, touch: 'birchHit' });
  add('birchHit', birch(), { solid: SOLID });

  // ---------- firs strung with Christmas lights (the bottom of the run) ----------
  const bulbs = R('bulbs');
  const litFir = (frame: number) => {
    const p = drawFir(k, slope(6, false));
    const spots = [
      [6, 5],
      [12, 4],
      [4, 9],
      [10, 9],
      [15, 8],
      [3, 13],
      [8, 14],
      [13, 13],
      [17, 12],
    ];
    spots.forEach(([x, y], n) => {
      const on = (n + frame) % 2 === 0;
      p.set(x, y, on ? bulbs[n % bulbs.length] : c('pine', 0));
      if (on) p.set(x, y - 1, c('snow', 6));
    });
    return p;
  };
  add('litFir', litFir(0), { solid: SOLID, hp: -10, touch: 'litFirHit', next: 'litFir1', ntime: 5 });
  add('litFir1', litFir(1), { solid: SOLID, hp: -10, touch: 'litFirHit', next: 'litFir', ntime: 5 });
  add('litFirHit', litFir(0), { solid: SOLID });

  // ---------- distance boards in the tree line: 9 at the top, down to 1 near the bottom ----------
  const board = (n: number) => {
    const p = slope(70 + n, false);
    drawFir(k, p);
    p.rect(3, 13, 2, 7, c('wood', 1)).rect(15, 13, 2, 7, c('wood', 1));
    p.rect(1, 1, 18, 13, c('ink', 1));
    p.rect(2, 2, 16, 11, c('snow', 6));
    p.rect(2, 2, 16, 1, c('snow', 4));
    text(p, 6, 4, String(n), c('coat', 2));
    // a little arrow down the hill, beside the number
    p.rect(15, 4, 1, 4, c('ink', 1)).rect(14, 7, 3, 1, c('ink', 1)).set(15, 8, c('ink', 1));
    return p;
  };
  for (let n = BOARDS; n >= 1; n--) add(`dist${n}`, board(n), { solid: SOLID });
  return fork;
}
