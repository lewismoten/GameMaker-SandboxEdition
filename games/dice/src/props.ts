// ROLL THE DICE's pictures: the six faces of the die. A rolling face has a plain dark rim; a face
// that has been stopped by a touch gets a colored rim, gold for an odd number and blue for an
// even one, the color of the door its key opens.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Where the pips sit on a 20x20 face, for each number 1 to 6 (a 3x3 grid; l, m, r and t, c, b). */
const L = 6;
const M = 10;
const R = 14;
const T = 6;
const C = 10;
const B = 14;
const PIPS: Record<number, [number, number][]> = {
  1: [[M, C]],
  2: [[L, T], [R, B]],
  3: [[L, T], [M, C], [R, B]],
  4: [[L, T], [R, T], [L, B], [R, B]],
  5: [[L, T], [R, T], [M, C], [L, B], [R, B]],
  6: [[L, T], [R, T], [L, C], [R, C], [L, B], [R, B]],
};

/** The face showing `n` (1 to 6). `stopped` colors the rim by odd or even. */
export function face(pal: Pal, n: number, stopped: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = c('ink', 0);
  const rim = stopped ? (n % 2 === 1 ? c('gold', 3) : c('blue', 3)) : ink;
  const w = r('white');
  p.rect(1, 2, 18, 16, ink).rect(2, 1, 16, 18, ink);
  p.rect(2, 3, 16, 14, rim).rect(3, 2, 14, 16, rim);
  const d = stopped ? 4 : 3;
  p.rect(d, d + 1, 20 - 2 * d, 18 - 2 * d, w[3]).rect(d + 1, d, 18 - 2 * d, 20 - 2 * d, w[3]);
  p.rect(d + 1, 18 - d, 18 - 2 * d, 1, w[1]);
  for (const [x, y] of PIPS[n]) p.disc(x, y, 1.8, ink);
  return p;
}
