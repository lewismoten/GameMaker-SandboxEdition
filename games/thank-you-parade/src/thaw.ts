// Frost Lot: 8:15. Gigi flooded the lot behind the arena overnight to "keep the band's feet cold", and the sun has other ideas.
// A rink of ice lies level with the bank across the route, six sections of it, and the THAW meter counts down to the last
// one letting go (each section shows a cracked slab for a moment before it drops into the pond). Cross on the ice with the
// clock for the donuts on it; miss it and the pond has a ladder at each end and a bed to walk, cones and all.
// A warming tent with a heap of donuts is on the far bank.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addCreek, addMeter, addRoofs } from './extra';
import { addIce, CRACKED } from './ice';
import { THAW_SIGNS } from './text';
import { Level, addSigns, bunting, onGround } from './lay';
import { MONS } from './monsters';
import type { Pal } from './print';
import { meterAt, shaft, tallRoom } from './tall';
import { addFlags, addStreet } from './town';

const SECTIONS = [6, 6, 6, 6, 7, 7];

export const AT_THAW = {
  width: 86,
  height: 22,
  ground: 14,
  /** The pond: the first and last x of the water (the ladders stand there); the ice lies between. */
  pond: [24, 63],
  bed: 19,
  /** When the first section cracks, and the gap between sections. */
  first: 300,
  gap: 120,
  segments: 5,
  each: 195,
  cones: [36, 48, 57],
  exit: 82,
} as const;

/** Each ice section: its id and the [first x, last x] it covers. */
export function sections(): { id: string; a: number; b: number; melt: number }[] {
  const A = AT_THAW;
  let x = A.pond[0] + 1;
  return SECTIONS.map((w, i) => {
    const s = { id: 'abcdef'[i], a: x, b: x + w - 1, melt: A.first + i * A.gap };
    x += w;
    return s;
  });
}

export function thaw(pal: Pal): Level {
  const A = AT_THAW;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addRoofs(book, pal);
  addCreek(book, pal);
  addMeter(book, pal, 'thaw', ['TH', 'AW'], A.segments, A.each);
  addPage(book, pal);
  const parts = sections();
  addIce(book, pal, parts);
  const s = addSigns(book, pal, THAW_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  bunting(m, 8, 80, 2);
  // the pond: water down to a pebbled bed, ladders at both ends, and a section of ice at a time on top
  const [p0, p1] = A.pond;
  for (let x = p0; x <= p1; x++) {
    m.set(x, G, 'creekTop');
    for (let y = G + 1; y < A.bed; y++) m.set(x, y, 'creek');
    m.set(x, A.bed, 'creekBed');
  }
  shaft(m, p0, G - 1, A.bed - 1);
  shaft(m, p1, G - 1, A.bed - 1);
  for (const { id, a, b } of parts) for (let x = a; x <= b; x++) m.set(x, G, `ice${id}`);
  // what lies on the ice: donuts, low for the walker and high for the jumper
  for (let x = p0 + 3; x < p1 - 2; x += 4) m.set(x, G - 1 - (x % 8 === 3 ? 0 : 2), 'donut');
  m.mon(MONS.balloon, 34, G - 4).mon(MONS.balloon, 50, G - 4);
  // the bed: cones to hop, donuts to make up for them
  for (const x of A.cones) m.set(x, A.bed - 1, 'spikes');
  for (const x of [30, 42, 54, 60]) m.set(x, A.bed - 1, 'donut');
  // the THAW meters, where the hero can see one
  for (const [x, y] of [
    [8, G - 6],
    [26, G - 7],
    [48, G - 7],
    [66, G - 6],
  ])
    meterAt(m, 'thaw', A.segments, x, y);
  // geese on the near bank, a heap of donuts at the tent
  m.mon(MONS.goose, 14, G - 1).mon(MONS.goose, 21, G - 1);
  for (const x of [73, 74, 75, 76]) m.set(x, G - 1, 'donut');
  for (const x of [22, 68]) m.set(x, G - 1, 'bush');
  // placards
  m.sign(5, onGround(G, s.start), s.start);
  m.sign(12, onGround(G, s.thaw), s.thaw);
  m.sign(65, onGround(G, s.bed), s.bed);
  m.sign(72, onGround(G, s.tent), s.tent);
  m.sign(79, onGround(G, s.exit), s.exit);
  return { file: 'thaw', title: 'Frost Lot', hint: '8:15 AM. The rink is melting.', map: m, book, pal };
}

/** Ticks until the last section of ice has dropped. */
export const LAST_DROP = AT_THAW.first + 5 * AT_THAW.gap + CRACKED;
