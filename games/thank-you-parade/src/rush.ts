// Level 4, Crosswalk Corner: 7:50. Mr. Boyle's crosswalk has five traffic gates across the street, each on its own light (green and
// yellow it is open, red it is shut: a two-block wall), so the way along the street is a wait at every stop line. The brass gate near
// the end needs the barber's key, which is up a ladder on the barber's roof between the third gate and the fourth. Balloons drift over
// the stretches between gates and donuts sit along the curb.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addRoofs } from './extra';
import { RUSH_SIGNS } from './text';
import { Level, addSigns, bunting, column, onGround, run } from './lay';
import { MONS } from './monsters';
import type { Pal } from './print';
import { shaft, tallRoom } from './tall';
import { addGates } from './traffic';
import { addFlags, addStreet } from './town';

export const AT_RUSH = {
  width: 90,
  height: 18,
  ground: 14,
  /** The five traffic gates (x) and where each one starts in its 210-tick cycle. */
  gates: [16, 28, 40, 58, 70],
  offsets: [0, 55, 110, 165, 20],
  /** The barber's roof: [first x, last x, surface row], the ladder up to it and the brass key on it. */
  roof: [46, 54, 7] as [number, number, number],
  ladder: 45,
  key: 50,
  brass: 78,
  exit: 86,
} as const;

export function rush(pal: Pal): Level {
  const A = AT_RUSH;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addRoofs(book, pal);
  addGates(book, pal, [...A.offsets]);
  addPage(book, pal);
  const s = addSigns(book, pal, RUSH_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  bunting(m, 8, 82, 2);
  // the gates: a light over a barrier across the street, with a brick wall above so nothing goes over the top
  A.gates.forEach((x, i) => {
    m.set(x, G - 2, `lite${i}`).set(x, G - 1, `barr${i}`);
    column(m, 'brick', x, 0, G - 3);
    m.wallToSky(x);
  });
  // the barber's roof: a shop front, a roof, a ladder up and the key
  const [r0, r1, rr] = A.roof;
  for (let x = r0; x <= r1; x++) for (let y = rr + 1; y < G; y++) m.set(x, y, (x + y) % 3 ? 'cityWall' : 'cityWin');
  run(m, 'roofTile', r0, r1, rr);
  shaft(m, A.ladder, rr - 1, G - 1);
  m.set(A.key, rr - 1, 'key');
  for (const x of [48, 52]) m.set(x, rr - 1, 'donut');
  // the brass gate before the exit
  column(m, 'brick', A.brass, 0, G - 3);
  m.set(A.brass, G - 2, 'gateTop').set(A.brass, G - 1, 'gate');
  m.wallToSky(A.brass);
  // donuts along the curb, balloons drifting between the gates, tubs of hedge
  for (const x of [20, 24, 34, 38, 62, 66, 74, 83]) m.set(x, G - 1, 'donut');
  m.mon(MONS.balloon, 22, G - 5)
    .mon(MONS.balloon, 34, G - 5)
    .mon(MONS.balloon, 64, G - 5);
  for (const x of [8, 12, 44, 56, 68]) m.set(x, G - 1, 'bush');
  // placards
  m.sign(5, onGround(G, s.start), s.start);
  m.sign(30, onGround(G, s.gates), s.gates);
  m.sign(49, onGround(G, s.key), s.key);
  m.sign(72, onGround(G, s.brass), s.brass);
  m.sign(80, onGround(G, s.exit), s.exit);
  return { file: 'rush', title: 'Crosswalk Corner', hint: '7:50 AM. Five gates, five lights.', map: m, book, pal };
}
