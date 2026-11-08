// Level 5, Mill Creek: 8:05. The bridge is "out" (a sign on the bridge says so) and the creek is deep. Two ways over, and both
// are needed: a broken bridge of six planks with gaps between (the brass key is on the middle one) and the creek's bed
// (a ladder down, cones to hop, a steel key halfway along, a ladder up on the far side). Two tolls wait past the creek, a brass gate
// and a steel gate, and then the old mill, whose roof (a ladder up its side) holds Gigi's sixth playbook page.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addCreek, addRoofs } from './extra';
import { CREEK_SIGNS } from './text';
import { Level, addSigns, column, onGround, run } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import type { Pal } from './print';
import { shaft, tallRoom } from './tall';
import { addStreet } from './town';

export const AT_CREEK = {
  width: 88,
  height: 26,
  ground: 18,
  /** The creek: first and last x of the water, and the bed's row. */
  creek: [25, 60],
  bed: 22,
  /** Bridge planks: [first x, last x] on row 16. */
  planks: [
    [26, 29],
    [32, 35],
    [38, 41],
    [44, 47],
    [50, 53],
    [56, 59],
  ] as [number, number][],
  plankRow: 16,
  brass: 40,
  steel: 42,
  cones: [34, 50],
  gates: [68, 72],
  mill: [74, 79, 12],
  millLadder: 73,
  page: 77,
  exit: 85,
} as const;

export function creek(pal: Pal): Level {
  const A = AT_CREEK;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addBandArch(book, pal);
  addRoofs(book, pal);
  addCreek(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, CREEK_SIGNS);
  const g = tallRoom(A.width, A.height, G, A.exit);
  const m = new StarterMap(book, g.rows());
  // the creek: water to the bed, ladders at both ends, six planks and a bed with cones and a steel key
  const [c0, c1] = A.creek;
  for (let x = c0; x <= c1; x++) {
    m.set(x, G, 'creekTop');
    for (let y = G + 1; y < A.bed; y++) m.set(x, y, 'creek');
    m.set(x, A.bed, 'creekBed');
  }
  shaft(m, c0, G - 1, A.bed - 1);
  shaft(m, c1, G - 1, A.bed - 1);
  for (const [a, b] of A.planks) run(m, 'plank', a, b, A.plankRow);
  m.set(A.brass, A.plankRow - 1, 'key');
  m.set(A.steel, A.bed - 1, 'keySilver');
  for (const x of A.cones) m.set(x, A.bed - 1, 'spikes');
  for (const x of [29, 31, 38, 46, 53, 56]) m.set(x, A.bed - 1, 'coin');
  for (const x of [30, 43, 55]) m.set(x, A.plankRow - 1, 'coin');
  // a runaway balloon over the bridge, geese on both banks
  m.mon(MONS.balloon, 35, A.plankRow - 3);
  m.mon(MONS.goose, 14, G - 1).mon(MONS.goose, 63, G - 1);
  // the two tolls
  A.gates.forEach((x, i) => {
    column(m, 'brick', x, 0, G - 3);
    m.set(x, G - 2, i ? 'gateTopSilver' : 'gateTop').set(x, G - 1, i ? 'gateSilver' : 'gate');
    m.wallToSky(x);
  });
  // the mill: a roof with a view and a ladder up its side
  const [m0, m1, mr] = A.mill;
  for (let x = m0; x <= m1; x++) for (let y = mr + 1; y < G; y++) m.set(x, y, (x + y) % 3 ? 'cityWall' : 'cityWin');
  run(m, 'roofTile', m0, m1, mr);
  shaft(m, A.millLadder, mr - 1, G - 1);
  m.set(A.page, mr - 1, 'page');
  // scenery
  for (const [x, y] of [
    [6, 2],
    [22, 4],
    [40, 1],
    [58, 3],
    [78, 2],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  m.set(9, G - 1, 'bush');
  m.set(22, G - 1, 'bush');
  // placards
  m.sign(6, onGround(G, s.start), s.start);
  m.sign(11, onGround(G, s.bridge), s.bridge);
  m.sign(18, onGround(G, s.bed), s.bed);
  m.sign(61, onGround(G, s.toll), s.toll);
  m.sign(75, onGround(G, s.mill), s.mill);
  m.sign(m0, onGround(mr, s.secret), s.secret);
  m.sign(82, onGround(G, s.exit), s.exit);
  return { file: 'creek', title: 'Mill Creek', hint: '8:05 AM. The bridge is out. Sort of.', map: m, book, pal };
}
