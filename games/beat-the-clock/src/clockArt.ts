// BEAT THE CLOCK's pictures for the blocks that keep time: the clock face, the bar's segments,
// the gate and its lamp, and the restart door. They are 20x20 block pictures; the timing
// (which block turns into which, after how many ticks) is added in levels.ts.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** How a bar segment looks: lit (green, full height), warning (orange, thin), or out (dim). */
export type Fill = 'on' | 'warn' | 'off';

/** The board the bar and clock sit on: a dark panel on the sky (or on `back`, such as brick), with a wooden frame. `ends` says which sides close. */
function panel(pal: Pal, left: boolean, right: boolean, back?: Pixels): Pixels {
  const { c } = pal;
  const p = back ? back.crop(0, 0, 20, 20) : new Pixels(20, 20, skyOf(pal));
  p.rect(0, 3, 20, 14, c('wood', 1)).rect(0, 3, 20, 1, c('wood', 3)).rect(0, 16, 20, 1, c('wood', 0));
  p.rect(0, 4, 20, 12, c('ink', 0));
  if (left) p.rect(0, 3, 2, 14, c('wood', 2)).rect(0, 3, 1, 14, c('wood', 3));
  if (right) p.rect(18, 3, 2, 14, c('wood', 1)).rect(19, 3, 1, 14, c('wood', 0));
  return p;
}

/** One segment of the bar. */
export function segment(pal: Pal, fill: Fill, last: boolean): Pixels {
  const { c } = pal;
  const p = panel(pal, false, last);
  const x = 2;
  const w = last ? 15 : 16;
  if (fill === 'on') {
    p.rect(x, 6, w, 8, c('green', 2)).rect(x, 6, w, 2, c('green', 3)).rect(x, 12, w, 2, c('green', 1));
  } else if (fill === 'warn') {
    // thinner as well as orange, so it reads without color
    p.rect(x, 8, w, 4, c('orange', 3)).rect(x, 8, w, 1, c('orange', 4));
  } else {
    p.frame(x, 6, w, 8, c('ink', 2));
  }
  return p;
}

/** The clock face at the bar's left end, its hand at 12, 3, 6 or 9 o'clock; on `back` (the brick wall) when given. */
export function face(pal: Pal, quarter: number, back?: Pixels): Pixels {
  const { c } = pal;
  const p = panel(pal, true, false, back);
  const cx = 11;
  const cy = 10;
  p.disc(cx, cy, 7.5, c('wood', 4)).disc(cx, cy, 6.5, c('parch', 4));
  for (const [dx, dy] of [
    [0, -5],
    [5, 0],
    [0, 5],
    [-5, 0],
  ] as const)
    p.set(cx + dx, cy + dy, c('ink', 0));
  const [hx, hy] = (
    [
      [0, -5],
      [5, 0],
      [0, 5],
      [-5, 0],
    ] as const
  )[quarter];
  // a short hour hand that stays at about four o'clock, so the face reads as a clock at every quarter
  p.line(cx, cy, cx + 3, cy + 2, c('ink', 0)).line(cx, cy + 1, cx + 2, cy + 2, c('ink', 0));
  p.line(cx, cy, cx + Math.round(hx * 0.8), cy + Math.round(hy * 0.8), c('red', 2));
  p.disc(cx, cy, 1, c('ink', 0));
  return p;
}

/** One of the gate's three columns (the gate is three blocks wide, two high): open (a steel post at each end, a header over the top) or shut (a steel plate, solid). */
export function gate(pal: Pal, shut: boolean, bottom: boolean, part: 'l' | 'm' | 'r'): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, skyOf(pal));
  if (!shut) {
    for (const x of part === 'l' ? [1] : part === 'r' ? [16] : [])
      p.rect(x, 0, 3, 20, s[2])
        .rect(x, 0, 1, 20, s[4])
        .rect(x + 2, 0, 1, 20, s[1]);
    if (!bottom) p.rect(0, 0, 20, 3, s[2]).rect(0, 0, 20, 1, s[4]);
    return p;
  }
  p.rect(0, 0, 20, 20, s[2]);
  for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, s[1]).rect(0, y + 1, 20, 1, s[3]);
  if (part !== 'r') p.rect(0, 0, 1, 20, s[1]);
  if (part !== 'l') p.rect(19, 0, 1, 20, s[1]);
  // a band of gold and ink stripes across the middle where the two halves meet
  const y0 = bottom ? 0 : 14;
  for (let x = 0; x < 20; x++) {
    for (let y = y0; y < y0 + 6; y++) p.set(x, y, (x + y) % 8 < 4 ? c('gold', 3) : c('ink', 0));
  }
  if (!bottom) p.rect(0, 0, 20, 2, s[4]);
  return p;
}

/** The lamp over the gate, set in the brick wall: green when open, red when shut. */
export function lamp(pal: Pal, brick: Pixels, shut: boolean): Pixels {
  const { c } = pal;
  const p = brick.crop(0, 0, 20, 20);
  p.disc(10, 10, 7.5, c('stone', 1)).disc(10, 10, 6.5, c('stone', 3));
  p.disc(10, 10, 5, shut ? c('red', 2) : c('green', 3));
  p.disc(8, 8, 1.5, shut ? c('red', 4) : c('green', 4));
  return p;
}

/** The restart door, as one 20x40 picture (top and bottom blocks): a teal door with a clock face on it. */
export function restartDoor(pal: Pal): Pixels {
  const { c, r } = pal;
  const t = r('teal');
  const d = new Pixels(20, 40, skyOf(pal));
  bevel(d, 2, 2, 16, 38, t, 2, 2);
  d.rect(5, 5, 10, 14, t[3]).frame(5, 5, 10, 14, t[1]);
  d.rect(5, 22, 10, 14, t[3]).frame(5, 22, 10, 14, t[1]);
  // a clock face in the upper panel, its hands at a quarter past
  d.disc(10, 12, 6.5, c('white', 3)).ring(10, 12, 6.5, t[0]);
  d.line(10, 12, 10, 8, c('red', 2)).line(10, 12, 13, 12, c('red', 2)).set(10, 12, c('ink', 0));
  d.disc(14.5, 29, 1.6, c('gold', 3));
  return d;
}
