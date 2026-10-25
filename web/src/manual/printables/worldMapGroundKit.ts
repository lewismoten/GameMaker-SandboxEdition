// What the World Map's grounds (worldMapGround.ts, worldMapIndoors.ts) share: the places and
// regions they draw round, a mask of what's taken so little drawings land only in free space,
// outlines of a region as one piece, and a ruled grid.
import type { Point } from '../../formats/game';
import type { Rect } from './worldMapLayout';
import { el } from './worldMapArt';
import { xorshift32 } from '../../seededRandom';
import type { Look } from './worldMapTerrain';
import type { ThemeId } from './worldMapThemes';

export interface GroundPlace {
  i: number;
  c: Point;
  box: Rect;
  look: Look;
}

export interface GroundInput {
  theme: ThemeId;
  W: number;
  H: number;
  seed: number;
  places: GroundPlace[];
  /** Regions, by their places. */
  regions: number[][];
  lines: Point[][];
}

export interface KeyEntry {
  draw: (x: number, y: number) => SVGElement;
  name: string;
}

export interface Ground {
  /** Under the paths. */
  under: SVGElement[];
  /** Over the paths, under the places (doors). */
  over: SVGElement[];
  key: KeyEntry[];
  /** How region names are lettered. */
  letter: { fill: string; stroke: string; family?: string };
}

/** Which parts of the sheet are taken (by places, paths and drawings), half a unit to a cell. */
export class Mask {
  private cols: number;
  private m: Uint8Array;
  constructor(
    W: number,
    private H: number,
  ) {
    this.cols = Math.ceil(W * 2) + 1;
    this.m = new Uint8Array(this.cols * (Math.ceil(H * 2) + 1));
  }
  private fill(x0: number, y0: number, x1: number, y1: number, v: number): boolean {
    const c0 = Math.max(0, Math.floor(x0 * 2));
    const c1 = Math.min(this.cols - 1, Math.ceil(x1 * 2));
    const r0 = Math.max(0, Math.floor(y0 * 2));
    const r1 = Math.min(Math.ceil(this.H * 2), Math.ceil(y1 * 2));
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        if (v === 2 && this.m[r * this.cols + c]) return false;
        if (v === 1) this.m[r * this.cols + c] = 1;
      }
    return true;
  }
  rect(r: Rect, pad: number) {
    this.fill(r.x - pad, r.y - pad, r.x + r.w + pad, r.y + r.h + pad, 1);
  }
  line(pts: Point[], pad: number) {
    for (let k = 1; k < pts.length; k++) {
      const [a, b] = [pts[k - 1], pts[k]];
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2) + 1;
      for (let i = 0; i <= n; i++) this.mark({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }, pad);
    }
  }
  mark(p: Point, r: number) {
    this.fill(p.x - r, p.y - r, p.x + r, p.y + r, 1);
  }
  free(p: Point, r: number): boolean {
    return p.x - r > 2 && p.y - r > 2 && this.fill(p.x - r, p.y - r, p.x + r, p.y + r, 2);
  }
}

export const mid = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const grow = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });
export const inRect = (p: Point, r: Rect) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;

/** Up to `n` spots for drawings near place `p` (nearer it than any other), free on the mask and passing `ok`. */
export function sprinkle(p: GroundPlace, all: GroundPlace[], n: number, mask: Mask, seed: number, ok: (q: Point) => boolean = () => true): Point[] {
  const rand = xorshift32(seed);
  const c = mid(p.box);
  const rx = p.box.w / 2 + 6;
  const ry = p.box.h / 2 + 6;
  const out: Point[] = [];
  for (let t = 0; t < n * 40 && out.length < n; t++) {
    const a = rand() * Math.PI * 2;
    const k = Math.sqrt(rand());
    const q = { x: +(c.x + Math.cos(a) * rx * k).toFixed(2), y: +(c.y + Math.sin(a) * ry * k).toFixed(2) };
    const d = Math.hypot(q.x - c.x, q.y - c.y);
    if (all.some((o) => o !== p && Math.hypot(q.x - mid(o.box).x, q.y - mid(o.box).y) < d)) continue;
    if (!ok(q) || !mask.free(q, 1.3)) continue;
    mask.mark(q, 1.5);
    out.push(q);
  }
  return out;
}

/** A union of rectangles: an outline layer (stroked) and a fill layer over it, so only the outer edge shows. */
export function union(rects: Rect[], pad: number, rx: number, line: Record<string, string | number>, fill: Record<string, string | number>): SVGElement[] {
  const rs = rects.map((r) => grow(r, pad));
  const shape = (r: Rect) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.w.toFixed(2), height: +r.h.toFixed(2), rx });
  return [
    el('g', { fill: 'none', ...line }, ...rs.map((r) => el('rect', shape(r)))),
    el('g', { stroke: 'none', ...fill }, ...rs.map((r) => el('rect', shape(r)))),
  ];
}

/** A grid of lines every `step` units (and a darker one every `major`), as a pattern over the sheet. */
export function gridPattern(id: string, W: number, H: number, step: number, major: number, color: string, faint: number, strong: number): SVGElement[] {
  const pat = el(
    'pattern',
    { id, width: major, height: major, patternUnits: 'userSpaceOnUse' },
    el('path', {
      d: Array.from({ length: major / step }, (_, k) => `M${k * step},0 V${major} M0,${k * step} H${major}`).join(' '),
      stroke: color,
      'stroke-width': 0.06,
      opacity: faint,
      fill: 'none',
    }),
    el('path', { d: `M0,0 V${major} M0,0 H${major}`, stroke: color, 'stroke-width': 0.12, opacity: strong, fill: 'none' }),
  );
  return [el('defs', {}, pat), el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, fill: `url(#${id})` })];
}

/** A place's group: its region's places, or itself alone. */
export function rooms(inp: GroundInput): GroundPlace[][] {
  const byId = new Map(inp.places.map((p) => [p.i, p]));
  const inRegion = new Set(inp.regions.flat());
  return [...inp.regions.map((r) => r.map((i) => byId.get(i)!).filter(Boolean)), ...inp.places.filter((p) => !inRegion.has(p.i)).map((p) => [p])];
}

export function maskOf(inp: GroundInput): Mask {
  const mask = new Mask(inp.W, inp.H);
  for (const p of inp.places) mask.rect(p.box, 0.8);
  for (const l of inp.lines) mask.line(l, 2);
  return mask;
}
