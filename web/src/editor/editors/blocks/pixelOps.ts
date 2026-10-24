// Whole-block pixel transforms for the block painter: flip, rotate, shift with wrap, recolor
// and swap a color range, plus the mirror points for symmetric drawing. Pure: each takes a
// 20x20 block's pixels and returns new ones.
import { BLEN } from '../../../formats/blocks';

const L = BLEN - 1;

function map(src: Uint8Array, at: (x: number, y: number) => number): Uint8Array {
  const out = new Uint8Array(BLEN * BLEN);
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) out[y * BLEN + x] = src[at(x, y)];
  return out;
}

export const flipH = (s: Uint8Array) => map(s, (x, y) => y * BLEN + (L - x));
export const flipV = (s: Uint8Array) => map(s, (x, y) => (L - y) * BLEN + x);
/** A quarter turn clockwise. */
export const rotateCW = (s: Uint8Array) => map(s, (x, y) => (L - x) * BLEN + y);
/** A quarter turn counterclockwise. */
export const rotateCCW = (s: Uint8Array) => map(s, (x, y) => x * BLEN + (L - y));

/** Moves the picture by (dx, dy) pixels; what leaves one edge comes back on the other. */
export function shiftWrap(s: Uint8Array, dx: number, dy: number): Uint8Array {
  const w = (v: number) => ((v % BLEN) + BLEN) % BLEN;
  return map(s, (x, y) => w(y - dy) * BLEN + w(x - dx));
}

/** Every pixel of color `from` becomes `to`. */
export function recolor(s: Uint8Array, from: number, to: number): Uint8Array {
  return s.map((v) => (v === from ? to : v));
}

/** Colors from..from+count-1 become to..to+count-1 (a ramp moved to another ramp). */
export function moveRange(s: Uint8Array, from: number, to: number, count: number): Uint8Array {
  return s.map((v) => (v >= from && v < from + count && to + (v - from) <= 255 ? to + (v - from) : v));
}

/** Swaps two equal ranges both ways (from..+count with to..+count). */
export function swapRange(s: Uint8Array, a: number, b: number, count: number): Uint8Array {
  return s.map((v) => (v >= a && v < a + count ? b + (v - a) : v >= b && v < b + count ? a + (v - b) : v));
}

export type Mirror = 'none' | 'h' | 'v' | 'both';

/** The pixel and its mirror images (left-right, top-bottom or all four), without repeats. */
export function mirrorPoints(x: number, y: number, mirror: Mirror): [number, number][] {
  const pts: [number, number][] = [[x, y]];
  if (mirror === 'h' || mirror === 'both') pts.push([L - x, y]);
  if (mirror === 'v' || mirror === 'both') pts.push([x, L - y]);
  if (mirror === 'both') pts.push([L - x, L - y]);
  return pts.filter(([px, py], i) => pts.findIndex(([qx, qy]) => qx === px && qy === py) === i);
}

/** How many pixels of each color a block uses. */
export function colorCounts(s: Uint8Array): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of s) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}
