// The things the finale's two new heroes send out, as monster block art: THE CHEZ's HONK (a
// fan of horn rings rolling ahead), Doc Leo's SQUAWK (the rubber chicken's notes) and his
// balloon dog (sky blue, so it never looks like the pink balloon dogs to collect), with the
// POP it ends in.
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';

const K: Record<string, number> = {
  o: P.c('ink', 0),
  y: P.c('orange', 3),
  Y: P.c('orange', 2),
  w: P.c('fur', 2),
  b: P.c('blue', 2),
  B: P.c('blue', 3),
  n: P.c('blue', 1),
  s: P.c('sky', 7),
  q: P.c('yellow', 3),
  Q: P.c('yellow', 2),
  r: P.c('red', 2),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

export const FX3: Record<string, Pixels> = {
  // the horn: three orange arcs and a little burst at the mouth
  honk1: S(
    ['.....y.....y......', '......y.....y.....', '.y.....y.....y....', 'yYy....y.....y....', '.y.....y.....y....', '......y.....y.....', '.....y.....y......'],
    1,
    6,
  ),
  honk2: S(
    ['......y.....y.....', '.......Y.....y....', '.y......Y.....y...', 'yYy.....Y.....y...', '.y......Y.....y...', '.......Y.....y....', '......y.....y.....'],
    1,
    6,
  ),
  // the chicken's squawk: notes bouncing off ahead
  squawk1: S(
    [
      '........qq......',
      '.....oq.qQ......',
      '..q..oq.q.......',
      '..q..o..q.......',
      '..q.oo.oq...qq..',
      '.oq.oo.oo...qQ..',
      '.oo.........q...',
      '...........oq...',
      '...........oo...',
    ],
    2,
    6,
  ),
  squawk2: S(
    [
      '...qq...........',
      '...qQ.......q...',
      '...q.....q.q....',
      '...q.....q.q....',
      '..oq.....q.q....',
      '..oo....oq.q....',
      '........oo.q....',
      '..........oq....',
      '..........oo....',
    ],
    2,
    6,
  ),
  // the balloon dog he rides: a long sky-blue body with its head up and its tail up
  balloon1: S(
    [
      '.nn.nn..............',
      'nBBnBBn.............',
      'nBsnBbn.............',
      '.nBBBbn.............',
      'nBsBBBbn............',
      'nBBBBBBbn.......nn..',
      '.nbbbbbbn......nBBn.',
      '..nBBbnnnnnnnnnbBbn.',
      '.nBBBBBBBBBBBBBBBbbn',
      'nBsBBBBBBBBBBBBBBBbn',
      'nBBBBBBBBBBBBBBBBbbn',
      '.nbbbbbbbbbbbbbbbbn.',
      '..nBbn........nBbn..',
      '..nBbn........nBbn..',
      '..nnnn........nnnn..',
    ],
    0,
    5,
  ),
  balloon2: S(
    [
      '.nn.nn..............',
      'nBBnBBn.............',
      'nBsnBbn.............',
      '.nBBBbn.............',
      'nBsBBBbn............',
      'nBBBBBBbn......nn...',
      '.nbbbbbbn.....nBBn..',
      '..nBBbnnnnnnnnnbBbn.',
      '.nBBBBBBBBBBBBBBBbbn',
      'nBsBBBBBBBBBBBBBBBbn',
      'nBBBBBBBBBBBBBBBBbbn',
      '.nbbbbbbbbbbbbbbbbn.',
      '..nBbn........nBbn..',
      '..nBbn........nBbn..',
      '..nnnn........nnnn..',
    ],
    0,
    5,
  ),
  pop1: S(
    [
      '....w.....w....',
      '.....w...w.....',
      '..w..wB.Bw..w..',
      '...w.B...B.w...',
      '.....B.n.B.....',
      '..ww...n...ww..',
      '.....B.n.B.....',
      '...w.B...B.w...',
      '..w..wB.Bw..w..',
      '.....w...w.....',
      '....w.....w....',
    ],
    2,
    5,
  ),
  pop2: S(
    [
      '..w.........w..',
      '...............',
      '....b.....b....',
      '...............',
      '.w.....b.....w.',
      '...............',
      '....b.....b....',
      '...............',
      '..w.........w..',
    ],
    2,
    6,
  ),
};
