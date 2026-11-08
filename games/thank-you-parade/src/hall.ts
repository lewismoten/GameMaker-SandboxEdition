// Level 7, Practice Hall: 8:45, Ridgemont's practice hall, three floors of it. Three locks across the floor: a brass gate (its key
// on a shelf up a ladder), a steel gate (its key on the balcony, two ladders up) and a second brass gate (its key in the
// basement, down a hole in the floor, past a goose and a cone, up a second hole). Gigi's seventh playbook page is up
// in the rafters at the far end, above a ladder that runs the whole height of the hall.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addRoofs } from './extra';
import { HALL_SIGNS } from './text';
import { Level, addSigns, bunting, column, onGround, run } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import type { Pal } from './print';
import { shaft, tallRoom } from './tall';
import { addFlags, addStreet } from './town';

export const AT_HALL = {
  width: 84,
  height: 32,
  ground: 24,
  gates: [20, 42, 62],
  /** The shelf (mezzanine) planks, and the key on it. */
  shelf: { ladder: 5, planks: [6, 14, 19], key: 12 },
  /** The balcony: ladder up to the mezzanine, planks, a second ladder, the balcony planks and the steel key. */
  lights: { ladder1: 24, mezz: [25, 30, 20], ladder2: 31, balcony: [32, 40, 12], key: 38 },
  /** The basement: holes (ladders) at both ends, the floor row, and what lies between. */
  basement: { holes: [47, 58], floor: 30, key: 55, cone: 50, goose: 56 },
  rafters: { ladder: 70, planks: [71, 77, 6], page: 77 },
  exit: 80,
} as const;

/** A locked gate across the floor: brick to the roof, an arch, the gate. */
function lock(m: StarterMap, x: number, ground: number, silver: boolean): void {
  column(m, 'brick', x, 2, ground - 3);
  m.set(x, ground - 2, silver ? 'gateTopSilver' : 'gateTop').set(x, ground - 1, silver ? 'gateSilver' : 'gate');
}

export function hall(pal: Pal): Level {
  const A = AT_HALL;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addBandArch(book, pal);
  addRoofs(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, HALL_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  // the hall: a brick ceiling, a floor, brick ends, windows high on the back wall, bunting
  for (let x = 0; x < A.width; x++) m.set(x, 0, 'brick').set(x, 1, 'brick').set(x, G, 'walk');
  column(m, 'brick', 0, 0, G - 1);
  column(m, 'brick', A.width - 1, 0, G - 1);
  m.set(3, G - 2, 'doorwayTop').set(3, G - 1, 'doorwayBottom').set(A.exit, G - 2, 'doorTop').set(A.exit, G - 1, 'doorBottom');
  for (let x = 4; x < A.width - 4; x += 4) m.set(x, 3, 'cityWin').set(x + 1, 3, 'cityWin');
  bunting(m, 6, A.width - 6, 2);
  // the shelf, and the first brass key
  const sh = A.shelf;
  run(m, 'plank', sh.planks[0], sh.planks[1], sh.planks[2]);
  shaft(m, sh.ladder, sh.planks[2] - 1, G - 1);
  m.set(sh.key, sh.planks[2] - 1, 'key');
  // the lights: two ladders, a mezzanine and the balcony, and the steel key
  const li = A.lights;
  run(m, 'plank', li.mezz[0], li.mezz[1], li.mezz[2]);
  run(m, 'plank', li.balcony[0], li.balcony[1], li.balcony[2]);
  shaft(m, li.ladder1, li.mezz[2] - 1, G - 1);
  shaft(m, li.ladder2, li.balcony[2] - 1, li.mezz[2] - 1);
  m.set(li.key, li.balcony[2] - 1, 'keySilver');
  // the locks
  lock(m, A.gates[0], G, false);
  lock(m, A.gates[1], G, true);
  lock(m, A.gates[2], G, false);
  // the basement: a room under the floor with a hole and a ladder at each end
  const b = A.basement;
  for (let x = b.holes[0]; x <= b.holes[1]; x++) for (let y = G + 1; y < b.floor; y++) m.set(x, y, 'sky');
  for (const x of b.holes) {
    m.set(x, G, 'sky');
    shaft(m, x, G - 1, b.floor - 1);
  }
  m.set(b.key, b.floor - 1, 'key');
  m.set(b.cone, b.floor - 1, 'spikes');
  m.mon(MONS.goose, b.goose, b.floor - 1);
  for (const x of [51, 52, 57]) m.set(x, b.floor - 1, 'donut');
  // the rafters, a ladder to them, and the page
  const r = A.rafters;
  run(m, 'plank', r.planks[0], r.planks[1], r.planks[2]);
  shaft(m, r.ladder, r.planks[2] - 1, G - 1);
  m.set(r.page, r.planks[2] - 1, 'page');
  // coins along the floor, tubs of hedge
  for (const x of [8, 16, 28, 36, 66, 74]) m.set(x, G - 1, 'donut');
  for (const x of [10, 38, 64, 78]) m.set(x, G - 1, 'bush');
  // placards
  m.sign(6, onGround(G, s.start), s.start);
  m.sign(15, onGround(G, s.shelf), s.shelf);
  m.sign(33, onGround(G, s.lights), s.lights);
  m.sign(48, onGround(b.floor, s.geese), s.geese);
  m.sign(r.planks[0], onGround(r.planks[2], s.secret), s.secret);
  m.sign(76, onGround(G, s.exit), s.exit);
  return { file: 'hall', title: 'Practice Hall', hint: "8:45 AM. Ridgemont's hall. Three floors.", map: m, book, pal };
}
