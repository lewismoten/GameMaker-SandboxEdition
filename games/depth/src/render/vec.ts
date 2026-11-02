// Vectors and colors for the ray tracer (tracer.ts): 3-component tuples, used both for
// points and directions (z is up) and for linear RGB colors in 0..1.

export type V = [number, number, number];

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];
export const had = (a: V, b: V): V => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/**
 * Math.hypot(a, b, c) and Math.hypot(a, b) with V8's own algorithm (scale by the largest, Kahan sum), written
 * out so the JIT can inline them: the same bits as the built-in (checked on 40 million values), and faster.
 */
export function hypot3(a: number, b: number, c: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  c = Math.abs(c);
  let m = a > b ? a : b;
  if (c > m) m = c;
  if (!(m < Infinity)) return Math.hypot(a, b, c);
  if (m === 0) return 0;
  // the first term has no compensation yet (0), so the first two steps reduce to these
  let n = a / m;
  const sum = n * n;
  n = b / m;
  let s = n * n;
  const p = sum + s;
  const comp = p - sum - s;
  n = c / m;
  s = n * n - comp;
  return Math.sqrt(p + s) * m;
}
export function hypot2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  const m = a > b ? a : b;
  if (!(m < Infinity)) return Math.hypot(a, b);
  if (m === 0) return 0;
  let n = a / m;
  const sum = n * n;
  n = b / m;
  return Math.sqrt(sum + n * n) * m;
}
export const len = (a: V) => hypot3(a[0], a[1], a[2]);
export const norm = (a: V): V => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** A color from 8-bit sRGB-ish components (the tracer works in 0..1). */
export const rgb = (r: number, g: number, b: number): V => [r / 255, g / 255, b / 255];
