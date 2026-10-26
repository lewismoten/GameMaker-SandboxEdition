// THE CHEZ as the hero of the driving stops: the shared side view (games/kit/chez.ts) at half
// size, a little taller than true, so the whole tomato-red CitiCar fits one block (Teddy's
// size, as realm drives it). Teddy's ear tip pokes up at the back. Two frames of a bounce for driving, a squat and a spring for the
// bump, a honk (the horn's sound rings drawn by the honk monster), a flash for a jolt, and
// the car sagging on its springs when the team is all tuckered out.
import { Pixels } from '../../../kit/pixels';
import { chezSide, type ChezInk } from '../../../kit/chez';
import { CLEAR } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** THE CHEZ in this game's colors (the sequel's parked car uses the same). */
export const CHEZ_INK: ChezInk = {
  body: [c('red', 1), c('red', 2), c('red', 3)],
  trim: c('red', 0),
  glass: [c('blue', 1), c('sky', 6)],
  roof: c('ink', 0),
  tire: c('ink', 0),
  hub: c('metal', 4),
  rim: c('paint', 3),
  bumper: c('ink', 1),
  lamp: c('gold', 1),
  tail: c('red', 3),
  stripe: c('ink', 1),
  pin: c('paint', 3),
  chrome: c('metal', 4),
};

const TALL = 1.3;

/** The car in a 20x20 block, its wheels on the block's floor, `dy` pixels up or down. */
function car(dy = 0, squash = false): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const h = Math.round(10 * (squash ? 1.1 : TALL));
  chezSide(p, 0, 20 - h + dy, CHEZ_INK, 'right', 0.5, squash ? 1.1 : TALL);
  // the tip of Teddy's ear poking up at the back
  const top = 20 - h + dy;
  p.set(5, top + 1, c('corgi', 3)).set(5, top, c('corgi', 2));
  return p;
}

/** Lighter all over (a jolt from a pothole). */
function flash(src: Pixels): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let i = 0; i < 400; i++) if (src.px[i] !== CLEAR) p.px[i] = src.px[i] === c('ink', 0) ? c('ink', 1) : c('paint', 3);
  return p;
}

export const CHEZ_HERO: Record<string, Pixels> = {
  car0: car(0),
  car1: car(-1),
  carLow: car(1, true),
  carHop: car(-2),
  carFlash: flash(car(0)),
  carSag: car(2, true),
};
