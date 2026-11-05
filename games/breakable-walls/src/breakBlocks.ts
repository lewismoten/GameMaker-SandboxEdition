// SMASH IT's own blocks, added to the Starter block set after the signs:
//   crate       a wooden box you cannot walk through (solid on every side). Touch it, from any side, and it
//               becomes `rubble`. A bump is a touch: the engine does not know which side was hit.
//   rubble      what a crate leaves: a little pile you can walk through, with nothing to turn into
//   stuckCoin   a coin whose "becomes" is itself: it pays 2 every tick Kit is touching it and never goes
//   gem0..gem3  a spinning gem, four blocks in a loop (each turns into the next after a few ticks). Every
//               frame has the same touch: it becomes sky (air) and pays 25. A frame left blank would pay
//               again, like the stuck coin, so all four are filled in.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Points the stuck coin pays on every tick it is touched. */
export const STUCK_PAY = 2;
/** Points one gem pays, once. */
export const GEM_PAY = 25;
/** The frames of the spinning gem, and the ticks each lasts (18.2 a second). */
export const GEM_FRAMES = 4;
export const GEM_TICKS = 5;

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
    p.rect(x, y, cw, ch, w[3]).rect(x, y, cw, 1, w[4]).rect(x, y + ch - 1, cw, 1, w[1]);
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

/** A coin for the mistake: gold with an orange rim and sparkles, so it reads as a richer one. */
function stuckCoin(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const g = pal.r('gold');
  const o = pal.r('orange');
  p.disc(9.5, 9.5, 7, o[0]).disc(9.5, 9.5, 6, o[2]).disc(9.5, 9.5, 4.5, g[4]).disc(9.5, 9.5, 3, g[3]);
  p.rect(6, 6, 2, 3, g[5]).set(8, 5, g[5]);
  for (const [x, y] of [
    [1, 2],
    [17, 3],
    [2, 16],
    [18, 15],
  ] as const)
    p.set(x, y, g[5])
      .set(x - 1, y, g[4])
      .set(x + 1, y, g[4])
      .set(x, y - 1, g[4])
      .set(x, y + 1, g[4]);
  return p;
}

/** One frame of a spinning gem: `half` is how many pixels wide it is on each side of the middle (the turn). */
function gem(pal: Pal, half: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const t = pal.r('purple');
  for (let y = 2; y <= 17; y++) {
    const rows = y < 8 ? y - 2 : 17 - y;
    const w = Math.max(1, Math.round(((1 + rows) * half) / 6));
    p.rect(10 - w, y, 2 * w, 1, t[3]);
    p.rect(10 - w, y, 1, 1, t[1]).rect(9 + w, y, 1, 1, t[1]);
  }
  // a bright facet on the left and a dark one on the right, thinner as it turns
  const f = Math.max(1, half >> 1);
  p.rect(10 - f - 1, 4, f, 4, t[4]).rect(10, 10, f, 4, t[2]);
  p.set(10 - half + 1, 7, t[5]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

const HALFS = [7, 4, 1, 4];

/** Adds the smash blocks to `book` (after addStarterBlocks and the signs). */
export function addBreakBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('rubble', rubble(pal), air);
  book.add('crate', crate(pal), { solid: SOLID, touch: 'rubble' });
  book.add('stuckCoin', stuckCoin(pal), { ...air, score: STUCK_PAY, touch: 'stuckCoin' });
  HALFS.forEach((h, i) => book.add(`gem${i}`, gem(pal, h), { ...air, score: GEM_PAY, touch: 'sky' }));
}

/** The finished blocks: the book's, with the gem's four frames chained into a loop. */
export function finishBlocks(book: Book): Block[] {
  const blocks = book.finish();
  for (let i = 0; i < GEM_FRAMES; i++) {
    const b = blocks[book.n(`gem${i}`)];
    b.nextBl = book.n(`gem${(i + 1) % GEM_FRAMES}`);
    b.ntime = GEM_TICKS;
  }
  return blocks;
}
