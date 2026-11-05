// BLOCK BRAINS' pictures: gates (shut bars, or open with the bars drawn up), the tally plate above
// each gate, and the lamps that show whose turn it is. Each gate and lamp has a color, so a
// lit lamp and the gate it opens go together. Nothing here is scary: a gate is a garden gate.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Hue = 'gold' | 'blue' | 'red';
export const HUES: Hue[] = ['gold', 'blue', 'red'];

/** One cell of a gate: shut (three bars and a crossbar between two stone posts) or open (the bars drawn up, the posts left). */
export function gate(pal: Pal, hue: Hue, shut: boolean): Pixels {
  const { r } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  const s = r('stone');
  const h = r(hue);
  p.rect(0, 0, 3, 20, s[1]).rect(0, 0, 1, 20, s[3]).rect(2, 0, 1, 20, s[0]);
  p.rect(17, 0, 3, 20, s[1]).rect(17, 0, 1, 20, s[3]).rect(19, 0, 1, 20, s[0]);
  if (shut) {
    for (const x of [5, 9, 13])
      p.rect(x, 0, 3, 20, h[2])
        .rect(x, 0, 1, 20, h[3])
        .rect(x + 2, 0, 1, 20, h[0]);
    p.rect(3, 8, 14, 3, h[1]).rect(3, 8, 14, 1, h[3]);
  } else {
    // the bars are drawn up: only the posts are left, with a thin glow of the gate's color along the ground
    p.rect(3, 19, 14, 1, h[2]);
  }
  return p;
}

/** The plate above a gate: stone with `n` tally marks (1, 2 or 3) in the gate's color, so the gates can be told apart without color. */
export function cap(pal: Pal, hue: Hue, n: number): Pixels {
  const { r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, s[2]);
  p.rect(0, 0, 20, 1, s[3]).rect(0, 19, 20, 1, s[0]).rect(0, 0, 1, 20, s[3]).rect(19, 0, 1, 20, s[0]);
  const h = r(hue);
  // tally marks, one to three, so the gates can be told apart without color
  const x0 = 10 - Math.floor((n * 5) / 2) + 1;
  for (let i = 0; i < n; i++)
    p.rect(x0 + i * 5, 4, 3, 11, h[2])
      .rect(x0 + i * 5, 4, 1, 11, h[3])
      .rect(x0 + i * 5 + 2, 4, 1, 11, h[0]);
  return p;
}

/** A lamp on a post: lit (bright, with a glow) or dark (gray glass). */
export function lamp(pal: Pal, hue: Hue, lit: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  const s = r('stone');
  p.rect(9, 12, 3, 8, s[1]).rect(9, 12, 1, 8, s[3]).rect(11, 12, 1, 8, s[0]);
  p.rect(5, 18, 11, 2, s[1]).rect(5, 18, 11, 1, s[3]);
  const h = r(hue);
  if (lit) {
    p.disc(10, 7, 8, h[4]);
    p.disc(10, 7, 6.5, h[2]);
    p.disc(8, 5, 2, r('white')[3]);
  } else {
    p.disc(10, 7, 6.5, c('ink', 1));
    p.disc(10, 7, 5.5, s[2]);
    p.disc(8, 5, 1.5, s[3]);
  }
  p.rect(7, 12, 7, 2, s[0]);
  return p;
}
