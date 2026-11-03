// Small signed-distance building blocks for 3D-print trinkets, in millimeters (negative inside, z up from the floor at 0):
// flat 2D shapes (circle, rounded rectangle, polygon, ring, lettering in the 3x5 micro font), extruding them into slabs,
// and combining solids. fieldTrinket.ts meshes what these build; trinketKinds.ts makes coins, tags, pins and dice of them.
import { MICRO_GLYPHS } from '../microFont';

export type D2 = (x: number, y: number) => number;
export type D3 = (x: number, y: number, z: number) => number;

export const circle2 =
  (r: number, cx = 0, cy = 0): D2 =>
  (x, y) =>
    Math.hypot(x - cx, y - cy) - r;
export const ring2 =
  (r0: number, r1: number): D2 =>
  (x, y) => {
    const r = Math.hypot(x, y);
    return Math.max(r0 - r, r - r1);
  };
export const roundRect2 =
  (hx: number, hy: number, r: number, cx = 0, cy = 0): D2 =>
  (x, y) => {
    const qx = Math.abs(x - cx) - hx + r;
    const qy = Math.abs(y - cy) - hy + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
/** A capsule: the line from (ax, ay) to (bx, by), `r` wide each side. */
export const capsule2 =
  (ax: number, ay: number, bx: number, by: number, r: number): D2 =>
  (x, y) => {
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy) - r;
  };
/** A convex or concave polygon (counter-clockwise or not), by points. */
export function polygon2(pts: [number, number][]): D2 {
  return (x, y) => {
    let d = Infinity;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[j];
      const [bx, by] = pts[i];
      const ex = bx - ax;
      const ey = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)));
      d = Math.min(d, Math.hypot(x - ax - t * ex, y - ay - t * ey));
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside ? -d : d;
  };
}

/** Lines of text in the 3x5 micro font, each pixel a rounded square `px` mm wide, the block centered on (cx, cy). Letters are `px` apart, lines 2 px. */
export function pixelText2(lines: string[], px: number, cx = 0, cy = 0, round = 0.25): D2 {
  const cells: [number, number][] = [];
  const rows = lines.length;
  lines.forEach((line, li) => {
    const w = line.length * 4 - 1;
    [...line].forEach((ch, ci) => {
      if (ch === ' ') return;
      const g = MICRO_GLYPHS[ch];
      if (g === undefined) throw new RangeError(`No micro glyph for ${ch}`);
      for (let i = 0; i < 15; i++)
        if (g[i] === '1') cells.push([(ci * 4 + (i % 3) - w / 2 + 0.5) * px + cx, (-(li * 7 + Math.floor(i / 3)) + (rows * 7 - 2) / 2 - 0.5) * px + cy]);
    });
  });
  const key = (ix: number, iy: number) => `${ix},${iy}`;
  const grid = new Map<string, [number, number][]>();
  for (const c of cells) {
    const k = key(Math.floor(c[0] / (px * 2)), Math.floor(c[1] / (px * 2)));
    grid.set(k, [...(grid.get(k) ?? []), c]);
  }
  const half = px / 2;
  const rr = Math.min(half, round * px);
  return (x, y) => {
    const gx = Math.floor(x / (px * 2));
    const gy = Math.floor(y / (px * 2));
    let d = Infinity;
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (const [ux, uy] of grid.get(key(gx + a, gy + b)) ?? []) {
          const qx = Math.abs(x - ux) - half + rr;
          const qy = Math.abs(y - uy) - half + rr;
          d = Math.min(d, Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr);
        }
    // pixels farther than a cell away are not near enough to matter: report a safe distance
    return Math.min(d, px * 2);
  };
}

/** A flat shape standing from z0 to z1. */
export const extrude =
  (d2: D2, z0: number, z1: number): D3 =>
  (x, y, z) =>
    Math.max(d2(x, y), Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2);
export const sphere3 =
  (cx: number, cy: number, cz: number, r: number): D3 =>
  (x, y, z) =>
    Math.hypot(x - cx, y - cy, z - cz) - r;
/** A box with rounded edges, centered, half sizes hx, hy, hz and corner radius r. */
export const roundBox3 =
  (cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, r: number): D3 =>
  (x, y, z) => {
    const qx = Math.abs(x - cx) - hx + r;
    const qy = Math.abs(y - cy) - hy + r;
    const qz = Math.abs(z - cz) - hz + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
export const union3 =
  (...fs: D3[]): D3 =>
  (x, y, z) => {
    let m = Infinity;
    for (const f of fs) m = Math.min(m, f(x, y, z));
    return m;
  };
export const subtract3 =
  (a: D3, ...cuts: D3[]): D3 =>
  (x, y, z) => {
    let m = a(x, y, z);
    for (const c of cuts) m = Math.max(m, -c(x, y, z));
    return m;
  };
export const intersect3 =
  (a: D3, b: D3): D3 =>
  (x, y, z) =>
    Math.max(a(x, y, z), b(x, y, z));
export const union2 =
  (...fs: D2[]): D2 =>
  (x, y) => {
    let m = Infinity;
    for (const f of fs) m = Math.min(m, f(x, y));
    return m;
  };
