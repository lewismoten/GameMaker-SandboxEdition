// Level 11, The Cannon Truck: 9:40, the boss. Gigi has parked Ridgemont's confetti truck across Elm Street, and it stays
// parked while three fuse boxes are still in. Each fuse has its guard: a street sweeper patrolling the way to the first
// and the last, confetti cannons on the beat under the second and third. Ladders and planks go over the cannons (and the
// notes over them can be had from the ground, on the beat). Pull all three and the truck's rear door opens. A ninth playbook
// page sits on top of the last plank run (the sunroof).
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addRoofs, addTruck } from './extra';
import { addBeat, addRivals } from './items';
import { TRUCK_SIGNS } from './text';
import { Level, addSigns, bunting, column, onGround, run } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import type { Pal } from './print';
import { shaft, tallRoom } from './tall';
import { addFlags } from './town';

export const AT_TRUCK = {
  width: 80,
  height: 20,
  ground: 16,
  /** Sweepers: the x of each one's start (it patrols from there). */
  sweepers: [9, 56],
  fuses: [21, 30, 68],
  /** The high road over the second zone: ladder up, planks, and the row. */
  high1: { ladder: 24, planks: [25, 36, 10] },
  /** The high road over the third zone. */
  high2: { ladder: 39, planks: [40, 52, 12], down: 53 },
  /** Cannon zones: [first x, last x, kind]. */
  zones: [
    [28, 30, 'A'],
    [32, 34, 'B'],
    [43, 45, 'A'],
    [47, 49, 'B'],
  ] as [number, number, 'A' | 'B'][],
  truck: 72,
  gigi: 74,
  page: [36, 9] as [number, number],
  exit: 77,
} as const;

export function truck(pal: Pal): Level {
  const A = AT_TRUCK;
  const G = A.ground;
  const book = baseBook(pal);
  addFlags(book, pal);
  addBeat(book, pal);
  addRivals(book, pal);
  addTruck(book, pal);
  addBandArch(book, pal);
  addRoofs(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, TRUCK_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  bunting(m, 6, 70, 2);
  // the beat meter, where the ground can see it
  for (let x = 1; x + 3 < A.width - 1; x += 12) {
    m.set(x, 11, 'lamp0on');
    for (let k = 1; k < 4; k++) m.set(x + k, 11, `lamp${k}start`);
  }
  // the zones, with the notes over them
  for (const [a, b, kind] of A.zones) {
    run(m, kind === 'A' ? 'cannonA' : 'cannonB0', a, b, G - 1);
    for (let x = a; x <= b; x++) m.set(x, G - 3 - (x % 2), 'note');
  }
  // the high roads
  const h1 = A.high1;
  run(m, 'plank', h1.planks[0], h1.planks[1], h1.planks[2]);
  shaft(m, h1.ladder, h1.planks[2] - 1, G - 1);
  const h2 = A.high2;
  run(m, 'plank', h2.planks[0], h2.planks[1], h2.planks[2]);
  shaft(m, h2.ladder, h2.planks[2] - 1, G - 1);
  shaft(m, h2.down, h2.planks[2] - 1, G - 1);
  m.set(A.page[0], A.page[1], 'page');
  // the three fuses (the second on the first road, a donut on the second)
  m.set(A.fuses[0], G - 1, 'fuse').set(A.fuses[1], h1.planks[2] - 1, 'fuse').set(A.fuses[2], G - 1, 'fuse');
  for (const x of [41, 46, 50]) m.set(x, h2.planks[2] - 1, 'donut');
  // two street sweepers
  for (const x of A.sweepers) m.mon(MONS.sweeper, x, G - 1);
  // the truck: a gun on its roof, a rear door that wants all three fuses; Gigi stands beside it
  column(m, 'brick', A.truck, 0, G - 4);
  m.set(A.truck, G - 3, 'truckGun').set(A.truck, G - 2, 'bandArch').set(A.truck, G - 1, 'truckDoor');
  m.wallToSky(A.truck);
  m.set(A.gigi, G - 2, 'rival1Top').set(A.gigi, G - 1, 'rival1');
  // placards
  m.sign(5, onGround(G, s.start), s.start);
  m.sign(12, onGround(G, s.sweep), s.sweep);
  m.sign(18, onGround(G, s.high), s.high);
  m.sign(60, onGround(G, s.gigi), s.gigi);
  m.sign(26, onGround(h1.planks[2], s.secret), s.secret);
  m.sign(75, onGround(G, s.exit), s.exit);
  return { file: 'truck', title: 'The Cannon Truck', hint: "9:40 AM. Gigi's confetti truck.", map: m, book, pal, song: 'drumoff' };
}
