// Satin columns: stitches that zigzag straight across a line, `density` mm apart along it. A column wider than `maxWidth` is
// sewn as lanes side by side (long satin stitches snag). Pull compensation widens the column so the thread covers its shape.
import { evenly } from './geom';
import type { Pt } from './types';

/** The left and right edge points across the path at each of its sample points. */
function edges(path: Pt[], width: number, step: number, closed: boolean): [Pt, Pt][] {
  const p = evenly(path, step, closed);
  const n = p.length;
  return p.map((q, i) => {
    const a = p[closed ? (i + n - 2) % (n - 1) : Math.max(0, i - 1)];
    const b = p[closed ? (i + 1) % (n - 1) : Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / l) * (width / 2);
    const ny = ((b[0] - a[0]) / l) * (width / 2);
    return [
      [q[0] + nx, q[1] + ny],
      [q[0] - nx, q[1] - ny],
    ];
  });
}

/** One lane of zigzag between offsets `from` and `to` (fractions of the full width, -0.5 to 0.5 from the center line). */
function lane(path: Pt[], width: number, density: number, closed: boolean, from: number, to: number): Pt[] {
  const e = edges(path, width, density, closed);
  const mix = (pair: [Pt, Pt], f: number): Pt => [pair[0][0] + (pair[1][0] - pair[0][0]) * (0.5 - f), pair[0][1] + (pair[1][1] - pair[0][1]) * (0.5 - f)];
  const out: Pt[] = [];
  e.forEach((pair, i) => out.push(mix(pair, i % 2 ? to : from)));
  return out;
}

/**
 * The needle points of a satin column along `path` (closed paths end where they began).
 * Each lane is one list; a column up to `maxWidth` is a single lane.
 */
export function satin(path: Pt[], width: number, density: number, closed: boolean, maxWidth: number): Pt[][] {
  const lanes = Math.max(1, Math.ceil(width / maxWidth - 1e-9));
  const out: Pt[][] = [];
  for (let k = 0; k < lanes; k++) out.push(lane(path, width, density, closed, -0.5 + k / lanes, -0.5 + (k + 1) / lanes));
  return out;
}

/**
 * Underlay for a satin column: a walk down its center, and a loose zigzag a little narrower than the column when it is
 * wide enough to need one.
 */
export function satinUnderlay(path: Pt[], width: number, run: number, closed: boolean): Pt[][] {
  const walk = evenly(path, run, closed);
  const out: Pt[][] = [walk];
  if (width > 2) out.push(lane(path, width - 0.8, run * 0.7, closed, -0.5, 0.5));
  return out;
}
