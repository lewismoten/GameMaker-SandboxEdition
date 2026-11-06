// THE SANDBOX DIPLOMA's one level, "The Long Aisle": the first graduation's hall made bigger (88 x 13 blocks, floor row 10).
//   x  2        the doorway you start in
//   x  3..63    the balcony: all eight helpers and the Cast's guests, in turn (Teddy has a small diploma beside him)
//   x  3..56    (row 1) a one-word banner for each of the six stages (STEPS, PUSHING, HEROES, STORY, WIRING, BLOCKS), high on the wall, and confetti falling in the gaps
//   x 68..86    the stage: the lectern at x 74 with the diploma, Doc Leo at x 76, THE CHEZ parked at x 80
// Touching the diploma is the door out: the link to the ending. The first level is the arrival (graduationArrive.ts), a nod to one lesson of each stage.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN } from '../../kit/starter/map';
import { PULL } from '../../kit/starter/book';
import { chezBlocks } from '../../kit/starter/graduationCameo';
import { BALCONY_RAIL, HallMap, buildBlocks, buildPalette, stamp, type Level } from '../../kit/starter/graduationLevel';
import { ARRIVE, buildArrival } from '../../kit/starter/graduationArrive';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import type { Timed } from '../../kit/starter/graduationHall';
import { CONFETTI } from '../../kit/starter/graduationConfetti';
import { cfg } from './config';

export const W = 88;
export const H = 13;
export const FLOOR = 10;
export const LECTERN = 74;
export const STAGE_FROM = 68;
const STAGES = ['STEPS', 'PUSHING', 'HEROES', 'STORY', 'WIRING', 'BLOCKS'];
const air = { grav: PULL.down };

/** Falling paper: bits of color on the wall, each frame a little lower. Two chains, each with its own times, so only a few blocks change at once. */
function confetti(book: Book, pal: Pal, timed: Timed[]): string[] {
  const { c } = pal;
  const colors = [c('red', 3), c('gold', 4), c('blue', 3), c('green', 3), c('pink', 2), c('white', 3), c('orange', 3), c('purple', 3)];
  const names: string[] = [];
  for (let chain = 0; chain < 2; chain++) {
    const bits = Array.from({ length: 6 }, (_, i) => ({
      x: (i * 7 + chain * 5) % 18,
      y: (i * 11 + chain * 6) % 20,
      c: colors[(i * 3 + chain) % colors.length],
    }));
    for (let f = 0; f < 2; f++) {
      const p = new Pixels(20, 20, skyOf(pal));
      for (const b of bits) p.rect(b.x + (f % 2), (b.y + f * 6) % 19, 2, 2, b.c);
      book.add(`confetti.${chain}.${f}`, p, air);
    }
    const ticks = [11, 15][chain];
    for (let f = 0; f < 2; f++) timed.push({ name: `confetti.${chain}.${f}`, next: `confetti.${chain}.${(f + 1) % 2}`, ticks });
    names.push(`confetti.${chain}.0`);
  }
  return names;
}

/** A small rolled diploma on its own, for Teddy. */
function tinyScroll(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(3, 12, 14, 5, c('parch', 3))
    .rect(3, 12, 14, 1, c('parch', 4))
    .rect(3, 16, 14, 1, c('parch', 1))
    .rect(1, 13, 2, 3, c('parch', 2))
    .rect(17, 13, 2, 3, c('parch', 2));
  p.rect(5, 12, 3, 5, c('red', 3)).frame(2, 11, 16, 7, c('ink', 1));
  return p;
}

