// COUNTDOWN's digits, drawn like the ones on a clock radio: seven bars, lit or dark, on a dark
// board. A digit is 20x20 at scale 1 and 40x40 at scale 2 (four blocks). The unlit bars stay
// faintly there, so a 1 never looks like a stray line and an 8 is never a 0 with a gap.
// Green for 9 to 4, orange for 3 to 1, red for 0: the shape tells them apart without color.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** Which bars each digit lights: a top, b top right, c bottom right, d bottom, e bottom left, f top left, g middle. */
const LIT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];

/** Each bar as [x, y, w, h] on a 20x20 board. */
const BAR: Record<string, [number, number, number, number]> = {
  a: [5, 2, 10, 2],
  b: [14, 3, 2, 7],
  c: [14, 10, 2, 7],
  d: [5, 16, 10, 2],
  e: [4, 10, 2, 7],
  f: [4, 3, 2, 7],
  g: [5, 9, 10, 2],
};

/** The picture of `n` (0 to 9) at `scale` (1 or 2 or 3), framed in wood. */
export function digit(pal: Pal, n: number, scale = 1): Pixels {
  const { c } = pal;
  const s = 20 * scale;
  const p = new Pixels(s, s, c('ink', 0));
  const [lit, edge] = n === 0 ? [c('red', 3), c('red', 4)] : n <= 3 ? [c('orange', 3), c('orange', 4)] : [c('green', 3), c('green', 4)];
  for (const [bar, [x, y, w, h]] of Object.entries(BAR)) {
    const on = LIT[n].includes(bar);
    p.rect(x * scale, y * scale, w * scale, h * scale, on ? lit : c('ink', 1));
    if (on) p.rect(x * scale, y * scale, w * scale, Math.max(1, scale), edge);
  }
  p.frame(0, 0, s, s, c('wood', 1)).frame(1, 1, s - 2, s - 2, c('wood', 3));
  return p;
}
