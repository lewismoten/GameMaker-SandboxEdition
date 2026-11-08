// THE SANDBOX DIPLOMA's one level, "The Long Aisle": the first graduation's hall made bigger (88 x 13 blocks, floor row 10).
//   x  2        the doorway you start in
//   x 70..81    the compact two-tier balcony: all eight helpers and fourteen Cast guests (Teddy has a small diploma beside him)
//   x  3..56    (row 6) a one-word banner for each of the six stages (STEPS, PUSHING, HEROES, STORY, WIRING, BLOCKS), in the standing view under the pennants, and confetti falling in the gaps
//   x 68..86    the stage: the lectern at x 74 with the diploma, Doc Leo at x 76, THE CHEZ parked at x 80
// Touching the diploma is the door out: the link to the ending. The first level is the arrival (graduationArrive.ts), a nod to one lesson of each stage.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN } from '../../kit/starter/map';
import { PULL } from '../../kit/starter/book';
import { chezBlocks } from '../../kit/starter/graduationCameo';
import { BALCONY_RAIL, VIEW_TOP, HallMap, buildBlocks, buildPalette, stamp, type Level } from '../../kit/starter/graduationLevel';
import { ARRIVE, buildArrival } from '../../kit/starter/graduationArrive';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import type { Timed } from '../../kit/starter/graduationHall';
import { CONFETTI } from '../../kit/starter/graduationConfetti';
import { addFriendBlocks } from '../../kit/starter/graduationFriends';
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
  const { book, timed, hall, signs } = buildBlocks(pal, cfg, false);
  // a banner is as wide as its word needs (three blocks hold six letters), which leaves room for the gowned friends' blocks
  const banners: Sign[] = STAGES.map((t, i) => addSign(book, pal, `stage${i}`, t, t.length > 6 ? 4 : 3, 1));
  const friends = addFriendBlocks(book, pal, timed);
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
  // the valance and pennants hang in the standing view (rows above VIEW_TOP are never seen)
  for (let x = 1; x < W - 1; x++) m.set(x, VIEW_TOP, 'valance');
  for (let x = 1; x < STAGE_FROM - 1; x++) m.set(x, VIEW_TOP + 1, x % 2 ? 'bunting0' : 'bunting1');
  // the wall: a banner for each stage, confetti in the visible row above the crowd
  const bannerAt = (x: number): boolean => STAGES.some((_t, i) => x >= 3 + i * 10 && x < 7 + i * 10);
  for (let x = 2; x < STAGE_FROM - 1; x++) if (!bannerAt(x) && x % 2 === 0) m.set(x, VIEW_TOP + 2, chain[(x >> 1) % 2]);
  banners.forEach((b, i) => stamp(m, b, 3 + i * 10, VIEW_TOP + 2, false));
  // Clear-backed paper falls past the guests and rail without replacing their pictures.
  for (let x = 3, i = 0; x < W - 2; x += 5, i++) m.mon(CONFETTI[i % CONFETTI.length], x, VIEW_TOP - 1);
  // Two tiers beside the lectern, not a long row left behind by the ceremony camera.
  // Twelve columns (local 70..81) fit the measured world x=1558..1581 camera.
  for (let x = 70; x < 82; x++) {
    m.set(x, BALCONY_RAIL, 'rail');
    m.set(x, BALCONY_RAIL + 2, 'rail').set(x, BALCONY_RAIL + 3, 'riser');
  }
  const crowd: (string | string[])[] = [];
  const guests = hall.cameos.slice();
  while (guests.length) {
    const guest = guests.shift()!;
    crowd.push(guest);
    if (guest[0].startsWith('cameo.teddy')) crowd.push('tinyScroll');
  }
  crowd.forEach((one, i) => {
    const x = 70 + (i % 12);
    const rail = BALCONY_RAIL + Math.floor(i / 12) * 2;
    const parts = typeof one === 'string' ? [one] : one;
    parts.forEach((name, k) => m.set(x, rail - parts.length + k, name));
  });
  // the gowned friends: Kit and the eight helpers, three together at each of three gaps in the aisle (blocks you walk through)
  friends.forEach(([top, bottom], i) => {
    const x = [12, 13, 14, 31, 32, 33, 49, 50, 51][i];
    m.set(x, FLOOR - 2, top).set(x, FLOOR - 1, bottom);
  });
  // the stage
  for (let y = 2; y < FLOOR; y++) for (const x of [STAGE_FROM, STAGE_FROM + 1, W - 3, W - 2]) m.set(x, y, 'drape');
  stamp(m, signs.banner, 62, VIEW_TOP, false);
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
