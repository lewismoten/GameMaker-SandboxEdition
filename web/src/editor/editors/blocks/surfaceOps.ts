// Drawing on a picture of any size (a block group joined into one, w x h indexed pixels):
// mirror points, lines, boxes and flood fill. Pure; they change the pixels passed in.
import type { Mirror } from './pixelOps';

/** The pixel and its mirror images across the whole picture, without repeats. */
export function mirrorAll(x: number, y: number, w: number, h: number, mirror: Mirror): [number, number][] {
  const pts: [number, number][] = [[x, y]];
  if (mirror === 'h' || mirror === 'both') pts.push([w - 1 - x, y]);
  if (mirror === 'v' || mirror === 'both') pts.push([x, h - 1 - y]);
  if (mirror === 'both') pts.push([w - 1 - x, h - 1 - y]);
  return pts.filter(([px, py], i) => pts.findIndex(([qx, qy]) => qx === px && qy === py) === i);
}

type Plot = (x: number, y: number) => void;

/** Every pixel of a straight line from a to b. */
export function line(a: { x: number; y: number }, b: { x: number; y: number }, plot: Plot): void {
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
  for (let i = 0; i <= n; i++) plot(Math.round(a.x + ((b.x - a.x) * i) / n), Math.round(a.y + ((b.y - a.y) * i) / n));
}

/** The outline of the box with corners a and b. */
export function box(a: { x: number; y: number }, b: { x: number; y: number }, plot: Plot): void {
  for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
    plot(x, a.y);
    plot(x, b.y);
  }
  for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
    plot(a.x, y);
    plot(b.x, y);
  }
}

/** Fills the run of one color around (x, y) with v (four-way). */
export function floodFill(px: Uint8Array, w: number, h: number, x: number, y: number, v: number): void {
  const target = px[y * w + x];
  if (target === v) return;
  const stack = [x, y];
  while (stack.length) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h || px[cy * w + cx] !== target) continue;
    px[cy * w + cx] = v;
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
  }
}
