// The front of the shop, so the brick reads as a small building and not a floating wall:
//   roofCap       the roof's edge (solid): a red cap with a dark line, a lit top and a shadow under it
//   stripeA/B     a striped awning across the whole front, red and white like the stalls' (solid)
//   backWall      a dim brick wall behind the stalls (passable, the hero walks in front of it)
//   window        a window with one pane and a sill (passable)
//   shopL/M/R     the SHOP board on the roof, over the doorway (passable)
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

export const SHOP_BOARD = ['shopL', 'shopM', 'shopR'] as const;

function roofCap(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const red = pal.r('red');
  // the cap overhangs: it fills the block, with a lit top, tile joints and a dark underside
  p.rect(0, 0, 20, 20, ink).rect(0, 1, 20, 16, red[2]).rect(0, 1, 20, 2, red[4]);
  p.rect(0, 14, 20, 3, red[1]);
  for (let x = 4; x < 20; x += 10) p.rect(x, 3, 1, 11, red[1]);
  return p;
}

/** One block of the awning stripes: `phase` shifts the stripes so two blocks side by side don't repeat awkwardly. */
function stripe(pal: Pal, phase: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const red = pal.r('red');
  const white = pal.r('white');
  for (let x = 0; x < 20; x++) {
    const on = Math.floor((x + phase) / 5) % 2 === 0;
    p.rect(x, 0, 1, 15, on ? red[2] : white[3]);
    p.rect(x, 15, 1, 3, on ? red[1] : white[2]);
  }
  p.rect(0, 18, 20, 2, ink);
  return p;
}

function backWall(pal: Pal): Pixels {
  const b = pal.r('brick');
  const p = new Pixels(20, 20, b[0]);
  for (let row = 0; row < 4; row++)
    for (let k = -1; k < 3; k++) {
      const x = k * 10 + (row % 2) * 5;
      for (let yy = 0; yy < 4; yy++)
        for (let xx = 0; xx < 9; xx++) {
          const px = x + xx;
          if (px >= 0 && px < 20) p.set(px, row * 5 + yy, yy === 0 ? b[2] : b[1]);
        }
    }
  return p;
}

function windowBlock(pal: Pal): Pixels {
  const p = backWall(pal);
  const ink = pal.c('ink', 0);
  const w = pal.r('wood');
  const sky = pal.r('sky');
  p.rect(2, 2, 16, 15, ink).rect(3, 3, 14, 13, w[3]).rect(5, 5, 10, 9, sky[3]);
  // a shine across the glass, and a sill under it
  for (let i = 0; i < 4; i++) p.set(6 + i, 12 - i, sky[4]).set(7 + i, 12 - i, sky[4]);
  p.rect(1, 17, 18, 2, w[4]).rect(1, 19, 18, 1, ink);
  return p;
}

/** SHOP on a wood board 3 blocks wide, cut in three; it sits on the roof so the sky shows around it. */
function board(pal: Pal): Pixels {
  const p = new Pixels(60, 20, skyOf(pal));
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  p.rect(1, 2, 58, 18, ink).rect(2, 3, 56, 16, w[2]).rect(2, 3, 56, 1, w[4]).rect(2, 18, 56, 1, w[0]);
  p.rect(5, 6, 50, 10, pal.c('parch', 3));
  [...'SHOP'].forEach((ch, i) => {
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(14 + i * 9 + x, 7 + y, pal.c('red', 1));
  });
  return p;
}

/** Adds the front's blocks (add them after the rest, so no other block's number moves). */
export function addFront(book: Book, pal: Pal): void {
  book.add('roofCap', roofCap(pal), { solid: SOLID });
  book.add('stripeA', stripe(pal, 0), { solid: SOLID });
  book.add('stripeB', stripe(pal, 10), { solid: SOLID });
  book.add('backWall', backWall(pal), { grav: PULL.down });
  book.add('window', windowBlock(pal), { grav: PULL.down });
  const pic = board(pal);
  SHOP_BOARD.forEach((n, i) => book.add(n, pic.crop(i * 20, 0, 20, 20), { grav: PULL.down }));
}
