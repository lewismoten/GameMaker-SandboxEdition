// Corner View's drawing: the pictures a corner view is made of, painted with plain pixel loops. The floor is a
// field of diamonds 20 wide and 10 high; a cube is a diamond top with a left and a right side. The floor's
// pattern repeats every 20 pixels across and down, so on the game's square grid every floor block is the same
// picture. Nothing here knows about the grid: the levels cut the finished picture into 20x20 blocks.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** The colors a cube is painted with: its top, its left side, its right side and its outline. */
export interface Shades {
  top: number;
  left: number;
  right: number;
  line: number;
}

export const cubeShades = (pal: Pal, ramp: string): Shades => {
  const r = pal.r(ramp);
  return { top: r[3], left: r[2], right: r[1], line: r[0] };
};

/** The floor over the whole picture: diamonds in two colors with a thin darker line between them. */
export function floor(p: Pixels, pal: Pal): void {
  const [a, b, line] = [pal.c('parch', 2), pal.c('parch', 3), pal.c('parch', 1)];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const dp = (x + 0.5 - 10) / 10 + (y + 0.5 - 5) / 5;
      const dq = (x + 0.5 - 10) / 10 - (y + 0.5 - 5) / 5;
      const i = Math.floor((dp + 1) / 2);
      const j = Math.floor((dq + 1) / 2);
      const edge = Math.max(Math.abs(dp - 2 * i), Math.abs(dq - 2 * j));
      p.set(x, y, edge > 0.86 ? line : (i + j) & 1 ? a : b);
    }
}

/** A flat diamond pad centered on (cx, cy), `ramp` colored: the entrance and the exit. */
export function pad(p: Pixels, pal: Pal, cx: number, cy: number, ramp: string): void {
  const r = pal.r(ramp);
  const ink = pal.c('ink', 0);
  for (let y = -6; y <= 6; y++)
    for (let x = -12; x <= 12; x++) {
      const d = Math.abs(x + 0.5) / 12 + Math.abs(y + 0.5) / 6;
      if (d <= 1) p.set(cx + x, cy + y, d > 0.86 ? ink : d > 0.55 ? r[3] : r[4]);
    }
}

/**
 * A tower standing on the floor: its lowest point is (cx, bottom), it is `rise` pixels tall under a diamond top 20
 * wide, with a left side and a right side. A rise of 10 is the cube of one block; 30 and 50 fill two and three.
 */
export function tower(p: Pixels, cx: number, bottom: number, rise: number, s: Shades): void {
  const top = bottom - rise - 10; // the diamond's highest point
  const cy = top + 5; // its middle
  for (let y = top; y < bottom; y++)
    for (let x = cx - 10; x < cx + 10; x++) {
      const half = 5 - Math.abs(x + 0.5 - cx) / 2; // half the diamond's height at this x
      const lower = cy + half;
      if (Math.abs(y + 0.5 - cy) <= half) p.set(x, y, s.top);
      else if (y + 0.5 > lower && y + 0.5 <= lower + rise) p.set(x, y, x + 0.5 < cx ? s.left : s.right);
    }
  const L = cx - 10;
  const R = cx + 9;
  const line = (x0: number, y0: number, x1: number, y1: number) => p.line(x0, y0, x1, y1, s.line);
  line(cx, top, R, cy);
  line(R, cy, cx, cy + 5);
  line(cx, cy + 5, L, cy);
  line(L, cy, cx, top);
  line(L, cy, L, cy + rise);
  line(R, cy, R, cy + rise);
  line(cx, cy + 5, cx, cy + 5 + rise);
  line(L, cy + rise, cx, cy + 5 + rise);
  line(cx, cy + 5 + rise, R, cy + rise);
}
