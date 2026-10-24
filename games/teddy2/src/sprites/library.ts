// The Dog House: the tiny little library in front of the blue house on Maple Street. A white
// box on a post with a dark overhanging roof and a fire-engine red door: black strap hinges,
// a barrel latch, a paw-print knob, dog books on the shelf and a little chest of drawers with
// paw knobs (dog snacks inside). Under it hangs a red-roofed cubby of painted rocks to trade.
// Drawn 2 blocks wide and 3 high over the blocks behind it.
import { Pixels } from '../../../kit/pixels';
import { micro } from '../art/draw';
import { P } from '../art/pal';
import { tinyEgg } from './egg';

const c = (n: string, k: number) => P.c(n, k);

export interface LibraryState {
  /** A book taken from the shelf (a gap where it stood). */
  gap?: boolean;
  /** The middle snack drawer pulled open, empty. */
  open?: boolean;
  /** Something small and striped at the back of the top shelf instead of the paperbacks. */
  glimpse?: boolean;
}

/** Draws the library into a 40x60 picture (already filled with the background behind it). */
export function dogHouseLibrary(p: Pixels, s: LibraryState = {}): Pixels {
  const ink = c('ink', 0);
  // the post, behind everything
  p.rect(18, 30, 4, 30, c('wood', 0)).rect(18, 30, 1, 30, c('wood', 1));
  // the roof: a dark overhang with its name along the edge
  p.rect(0, 3, 40, 1, c('asphalt', 2)).rect(0, 4, 40, 6, c('asphalt', 0)).rect(0, 10, 40, 1, ink);
  for (let x = 1; x < 39; x += 3) p.set(x, 4, c('asphalt', 1));
  micro(p, 3, 5, 'DOG HOUSE', c('paint', 3));
  // the white box
  p.rect(2, 11, 36, 23, c('paint', 3)).rect(2, 11, 1, 23, c('paint', 2)).rect(37, 11, 1, 23, c('paint', 1));
  p.rect(2, 33, 36, 1, c('paint', 1)).rect(1, 34, 38, 1, ink);
  // the red door frame and its window
  p.rect(5, 12, 30, 21, c('red', 2));
  p.rect(5, 12, 30, 1, c('red', 3)).rect(5, 12, 1, 21, c('red', 3)).rect(5, 32, 30, 1, c('red', 1)).rect(34, 12, 1, 21, c('red', 1));
  p.rect(9, 14, 22, 17, c('paint', 2));
  p.rect(9, 14, 22, 1, c('paint', 1)).rect(9, 14, 1, 17, c('paint', 1));
  // top shelf: a VHS box lying flat and a stack of paperbacks
  p.rect(11, 16, 12, 3, c('blue', 2)).rect(11, 16, 12, 1, c('blue', 3)).rect(13, 17, 4, 1, c('yellow', 3)).rect(18, 17, 3, 1, c('red', 3));
  if (s.glimpse) tinyEgg(p, 25, 14);
  else p.rect(24, 17, 6, 2, c('green', 1)).rect(24, 16, 5, 1, c('purple', 2));
  p.rect(10, 19, 20, 1, c('wood', 2));
  // the books, spines out
  const books: [number, number, string, number][] = [
    [10, 10, 'ink', 1],
    [12, 9, 'purple', 1],
    [14, 10, 'blue', 1],
    [16, 8, 'yellow', 2],
    [18, 9, 'red', 1],
  ];
  books.forEach(([x, h, ramp, k], i) => {
    if (s.gap && i === 2) {
      p.rect(x, 30 - h, 2, h, c('paint', 1));
      return;
    }
    p.rect(x, 30 - h, 2, h, c(ramp, k)).rect(x, 30 - h, 1, h, c(ramp, k + 1));
    p.set(x + 1, 30 - h + 2, c('paint', 3)).set(x + 1, 30 - h + 4, c('paint', 3));
  });
  // the little chest of drawers with paw knobs
  p.rect(21, 20, 9, 10, c('red', 1));
  for (let k = 0; k < 3; k++) {
    const y = 21 + k * 3;
    if (s.open && k === 1) {
      p.rect(21, y, 9, 2, ink)
        .rect(20, y + 1, 10, 2, c('paint', 3))
        .rect(20, y + 3, 10, 1, c('paint', 1));
      continue;
    }
    p.rect(22, y, 7, 2, c('paint', 3))
      .set(25, y, ink)
      .set(24, y + 1, ink)
      .set(26, y + 1, ink);
  }
  p.rect(9, 30, 22, 1, c('wood', 1));
  // a shine across the plexi
  for (let k = 0; k < 5; k++) p.set(25 + k, 14 + k, c('fur', 2));
  // black strap hinges, the barrel latch with its bone handle, the paw-print knob
  for (const y of [14, 28])
    p.rect(1, y, 8, 2, ink)
      .set(1, y - 1, ink)
      .set(1, y + 2, ink);
  p.rect(33, 20, 5, 2, ink).rect(35, 18, 1, 6, ink).set(36, 18, c('paint', 3)).set(36, 23, c('paint', 3));
  p.rect(33, 25, 3, 3, c('paint', 3)).set(34, 26, ink).set(33, 25, ink).set(35, 25, ink);
  // the painted-rock cubby: a red roof over a white grid of little cubbies
  p.rect(8, 40, 24, 1, c('red', 3)).rect(8, 41, 24, 3, c('red', 2)).rect(8, 44, 24, 1, c('red', 0));
  p.rect(9, 45, 22, 13, c('paint', 3));
  const rocks = ['blue', 'yellow', 'pink', 'green', 'purple', 'red', 'stone', 'blue', 'gold', 'pink', 'green', 'yellow', 'red', 'purple', 'stone'];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 5; col++) {
      const x = 10 + col * 4;
      const y = 46 + row * 4;
      p.rect(x + 3, y - 1, 1, 4, c('paint', 1)).rect(x, y + 3, 4, 1, c('paint', 1));
      const k = rocks[row * 5 + col];
      if ((row * 5 + col) % 4 === 3) continue;
      p.rect(x, y + 1, 3, 2, c(k, 2))
        .set(x + 1, y + 1, c(k, 3))
        .set(x + 1, y, c('stone', 2));
    }
  p.rect(8, 58, 24, 1, ink);
  return p;
}
