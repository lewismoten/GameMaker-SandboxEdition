// Level 11, The Clock Tower: 9:20. The town clock runs ten minutes slow and its door, the clock face, is at the top. Four tiers
// of the tower, each one a ledge on either side of a bridge of brass cog planks that blink out in turn (one is always out, and
// the gap travels along the bridge), with a ladder up the left side and the right side by turns. Balloons drift up the middle
// and donuts sit on the ledges. The way down is the door at the top: the next scene starts at street level.
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { addCogs, cogStart } from './cogs';
import { addRoofs } from './extra';
import { CLOCK_SIGNS } from './text';
import { Level, addSigns, bunting, onGround, run } from './lay';
import { MONS } from './monsters';
import { addBandArch } from './park';
import type { Pal } from './print';
import { shaft } from './tall';
import { addFlags, addStreet } from './town';

export const AT_CLOCK = {
  width: 66,
  height: 34,
  ground: 30,
  /** The tower's side walls (the facade runs between them). */
  tower: [21, 48],
  /** The rows of the four tiers, bottom first. */
  tiers: [24, 18, 12, 6],
  /** The left ledge, the bridge of cogs and the right ledge, each as [first x, last x]. */
  left: [23, 27],
  bridge: [28, 37],
  right: [38, 46],
  /** The ladders: x of the left one and the right one. */
  ladders: [22, 47],
  door: 24,
} as const;

export function clock(pal: Pal): Level {
  const A = AT_CLOCK;
  const G = A.ground;
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addBandArch(book, pal);
  addRoofs(book, pal);
  addCogs(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, CLOCK_SIGNS);
  const [t1, t2, t3, t4] = A.tiers;
  const g = new Grid(A.width, A.height);
  g.row(G, 0, A.width - 1, 'G').fill(0, G + 1, A.width, A.height - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(A.width - 1, 0, G - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(A.door, t4 - 2, 'e').put(A.door, t4 - 1, 'E');
  const m = new StarterMap(book, g.rows());
  bunting(m, 6, 18, 2);
  bunting(m, 52, 62, 2);
  // the tower: a roof and a facade of windows (nothing to stand on but the tiers)
  const [w0, w1] = A.tower;
  run(m, 'roofTile', w0, w1, 3);
  for (let x = w0; x <= w1; x++) for (let y = 4; y < G; y++) m.set(x, y, (x + y) % 3 ? 'cityWall' : 'cityWin');
  // the tiers: a ledge each side and a bridge of cogs between
  for (const row of A.tiers) {
    run(m, 'plank', A.left[0], A.left[1], row);
    run(m, 'plank', A.right[0], A.right[1], row);
    for (let x = A.bridge[0]; x <= A.bridge[1]; x++) m.set(x, row, cogStart(x - A.bridge[0]));
  }
  // the ladders, left and right by turns
  const [lx, rx] = A.ladders;
  shaft(m, lx, t1 - 1, G - 1);
  shaft(m, rx, t2 - 1, t1 - 1);
  shaft(m, lx, t3 - 1, t2 - 1);
  shaft(m, rx, t4 - 1, t3 - 1);
  // the door at the top (the clock face), with its sill
  m.set(A.door, t4 - 2, 'doorTop').set(A.door, t4 - 1, 'doorBottom');
  // donuts on the ledges and a balloon drifting between each pair of tiers
  for (const row of A.tiers) for (const x of [25, 26, 42]) m.set(x, row - 1, 'donut');
  m.mon(MONS.balloon, 33, t1 - 4)
    .mon(MONS.balloon, 33, t2 - 4)
    .mon(MONS.balloon, 33, t3 - 4);
  m.mon(MONS.goose, 44, t3 - 1);
  // tubs of hedge in the street
  for (const x of [10, 16, 52, 58]) m.set(x, G - 1, 'bush');
  // placards
  m.sign(5, onGround(G, s.start), s.start);
  m.sign(40, onGround(t1, s.cogs), s.cogs);
  m.sign(38, onGround(t3, s.late), s.late);
  m.sign(40, onGround(t4, s.door), s.door);
  return { file: 'clock', title: 'The Clock Tower', hint: '9:20 AM. The clock is slow.', map: m, book, pal, song: 'rooftop' };
}
