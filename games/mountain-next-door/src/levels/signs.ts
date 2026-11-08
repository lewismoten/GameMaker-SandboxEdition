// Level 5, NUTMEG'S SIGNPOSTS (noon): the trail climbs the hill in switchbacks, three paths stacked one over the
// next. At every fork somebody keeps turning the signpost (it swaps on a clock): somebody with a bushy tail.
// The arrows cannot be trusted, but the yellow blazes can: a blazed post stands by the right ladder. The wrong
// way is a dead end, where Nutmeg keeps her acorn stash. Take a few; she has plenty.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

/** The three paths' floors (Tess walks on the row above each). */
export const FLOORS = [21, 15, 9] as const;

export const SIGNS_AT = {
  // fork 1 at the right end of the bottom path: the ladder up, or on to the dead end
  fork1: { arrow: 76, ladder: 79, blaze: 78, stash: [85, 87], sign: 81 },
  // fork 2 at the left end of the middle path: the right ladder, or the ladder into the walled nook
  fork2: { arrow: 15, ladder: 12, blaze: 13, nookLadder: 5, nookWall: 9, stash: [2, 7] },
  // fork 3 on the top path: a hedge, two ladders to planks over it; the right way goes over, the other into a nook
  fork3: { arrow: 47, hedge: 62, good: { ladder: 57, plank: [58, 66] }, bad: { ladder: 52, plank: [46, 51] }, blaze: 56, stash: [47, 50] },
  posts: [
    [10, 0],
    [44, 0],
    [66, 1],
    [30, 1],
    [24, 2],
    [74, 2],
  ],
  logs: [
    [36, 0],
    [40, 1],
  ],
  pie: [58, 0],
  nuts: [
    [20, 0],
    [55, 1],
    [32, 2],
  ],
  exit: 86,
  signs: { turned: 4, trust: 28, stash: 81, noon: 69, top: 16 },
} as const;

const SIGNS = {
  turned: ['SOMEONE KEEPS TURNING THE SIGNS.', 4, 3],
  trust: ['ARROWS LIE. PAINT DOES NOT.', 4, 3],
  stash: ['NUTMEG WAS HERE.', 4, 2],
  noon: ['NOON. THE CREW COMES IN 19 HOURS.', 4, 3],
  top: ['NEARLY TO THE OLD SPOT.', 4, 2],
} as const;

export function levelSigns(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'signs']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const [f1, f2, f3] = FLOORS;
  const g = new Grid(W, 24);
  g.row(f1, 0, W - 1, 'G').fill(0, f1 + 1, W, 2, 'D');
  g.row(f2, 1, W - 2, 'G').row(f3, 1, W - 2, 'G');
  g.col(0, 0, f1 - 1, 'X').col(W - 1, 0, f1 - 1, 'X');
  g.put(3, f1 - 2, 's').put(3, f1 - 1, 'S');
  g.put(SIGNS_AT.exit, f3 - 2, 'e').put(SIGNS_AT.exit, f3 - 1, 'E');
  const { fork1, fork2, fork3 } = SIGNS_AT;
  // ladders up through the floors
  g.col(fork1.ladder, f2 - 1, f1 - 1, 'H');
  g.col(fork2.ladder, f3 - 1, f2 - 1, 'H');
  g.col(fork2.nookLadder, f3 - 1, f2 - 1, 'H');
  // the nook on the top path, walled off, and the hedge on the top path with its two ladders and planks
  g.col(fork2.nookWall, f3 - 5, f3 - 1, 'X');
  g.col(fork3.hedge, f3 - 5, f3 - 1, 'X');
  g.col(fork3.good.ladder, f3 - 6, f3 - 1, 'H').row(f3 - 5, fork3.good.plank[0], fork3.good.plank[1], '=');
  g.col(fork3.bad.ladder, f3 - 6, f3 - 1, 'H').row(f3 - 5, fork3.bad.plank[0], fork3.bad.plank[1], '=');
  for (const [x, y] of [
    [8, 2],
    [30, 1],
    [70, 2],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new StarterMap(book, g.rows());
  const feet = (tier: number) => FLOORS[tier] - 1;
  m.set(fork1.arrow, feet(0), 'arrowL').set(fork1.blaze, feet(0), 'postBlazed');
  m.set(fork2.arrow, feet(1), 'arrowR').set(fork2.blaze, feet(1), 'postBlazed');
  m.set(fork3.arrow, feet(2), 'arrowL').set(fork3.blaze, feet(2), 'postBlazed');
  for (const x of fork1.stash) m.set(x, feet(0), 'acorn');
  for (const x of fork2.stash) m.set(x, feet(2), 'acorn');
  for (const x of fork3.stash) m.set(x, f3 - 6, 'acorn');
  for (const [x, t] of SIGNS_AT.posts) m.set(x, feet(t), 'post');
  for (const [x, t] of SIGNS_AT.logs) m.set(x, feet(t), 'logL').set(x + 1, feet(t), 'logR');
  m.set(SIGNS_AT.pie[0], feet(SIGNS_AT.pie[1]), 'pie');
  for (const [x, t] of SIGNS_AT.nuts) m.mon(TRAIL.nutmeg, x, feet(t));
  m.mon(TRAIL.nutShort, fork2.stash[0] + 1, feet(2));
  const at = SIGNS_AT.signs;
  m.sign(at.turned, onGround(f1, s.turned), s.turned);
  m.sign(at.trust, onGround(f1, s.trust), s.trust);
  m.sign(at.stash, onGround(f1, s.stash), s.stash);
  m.sign(at.noon, onGround(f2, s.noon), s.noon);
  m.sign(at.top, onGround(f3, s.top), s.top);
  return {
    file: 'signs',
    title: "Nutmeg's Signposts",
    hint: 'Trust the blazes, not the arrows.',
    look: 'noon',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'trail',
  };
}