/** The levels (one) and the block set, palette and timers they share. */
export function buildLevels() {
  const pal = buildPalette(cfg);
  const { book, timed, hall, signs } = buildBlocks(pal, cfg);
  const banners: Sign[] = STAGES.map((t, i) => addSign(book, pal, `stage${i}`, t, 4, 1));
  const chain = confetti(book, pal, timed);
  book.add('tinyScroll', tinyScroll(pal), air);
  const car = chezBlocks(pal);
  car.forEach((px, i) => book.add(`chez.${i}`, px, air));

  const g = new Grid(W, H);
  g.put(2, 8, 's').put(2, 9, 'S');
  const m = new HallMap(book, g.rows(), W);
  for (let x = 1; x < W - 1; x++) {
    m.set(x, FLOOR, x < STAGE_FROM ? 'carpet' : 'stage');
    m.set(x, FLOOR + 1, 'subfloor').set(x, FLOOR + 2, 'subfloor');
  }
  for (let y = 0; y < H; y++) m.set(0, y, 'curtainEdge').set(W - 1, y, 'curtainEdge');
  for (let x = 1; x < W - 1; x++) m.set(x, 0, 'valance').set(x, 1, chain[x % 2]);
  // the wall: a banner for each stage, confetti in the visible row above the crowd
  const bannerAt = (x: number): boolean => STAGES.some((_t, i) => x >= 3 + i * 10 && x < 7 + i * 10);
  for (let x = 2; x < STAGE_FROM - 1; x++) if (!bannerAt(x) && x % 2 === 0) m.set(x, BALCONY_RAIL - 2, chain[(x >> 1) % 2]);
  banners.forEach((b, i) => stamp(m, b, 3 + i * 10, 1, false));
  // Clear-backed paper falls past the guests and rail without replacing their pictures.
  for (let x = 3, i = 0; x < W - 2; x += 5, i++) m.mon(CONFETTI[i % CONFETTI.length], x, BALCONY_RAIL - 2);
  // the balcony: a rail and its front, the helpers and the guests in turn along it, Teddy's diploma beside him
  for (let x = 2; x < STAGE_FROM - 1; x++) m.set(x, BALCONY_RAIL, 'rail').set(x, BALCONY_RAIL + 1, 'riser');
  const crowd: (string | string[])[] = [];
  const guests = hall.cameos.slice();
  hall.helpers.forEach((h, i) => {
    crowd.push(h);
    const guest = guests.shift();
    if (guest) crowd.push(guest);
    if (guest && guest[0].startsWith('cameo.teddy')) crowd.push('tinyScroll');
    if (i === 3 && guests.length) crowd.push(guests.shift()!);
  });
  while (guests.length) crowd.push(guests.shift()!);
  crowd.forEach((one, i) => {
    const x = 4 + i * 3;
    const parts = typeof one === 'string' ? [one] : one;
    parts.forEach((name, k) => m.set(x, BALCONY_RAIL - parts.length + k, name));
  });
  // the stage
  for (let y = 2; y < FLOOR; y++) for (const x of [STAGE_FROM, STAGE_FROM + 1, W - 3, W - 2]) m.set(x, y, 'drape');
  stamp(m, signs.banner, 73, 2, false);
  m.set(LECTERN, 8, 'scroll').set(LECTERN, 9, 'lectern');
  m.set(LECTERN + 2, 8, hall.leoTop).set(LECTERN + 2, 9, hall.leoBottom);
  m.set(LECTERN + 6, 9, 'chez.0').set(LECTERN + 7, 9, 'chez.1');
  for (const [s, x] of [
    [signs.start, 5],
    [signs.helpers, 22],
    [signs.cheer, 40],
    [signs.doc, 58],
  ] as const)
    stamp(m, s, x, FLOOR - 3, true);
  m.exits.push({ from: [LECTERN + ORIGIN, 9 + ORIGIN] });
  const arrival = buildArrival(cfg, pal);
  const levels: Level[] = [
    { file: ARRIVE, title: cfg.arrive.title, hint: cfg.arrive.hint, map: arrival.map, book: arrival.book, timed: arrival.timed, bbl: ARRIVE },
    { file: 'hall', title: cfg.level.title, hint: cfg.level.hint, map: m, book, timed, bbl: 'grad' },
  ];
  return { book, pal, timed, levels };
}
