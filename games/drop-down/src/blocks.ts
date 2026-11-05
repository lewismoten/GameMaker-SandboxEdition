// DROP DOWN's own blocks, added to the Starter block set after the signs:
//   crate    a wooden box you cannot walk through (solid on every side). Touch it and it becomes `rubble`
//            (the same crate as SMASH IT's; see that game for how a breakable block is made).
//   rubble   what a crate leaves: a little pile you can walk through
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** A crate: planks in a frame with a cross of braces, brown and plainly breakable, not a wall. */
function crate(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[2]);
  // the frame, then two plank lines across the middle and the braces
  p.rect(0, 0, 20, 20, w[0]).rect(1, 1, 18, 18, w[3]);
  p.rect(1, 1, 18, 1, w[4]).rect(1, 18, 18, 1, w[1]);
  p.rect(1, 1, 3, 18, w[2]).rect(16, 1, 3, 18, w[2]);
  for (let i = 0; i < 14; i++) {
    p.set(3 + i, 3 + i, w[1]).set(4 + i, 3 + i, w[1]);
    p.set(16 - i, 3 + i, w[1]).set(15 - i, 3 + i, w[1]);
    p.set(3 + i, 2 + i, w[4]).set(16 - i, 2 + i, w[4]);
  }
  // four nails
  for (const [x, y] of [
    [2, 2],
    [17, 2],
    [2, 17],
    [17, 17],
  ] as const)
    p.set(x, y, w[4]);
  return p;
}

/** What is left: chunky wooden chips and a few splinters scattered about the square (it can float where a crate was, so it reads as bits in the air), the rest of it open. */
function rubble(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  // a chip: a lit top edge, a body and a dark underside
  const chip = (x: number, y: number, cw: number, ch: number) => {
    p.rect(x, y, cw, ch, w[3])
      .rect(x, y, cw, 1, w[4])
      .rect(x, y + ch - 1, cw, 1, w[1]);
  };
  chip(2, 14, 7, 4);
  chip(10, 15, 8, 3);
  chip(5, 9, 5, 4);
  chip(12, 9, 4, 3);
  chip(1, 4, 4, 3);
  chip(14, 3, 5, 3);
  chip(8, 3, 3, 2);
  chip(8, 17, 3, 2);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the crate and the rubble to `book` (after addStarterBlocks and the signs). */
export function addCrateBlocks(book: Book, pal: Pal): void {
  book.add('rubble', rubble(pal), { grav: PULL.down });
  book.add('crate', crate(pal), { solid: SOLID, touch: 'rubble' });
}
