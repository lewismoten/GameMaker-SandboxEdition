// Monster art for the last two road trips (the River Road and Lookout Hill), at THE CHEZ's
// size: a drawbridge's leaf standing up (and its tip with the red lamp), the leaf falling,
// the deck lying flat (and blinking when it is about to go back up), the ferry (its stern
// that pushes the car, the hull it sits in and the bow), and a cow taking her time.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** A piece of the drawbridge's leaf, raised upright (the road edge-on, its rail beside it). */
export function leafUp(tip: boolean, lamp = true): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  // the deck seen edge on: asphalt and its steel edge, striped red and white for a warning
  p.rect(2, 0, 7, 20, c('asphalt', 1)).rect(2, 0, 1, 20, c('asphalt', 3));
  p.rect(9, 0, 3, 20, c('metal', 2)).rect(11, 0, 1, 20, c('ink', 0));
  for (let y = 0; y < 20; y += 8) p.rect(3, y, 5, 4, c('red', 2)).rect(3, y + 4, 5, 4, c('paint', 3));
  // the rail along it, with its posts
  p.rect(16, 0, 2, 20, c('metal', 3));
  for (let y = 2; y < 20; y += 6) p.rect(12, y, 4, 1, c('metal', 1));
  if (tip) {
    p.rect(2, 0, 16, 3, c('ink', 0));
    p.disc(14, 6, 3, lamp ? c('red', 3) : c('red', 0)).set(13, 5, lamp ? c('paint', 3) : c('red', 1));
  }
  return p;
}

/** A piece of the leaf on its way down (tilted halfway). */
export function leafFall(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let k = 0; k < 20; k++) {
    p.rect(k, 19 - k, 3, 3, c('asphalt', 1));
    p.set(k, 18 - k, c('asphalt', 3));
    if (k % 6 < 3) p.rect(k + 1, 20 - k, 2, 1, c('red', 2));
    p.set(k + 3, 21 - k, c('metal', 2));
  }
  return p;
}

/** The deck lying flat across the gap: road on top, a steel girder under it. `warn` blinks amber. */
export function deck(warn = false): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(0, 0, 20, 4, c('asphalt', 2)).rect(0, 0, 20, 1, c('asphalt', 3));
  for (let x = 2; x < 20; x += 10) p.rect(x, 2, 5, 1, c('paint', 3));
  p.rect(0, 4, 20, 2, c('metal', 3)).rect(0, 12, 20, 2, c('metal', 1));
  for (let x = 0; x < 20; x++) {
    p.set(x, 6 + Math.abs((x % 10) - 5), c('metal', 2));
    p.set(x, 6 + (5 - Math.abs((x % 10) - 5)), c('metal', 2));
  }
  if (warn) p.rect(0, 4, 20, 2, c('orange', 3)).rect(0, 12, 20, 2, c('orange', 2));
  return p;
}

/** The ferry's stern: a raised plank deck (the car drives over it to board) and its flag. */
export function ferryStern(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 0));
  for (let x = 3; x < 20; x += 5) p.set(x, 1, c('wood', 1));
  p.rect(0, 4, 20, 9, c('red', 1)).rect(0, 4, 20, 1, c('paint', 3));
  p.rect(2, 7, 16, 2, c('paint', 3));
  for (let x = 0; x < 20; x++) if (x % 5 === 2) p.disc(x, 15, 1, c('ink', 0));
  p.rect(0, 13, 20, 4, c('red', 0));
  p.rect(1, 17, 18, 2, c('water', 3));
  return p;
}

/** The ferry's hull under the car: low sides, so the car sits down in it. */
export function ferryHull(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(0, 12, 20, 2, c('paint', 3)).rect(0, 14, 20, 3, c('red', 1)).rect(0, 17, 20, 1, c('red', 0));
  p.rect(1, 18, 18, 1, c('water', 3));
  return p;
}

/** The ferry's bow: the hull rising to a blunt nose with its loading ramp folded up. */
export function ferryBow(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let x = 0; x < 14; x++) {
    const top = 12 - Math.floor(x / 2);
    p.rect(x, top, 1, 18 - top, c('red', 1)).set(x, top, c('paint', 3));
  }
  p.rect(12, 2, 3, 12, c('wood', 2)).rect(12, 2, 3, 1, c('wood', 4)).rect(14, 2, 1, 12, c('wood', 0));
  p.rect(0, 18, 14, 1, c('water', 3));
  return p;
}

/** A cow in the road, side on, chewing (`k` 0/1) or stepping along. */
export function cow(k: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const white = c('paint', 3);
  const black = c('ink', 0);
  blob(p, 9, 10, 8, 5, [c('paint', 2), white], 0, 1);
  blob(p, 6, 9, 3, 2, [black], 0, 0);
  blob(p, 12, 12, 2, 2, [black], 0, 0);
  // head, ears, horns and the pink nose
  const hy = k ? 7 : 8;
  p.rect(15, hy, 4, 5, white)
    .rect(18, hy + 3, 2, 2, c('pink', 2))
    .set(16, hy + 1, black);
  p.set(14, hy, black)
    .set(15, hy - 1, c('stone', 3))
    .set(17, hy - 1, c('stone', 3));
  // legs (stepping on the second picture), the tail and the bell
  for (const [x, dx] of [
    [3, k],
    [6, -k],
    [11, k],
    [14, -k],
  ])
    p.rect(x + dx, 15, 2, 5, white)
      .set(x + dx, 19, black)
      .set(x + dx + 1, 19, black);
  p.line(1, 8, 0, 14, black);
  p.disc(15, 14, 1, c('gold', 2));
  return p;
}

/** The cow out in the field behind the road (small, farther off), grazing (`k` 0/1). */
export function cowFar(k: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const white = c('paint', 3);
  const black = c('ink', 0);
  p.rect(5, 3, 8, 4, white).rect(7, 3, 2, 2, black).rect(10, 5, 2, 2, black);
  const hy = k ? 6 : 4;
  p.rect(13, hy, 3, 3, white)
    .set(15, hy + 2, c('pink', 2))
    .set(13, hy, black);
  for (const x of [5, 7, 10, 12]) p.rect(x, 7, 1, 3, white);
  p.set(4, 4, black).set(4, 5, black);
  return p;
}

/** The cow halfway between the road and the field (turning, on her way in or out). */
export function cowTurn(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const white = c('paint', 3);
  const black = c('ink', 0);
  blob(p, 10, 9, 6, 4, [c('paint', 2), white], 0, 1);
  blob(p, 8, 8, 2, 2, [black], 0, 0);
  p.rect(14, 5, 4, 4, white).rect(17, 7, 2, 2, c('pink', 2)).set(15, 6, black);
  for (const x of [6, 9, 12, 14]) p.rect(x, 12, 2, 4, white).set(x, 15, black);
  return p;
}
