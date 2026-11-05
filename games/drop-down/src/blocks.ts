// DROP DOWN's own blocks, added to the Starter block set after the signs:
//   crate    a wooden box you cannot walk through (solid on every side). Walking into it does nothing: it
//            gives way only to a HIT. Its touch costs HIT_COST from a spare counter (HIT_COUNTER), and a
//            counter that would go to zero or below refuses the touch, so the block stays as it is. The
//            counter starts empty (build.ts). Only the thud of Lena's swing (monsters.ts) fills it.
//            The first hit turns it into `cracked`.
//   cracked  the same crate split across, still solid: the second hit turns it into `rubble`
//   rubble   what a crate leaves: a little pile you can walk through
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The spare counter a hit fills and a crate spends (counters 20 and up are free; Game-Maker plays sound 7 when one goes up and 8 when one goes down). */
export const HIT_COUNTER = 21;
/** What one crate touch costs, and what one thud adds: the same, so the counter returns to its start (1, which shows as 0). */
export const HIT_COST = 1;

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

/** The crate split by a hit: a wide dark crack running down it on a slant, a few short cracks off it, and a splinter standing out at the edge. */
function cracked(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = crate(pal);
  // the main crack: a zigzag from the top edge (x 14) down and to the left to the bottom edge, three pixels wide
  let x = 14;
  for (let y = 0; y < 20; y++) {
    if (y % 4 === 3) x += y % 8 === 3 ? -2 : -1;
    p.set(x, y, w[0])
      .set(x + 1, y, w[0])
      .set(x - 1, y, w[0]);
  }
  // short cracks branching off it
  p.line(12, 6, 6, 5, w[0]).line(8, 12, 3, 14, w[0]).line(10, 15, 15, 17, w[0]);
  // a lit splinter standing out of the top edge and one sticking out at the left
  p.set(15, 0, w[4]).set(16, 1, w[4]).set(1, 9, w[4]).set(0, 8, w[4]);
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
  book.add('cracked', cracked(pal), { solid: SOLID, effect: HIT_COUNTER, eamt: -HIT_COST, touch: 'rubble' });
  book.add('crate', crate(pal), { solid: SOLID, effect: HIT_COUNTER, eamt: -HIT_COST, touch: 'cracked' });
}
