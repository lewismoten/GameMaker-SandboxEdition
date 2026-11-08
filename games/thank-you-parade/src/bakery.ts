// Level 3, Bakery Row: 7:20, and the bakery's front door is locked. The only way to the back counter is over three roofs,
// each higher than the last, joined by ladder shafts (every shaft runs from the street to its roof, so a ladder is also the
// quick way up). Donuts on every roof and awning are for the taking. Mr. Okafor's shutter comes down when the SHUT meter
// runs out; a door at the start begins it again. Two ways down from the top roof: the ladder, or the awnings (donuts, slower).
// A water tower's lookout plank above the third roof holds Gigi's fifth playbook page.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addMeter, addRoofs, addShutter } from './extra';
import { BAKERY_SIGNS } from './text';
import { Level, addSigns, bunting, column, onGround, run } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import type { Pal } from './print';
import { building, meterAt, shaft, tallRoom } from './tall';
import { addFlags, addStreet } from './town';

export const AT_BAKERY = {
  width: 88,
  height: 33,
  ground: 28,
  retry: 2,
  start: 5,
  /** Roofs: [first x, last x, surface row]. */
  roofs: [
    [10, 20, 22],
    [22, 34, 16],
    [36, 49, 10],
  ] as [number, number, number][],
  /** Ladder shafts: x (each top is one row above the roof it climbs to). */
  shafts: [9, 21, 35, 50],
  /** Awnings down the back of the shops: [first x, last x, row]. */
  awnings: [
    [51, 53, 14],
    [54, 56, 18],
    [57, 59, 22],
    [60, 62, 26],
  ] as [number, number, number][],
  tower: { plank: [51, 57], row: 4, page: 57 },
  shutter: 81,
  exit: 85,
  /** The SHUT meter: segments, ticks each. */
  segments: 5,
  each: 440,
} as const;

export function bakery(pal: Pal): Level {
  const A = AT_BAKERY;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addBandArch(book, pal);
  addRoofs(book, pal);
  addMeter(book, pal, 'shut', ['SH', 'UT'], A.segments, A.each);
  addShutter(book, pal, A.segments * A.each);
  addPage(book, pal);
  const s = addSigns(book, pal, BAKERY_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit, A.start);
  const m = new StarterMap(book, g.rows());
  run(m, 'walk', 1, A.width - 2, G);
  for (let y = G + 1; y < A.height; y++) run(m, 'road', 1, A.width - 2, y);
  m.set(A.retry, G - 2, 'doorTop').set(A.retry, G - 1, 'doorBottom');
  // the shops: a facade for each roof and a long back wall of the awnings' shops
  A.roofs.forEach(([a, b, r], i) => building(m, a, b, r, G, i));
  for (let x = 51; x <= 64; x++) for (let y = 15; y < G; y++) m.set(x, y, (x + y) % 3 ? 'cityWall' : 'cityWin');
  run(m, 'cityTop', 51, 64, 14);
  m.set(51, 14, 'cityTopB');
  bunting(m, 66, 80, G - 5);
  // the SHUT meters, where the hero can see one
  for (const [x, y] of [
    [1, G - 6],
    [12, 15],
    [23, 9],
    [38, 6],
    [53, 9],
    [66, G - 7],
  ])
    meterAt(m, 'shut', A.segments, x, y);
  // shafts and awnings go over the facades
  A.roofs.forEach(([, , r], i) => shaft(m, A.shafts[i], r - 1, G - 1));
  shaft(m, A.shafts[3], A.tower.row - 1, G - 1);
  for (const [a, b, y] of A.awnings) run(m, 'awning', a, b, y);
  run(m, 'plank', A.tower.plank[0], A.tower.plank[1], A.tower.row);
  m.set(A.tower.page, A.tower.row - 1, 'page');
  // donuts
  for (const x of [12, 14, 16, 18]) m.set(x, 21, 'donut');
  for (const x of [24, 27, 31]) m.set(x, 15, 'donut');
  for (const x of [38, 40, 42, 44, 46]) m.set(x, 9, 'donut');
  for (const [a, , y] of A.awnings) m.set(a + 1, y - 1, 'donut');
  for (const x of [68, 71, 76]) m.set(x, G - 1, 'donut');
  // geese on the second roof and in the street
  m.mon(MONS.goose, 26, 15).mon(MONS.goose, 72, G - 1);
  // flags and tubs
  for (const x of [7, 66, 79]) m.set(x, G - 1, 'bush');
  // the shutter over the back counter's door, with brick above it
  column(m, 'brick', A.shutter, 0, G - 3);
  m.set(A.shutter, G - 2, 'shutterUp').set(A.shutter, G - 1, 'shutterUp');
  m.wallToSky(A.shutter);
  // placards
  m.sign(11, onGround(G, s.start), s.start);
  m.sign(11, onGround(A.roofs[0][2], s.donuts), s.donuts);
  m.sign(29, onGround(A.roofs[1][2], s.clock), s.clock);
  m.sign(37, onGround(A.roofs[2][2], s.ladder), s.ladder);
  m.sign(A.tower.plank[0], onGround(A.tower.row, s.secret), s.secret);
  m.sign(64, onGround(G, s.down), s.down);
  m.sign(82, onGround(G, s.exit), s.exit);
  return {
    file: 'bakery',
    title: 'Bakery Row',
    hint: '7:20 AM. The roofs, the donuts, the shutter.',
    map: m,
    book,
    pal,
    song: 'rooftop',
    retry: [A.retry, G - 1],
  };
}
