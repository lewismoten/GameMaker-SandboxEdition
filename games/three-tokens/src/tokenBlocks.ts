// THREE TOKENS' own blocks, added to the Starter block set before the signs:
//   token       a round purple token with a square hole: touch it and counter 22 goes up by one
//   gateThree   a stout gate with three empty slots: solid, and a touch takes 3 off counter 22. With
//               fewer than 3 the touch is refused and the gate stays shut; with 3 it becomes sky.
//   tokenTop    the arch over a gate (passable), with a purple gem
//   gateFive    the same with five slots, for the exit of level 2
// Nothing here knows what a token is: a token only adds to a counter, and a gate only asks whether
// the counter can pay. The hero's counter 22 starts at 1 (a counter shows one less than it holds).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { archPicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counter a token adds to and a gate spends. */
export const TOKENS = 22;

/** A purple token: a thick rim, a lighter face, a square hole you can see the sky through. */
function tokenPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const m = pal.r('purple');
  const ink = pal.c('ink', 0);
  p.disc(9.5, 9.5, 8, ink).disc(9.5, 9.5, 7, m[1]).disc(9.5, 9.5, 5.5, m[3]).disc(9.5, 9.5, 4.6, m[2]);
  p.rect(7, 7, 6, 6, ink).rect(8, 8, 4, 4, skyOf(pal));
  p.rect(4, 5, 2, 3, m[m.length - 1])
    .set(6, 4, m[m.length - 1])
    .set(5, 4, m[m.length - 1]);
  return p;
}

/** A gate with `n` slots on a stone plate: each slot is a ring that waits for a token. */
function gatePicture(pal: Pal, n: 3 | 5): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const b = pal.r('blue');
  const pu = pal.r('purple');
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, b[1]);
  p.rect(1, 0, 18, 1, b[3]).rect(1, 18, 18, 1, b[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, b[0]).rect(x + 1, 1, 1, 17, b[2]);
  // the plate with its slots (3 in a row, or 3 over 2)
  p.rect(2, 4, 16, n === 3 ? 8 : 13, ink)
    .rect(3, 5, 14, n === 3 ? 6 : 11, s[3])
    .rect(3, 5, 14, 1, s[4]);
  const at: [number, number][] =
    n === 3
      ? [
          [5, 8],
          [10, 8],
          [15, 8],
        ]
      : [
          [5, 8],
          [10, 8],
          [15, 8],
          [7, 14],
          [13, 14],
        ];
  for (const [x, y] of at) p.disc(x, y, 2.4, pu[3]).disc(x, y, 1.4, ink);
  return p;
}

/** Adds the token and the two gates to `book` (after addStarterBlocks). */
export function addTokenBlocks(book: Book, pal: Pal): void {
  book.add('token', tokenPicture(pal), { grav: PULL.down, score: 25, effect: TOKENS, eamt: 1, touch: 'sky' });
  book.add('gateThree', gatePicture(pal, 3), { solid: SOLID, effect: TOKENS, eamt: -3, touch: 'sky' });
  book.add('tokenTop', archPicture(pal, 'purple'), { grav: PULL.down });
  book.add('gateFive', gatePicture(pal, 5), { solid: SOLID, effect: TOKENS, eamt: -5, touch: 'sky' });
}
