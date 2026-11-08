// Plane geometry for stitch generation: outlines of circles and stars, insetting, containment, resampling.
import type { Poly, Pt } from './types';

export const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** A circle as a polygon of `n` points, counter-clockwise from the right. */
export function circle(cx: number, cy: number, r: number, n = 96): Poly {
  return Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as Pt);
}

/** A star with `points` tips (first tip at `start` radians) between an inner and an outer radius. */
export function star(cx: number, cy: number, inner: number, outer: number, points: number, start = Math.PI / 2): Poly {
  const out: Poly = [];
  for (let i = 0; i < points * 2; i++) {
    const a = start + (i * Math.PI) / points;
    const r = i % 2 ? inner : outer;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Points on an elliptical arc from angle a0 to a1 (radians), `n` segments. */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 16): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt;
  });
}

/** Signed area (positive when counter-clockwise). */
export function area(p: Poly): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** The outline moved `d` mm inward (outward when negative), mitered at the corners with the miter length capped. */
export function inset(p: Poly, d: number): Poly {
  const sign = area(p) >= 0 ? 1 : -1;
  const n = p.length;
  const normal = (a: Pt, b: Pt): Pt => {
    const l = dist(a, b) || 1;
    return [(-(b[1] - a[1]) / l) * sign, ((b[0] - a[0]) / l) * sign]; // left of travel for ccw = inward
  };
  return p.map((q, i) => {
    const n1 = normal(p[(i + n - 1) % n], q);
    const n2 = normal(q, p[(i + 1) % n]);
    const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    let mx = n1[0] + n2[0];
    let my = n1[1] + n2[1];
    if (k < 0.2) {
      mx = n1[0];
      my = n1[1];
    } else {
      mx /= k;
      my /= k;
    }
    const l = Math.hypot(mx, my);
    const cap = Math.min(1, 2.5 / (l || 1));
    return [q[0] + mx * d * cap, q[1] + my * d * cap] as Pt;
  });
}

/** Even-odd containment in any of the outlines. */
export function inside(polys: Poly[], pt: Pt): boolean {
  let hit = false;
  for (const p of polys) {
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const a = p[i];
      const b = p[j];
      if (a[1] > pt[1] !== b[1] > pt[1] && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
  }
  return hit;
}

/** The path cut into points about `step` mm apart along it (its corners are kept). Closed paths return to the start. */
export function resample(path: Pt[], step: number, closed = false): Pt[] {
  const pts = closed ? [...path, path[0]] : path;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

/** The path cut at even spacing by arc length (corners are not kept), for satin. */
export function evenly(path: Pt[], step: number, closed = false): Pt[] {
  const pts = closed ? [...path, path[0]] : path;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1];
  const n = Math.max(1, Math.round(total / step));
  const out: Pt[] = [];
  let seg = 1;
  for (let k = 0; k <= n; k++) {
    const s = (total * k) / n;
    while (seg < pts.length - 1 && cum[seg] < s) seg++;
    const span = cum[seg] - cum[seg - 1] || 1;
    const t = (s - cum[seg - 1]) / span;
    out.push([pts[seg - 1][0] + (pts[seg][0] - pts[seg - 1][0]) * t, pts[seg - 1][1] + (pts[seg][1] - pts[seg - 1][1]) * t]);
  }
  return out;
}

export const rotate = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
