// Level 10, The Bleachers: 9:10. The grandstand climbs in five rows, and a judge sits on each of the first four with a
// scorecard and a hand out for a card (a card lies on each row; every hand-over is a veteran's 50). A ladder past the top
// row runs on up to the scoreboard's plank, which holds Gigi's eighth playbook page. Back on the ground, two zones of confetti
// cannons on the beat stand between the stands and the exit, with the beat drums above them. Donuts along the rows give a
// hit point back.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addRoofs } from './extra';
import { addBeat } from './items';
import { BLEACHER_SIGNS } from './text';
import { Level, addSigns, bunting, flagpole, onGround, run } from './lay';
import { MONS } from './monsters';
import type { Pal } from './print';
import { shaft, tallRoom } from './tall';
import { addCard, addFlags, addNeighbors } from './town';

export const AT_BLEACHERS = {
  width: 80,
  height: 24,
  ground: 20,
  /** The rows of seats: [first x, last x, surface row]. A judge stands at each one's third block, a card at its fifth. */
  tiers: [
    [22, 27, 18],
    [28, 33, 16],
    [34, 39, 14],
    [40, 45, 12],
    [46, 51, 10],
  ] as [number, number, number][],
  ladder: 52,
  lookout: [46, 51, 6] as [number, number, number],
  page: 47,
  zones: [
    [58, 60, 'A'],
    [62, 63, 'B'],
  ] as [number, number, 'A' | 'B'][],
  exit: 72,
} as const;

export function bleachers(pal: Pal): Level {
  const A = AT_BLEACHERS;
  const G = A.ground;
  const book = baseBook(pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addBeat(book, pal);
  addRoofs(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, BLEACHER_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  bunting(m, 8, 70, 2);
  flagpole(m, 18, G, 6);
  // the beat drums over the cannons
  m.set(57, 15, 'lamp0on');
  for (let k = 1; k < 4; k++) m.set(57 + k, 15, `lamp${k}start`);
  // the rows, with a judge and a card on each of the first four (a donut on the last)
  A.tiers.forEach(([a, b, row], i) => {
    run(m, 'plank', a, b, row);
    if (i < 4) m.set(a + 2, row - 1, `vet${i}`).set(a + 4, row - 1, 'card');
    else m.set(a + 3, row - 1, 'donut');
  });
  for (const [a, , row] of A.tiers.slice(0, 4)) m.set(a + 1, row - 1, 'donut');
  // the ladder to the scoreboard, its plank and page
  shaft(m, A.ladder, A.lookout[2] - 1, G - 1);
  run(m, 'plank', A.lookout[0], A.lookout[1], A.lookout[2]);
  m.set(A.page, A.lookout[2] - 1, 'page');
  // the cannons, their notes, runaway balloons over the stands
  for (const [a, b, kind] of A.zones) {
    run(m, kind === 'A' ? 'cannonA' : 'cannonB0', a, b, G - 1);
    for (let x = a; x <= b; x++) m.set(x, G - 3 - (x % 2), 'note');
  }
  m.mon(MONS.balloon, 30, 11).mon(MONS.balloon, 44, 7);
  // placards
  m.sign(5, onGround(G, s.start), s.start);
  m.sign(12, onGround(G, s.judges), s.judges);
  m.sign(53, onGround(G, s.cannon), s.cannon);
  m.sign(A.lookout[0], onGround(A.lookout[2], s.secret), s.secret);
  m.sign(67, onGround(G, s.exit), s.exit);
  return { file: 'stands', title: 'The Bleachers', hint: '9:10 AM. Five rows. Four judges.', map: m, book, pal };
}
