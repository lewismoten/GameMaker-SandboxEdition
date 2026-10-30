// Drawing on a picture of any size (a block group joined into one, w x h indexed pixels):
// mirror points, lines, boxes and flood fill. Pure; they change the pixels passed in.
import { Pixels } from '../kit/pixels';

export type SurfaceMirror = 'none' | 'h' | 'v' | 'both';

/** The pixel and its mirror images across the whole picture, without repeats. */
export function mirrorAll(x: number, y: number, w: number, h: number, mirror: SurfaceMirror): [number, number][] {
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

/** Fills one four-connected color region. A mask and writer can preserve missing or shared tiles. */
export function floodFill(
  px: Uint8Array,
  w: number,
  h: number,
  x: number,
  y: number,
  v: number,
  allowed: (x: number, y: number) => boolean = () => true,
  paint: (x: number, y: number, value: number) => void = (x, y, value) => {
    px[y * w + x] = value;
  },
): void {
  if (!Number.isSafeInteger(w) || !Number.isSafeInteger(h) || w < 1 || h < 1 || px.length !== w * h)
    throw new RangeError('Expected width × height indexed pixels');
  if (x < 0 || y < 0 || x >= w || y >= h || !allowed(x, y)) return;
  const source = px.slice();
  const target = source[y * w + x];
  if (target === v) return;
  const visited = new Uint8Array(px.length);
  const stack = [x, y];
  while (stack.length) {
    const cy = stack.pop()!,
      cx = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h || visited[cy * w + cx] || source[cy * w + cx] !== target || !allowed(cx, cy)) continue;
    visited[cy * w + cx] = 1;
    paint(cx, cy, v);
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
  }
}

/** Move indexed pixels with wrapping at each edge; the input is unchanged. */
export function shiftPixels(src: Pixels, dx: number, dy: number): Pixels {
  const wrap = (value: number, length: number) => ((value % length) + length) % length;
  return new Pixels(src.w, src.h).map((x, y) => src.get(wrap(x - dx, src.w), wrap(y - dy, src.h)));
}
