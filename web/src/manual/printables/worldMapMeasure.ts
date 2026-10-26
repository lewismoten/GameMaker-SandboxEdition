// How readable a World Map's paths are (worldMap.ts, worldMapPlan.ts): the ground a place
// covers on the sheet (its round picture, ribbon, ways on and the names it lists), how many
// times two paths cross, and how many paths run under a place they don't go to. Pure
// arithmetic in map units (tenths of an inch), so tests and scripts can measure every game.
import type { Point } from '../../formats/game';
import type { Rect } from './worldMapLayout';

/** A place's round picture, and the room between it and its ribbon. */
export const PIC_R = 5.2;
/** A line of the names a place lists. */
export const NAME_LINE = 1.45;

/** The ribbon's width for a name (worldMap.ts draws it so). */
export const ribbonWidth = (name: string) => Math.max(11, Math.min(19, name.length * 0.82 + 3));

/** The part of the sheet a place at `c` covers: its framed picture, ribbon, ways on and `lines` listed names. */
export function placeBox(c: Point, name: string, lines: number): Rect {
  const half = Math.max(ribbonWidth(name) / 2 + 1.6, PIC_R + 0.9, lines ? 10.8 : 9.5);
  const top = c.y - PIC_R - 0.9;
  const bottom = c.y + PIC_R + 0.5 + 4.6 + lines * NAME_LINE;
  return { x: c.x - half, y: top, w: half * 2, h: bottom - top };
}

const orient = (p: Point, q: Point, r: Point) => {
  const v = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return Math.abs(v) < 1e-9 ? 0 : Math.sign(v);
};
const cross = (a: Point, b: Point, c: Point, d: Point) => orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;

/** Does the segment a-b pass through the inside of `r`? */
export function segmentHitsRect(a: Point, b: Point, r: Rect): boolean {
  let t0 = 0;
  let t1 = 1;
  const d = { x: b.x - a.x, y: b.y - a.y };
  for (const [dd, lo, hi, s] of [
    [d.x, r.x, r.x + r.w, a.x],
    [d.y, r.y, r.y + r.h, a.y],
  ]) {
    if (Math.abs(dd) < 1e-9) {
      if (s <= lo || s >= hi) return false;
      continue;
    }
    let u0 = (lo - s) / dd;
    let u1 = (hi - s) / dd;
    if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0);
    t1 = Math.min(t1, u1);
    if (t0 >= t1) return false;
  }
  return true;
}

/** A path drawn on the map: the two places it joins and the line it takes. */
export interface DrawnPath {
  a: number;
  b: number;
  line: Point[];
}

/**
 * Times two paths cross: once for each pair of paths whose lines cross (paths that share a
 * place may meet there, and lines running along each other aren't crossings).
 */
export function crossings(paths: DrawnPath[]): number {
  let n = 0;
  for (let i = 0; i < paths.length; i++)
    for (let j = i + 1; j < paths.length; j++) {
      const p = paths[i];
      const q = paths[j];
      if (p.a === q.a || p.a === q.b || p.b === q.a || p.b === q.b) continue;
      if (linesCross(p.line, q.line)) n++;
    }
  return n;
}

function linesCross(p: Point[], q: Point[]): boolean {
  for (let i = 1; i < p.length; i++) for (let j = 1; j < q.length; j++) if (cross(p[i - 1], p[i], q[j - 1], q[j])) return true;
  return false;
}

/** Paths that run under a place they don't join (each path counted once per place it passes). */
export function throughPlaces(paths: DrawnPath[], boxes: Map<number, Rect>): { path: DrawnPath; place: number }[] {
  const out: { path: DrawnPath; place: number }[] = [];
  for (const path of paths)
    for (const [i, r] of boxes) {
      if (i === path.a || i === path.b) continue;
      const inner = { x: r.x + 0.3, y: r.y + 0.3, w: r.w - 0.6, h: r.h - 0.6 };
      for (let k = 1; k < path.line.length; k++)
        if (segmentHitsRect(path.line[k - 1], path.line[k], inner)) {
          out.push({ path, place: i });
          break;
        }
    }
  return out;
}

/** Two places' boxes that overlap. */
export function overlaps(boxes: Map<number, Rect>): [number, number][] {
  const bs = [...boxes];
  const out: [number, number][] = [];
  for (let i = 0; i < bs.length; i++)
    for (let j = i + 1; j < bs.length; j++) {
      const [a, r] = bs[i];
      const [b, s] = bs[j];
      if (r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h) out.push([a, b]);
    }
  return out;
}
