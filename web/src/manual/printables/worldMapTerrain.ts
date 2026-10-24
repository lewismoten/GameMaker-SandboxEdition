// The land the World Map (worldMap.ts) draws round its places: each scene's own colors turned
// into a kind of country (forest, water, sand, snow...) and a muted ink for the paper, wobbly
// coastlines, hand-drawn trails that bend between places, and where the little trees and
// hills go. Pure arithmetic on numbers and strings, deterministic, so every print is the same.
import type { Point } from '../../formats/game';
import { rng } from './kit';

export type Terrain = 'forest' | 'grass' | 'water' | 'sand' | 'rock' | 'snow' | 'ember' | 'night' | 'town';

/** A scene's look on the map: its land color, a darker ink for its lettering, and its country. */
export interface Look {
  fill: string;
  ink: string;
  terrain: Terrain;
}

export const PAPER = '#efe3c4';
export const INK = '#3a2c1c';

const hex = (n: number) => n.toString(16).padStart(2, '0');
const rgbHex = (r: number, g: number, b: number) => `#${hex(Math.round(r))}${hex(Math.round(g))}${hex(Math.round(b))}`;
const parse = (c: string): [number, number, number] => {
  const v = parseInt(c.replace('#', '').slice(0, 6), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/** `a` mixed toward `b` by `t` (0 = a, 1 = b), as #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const p = parse(a);
  const q = parse(b);
  return rgbHex(...([0, 1, 2].map((i) => p[i] + (q[i] - p[i]) * t) as [number, number, number]));
}

/** Hue (0-360), saturation and lightness (0-1) of an 0xRRGGBB color. */
export function hsl(rgb: number): [number, number, number] {
  const r = ((rgb >> 16) & 255) / 255;
  const g = ((rgb >> 8) & 255) / 255;
  const b = (rgb & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const hh = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}

/** The country a color suggests. */
export function terrainOf(rgb: number): Terrain {
  const [hue, s, l] = hsl(rgb);
  if (l < 0.13) return 'night';
  if (l > 0.82 && (s < 0.35 || l > 0.9)) return 'snow';
  if (s < 0.16) return l > 0.55 ? 'town' : 'rock';
  if (hue >= 75 && hue < 165) return l < 0.33 ? 'forest' : 'grass';
  if (hue >= 165 && hue < 255) return 'water';
  if (hue >= 255 && hue < 330) return 'night';
  if (hue >= 15 && hue < 75) return l > 0.5 ? 'sand' : 'rock';
  return s > 0.5 && l > 0.3 ? 'ember' : 'rock';
}

/**
 * A scene's look from the colors of its picture (0xRRGGBB -> pixel count): its commonest color
 * that isn't near black (unless black is nearly all there is), muted onto the paper.
 */
export function lookOf(counts: Map<number, number>): Look {
  const all = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  if (!all.length) return { fill: mix('#8fae6a', PAPER, 0.45), ink: mix('#8fae6a', INK, 0.6), terrain: 'grass' };
  const total = all.reduce((n, [, c]) => n + c, 0);
  const lit = all.filter(([c]) => hsl(c)[2] >= 0.13);
  const litShare = lit.reduce((n, [, c]) => n + c, 0) / total;
  const [main] = litShare > 0.15 && lit.length ? lit[0] : all[0];
  const c = `#${main.toString(16).padStart(6, '0')}`;
  const terrain = terrainOf(main);
  const fill = terrain === 'night' ? mix(c, '#5d5a7a', 0.5) : c;
  return { fill: mix(fill, PAPER, terrain === 'night' ? 0.35 : 0.5), ink: mix(fill, INK, 0.65), terrain };
}

const f = (n: number) => +n.toFixed(2);

/**
 * A closed wobbly outline round (`cx`, `cy`), about `rx` by `ry`: a coast or a border. `n`
 * points, each pushed in or out by up to `wobble` of the radius, joined by smooth curves.
 */
export function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number, n = 16, wobble = 0.16): string {
  const rand = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rand() * 2 - 1) * wobble;
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
  }
  // a closed Catmull-Rom curve through the points, as cubic Béziers
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
  }
  return `${d} Z`;
}

/** Where a line from the middle of a circle (`c`, radius `r`) toward `to` crosses its edge. */
export function circleEdge(c: Point, r: number, to: Point): Point {
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: c.x + (dx / len) * r, y: c.y + (dy / len) * r };
}

interface Trail {
  /** The SVG path: a gentle curve from one place's edge to the other's. */
  d: string;
  /** Its middle, and the direction it runs there (radians), for an arrowhead. */
  mid: Point;
  angle: number;
  /** Points along it, for keeping trees off the path. */
  samples: Point[];
}

/**
 * A hand-drawn trail between places at `a` and `b` (each a circle of radius `r`): a curve that
 * bends to one side by a share of its length (the side and amount from `seed`), from edge to edge.
 */
export function trailBetween(a: Point, b: Point, r: number, seed: number): Trail {
  const rand = rng(seed);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const bend = (rand() < 0.5 ? -1 : 1) * (0.1 + rand() * 0.12) * len;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const ctl = { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
  const p = circleEdge(a, r, ctl);
  const q = circleEdge(b, r, ctl);
  const at = (t: number): Point => ({
    x: (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * ctl.x + t * t * q.x,
    y: (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * ctl.y + t * t * q.y,
  });
  const mid = at(0.5);
  const angle = Math.atan2(q.y - p.y, q.x - p.x);
  const samples = Array.from({ length: 13 }, (_, i) => at(i / 12));
  return { d: `M${f(p.x)},${f(p.y)} Q${f(ctl.x)},${f(ctl.y)} ${f(q.x)},${f(q.y)}`, mid, angle, samples };
}

/**
 * Up to `n` spots for little drawings (trees, hills) round `c` within an ellipse `rx` x `ry`,
 * each at least `gap` from the others and from every point of `avoid` (by its radius), and
 * nearer `c` than any of `others` (so each country keeps its own).
 */
export function scatter(c: Point, rx: number, ry: number, n: number, seed: number, avoid: { p: Point; r: number }[], others: Point[], gap = 2.6): Point[] {
  const rand = rng(seed);
  const out: Point[] = [];
  for (let tries = 0; tries < n * 30 && out.length < n; tries++) {
    const a = rand() * Math.PI * 2;
    const k = Math.sqrt(rand()) * 0.92;
    const p = { x: c.x + Math.cos(a) * rx * k, y: c.y + Math.sin(a) * ry * k };
    const d0 = Math.hypot(p.x - c.x, p.y - c.y);
    if (others.some((o) => Math.hypot(p.x - o.x, p.y - o.y) < d0)) continue;
    if (avoid.some((v) => Math.hypot(p.x - v.p.x, p.y - v.p.y) < v.r)) continue;
    if (out.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < gap)) continue;
    out.push({ x: f(p.x), y: f(p.y) });
  }
  return out;
}

/** Scenes that share a map and are linked to one another: one region, named for its first scene. */
export function regions(maps: (string | undefined)[], pairs: [number, number][]): number[][] {
  const parent = new Map<number, number>();
  const find = (i: number): number => {
    let r = i;
    while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  maps.forEach((m, i) => m && parent.set(i, i));
  for (const [a, b] of pairs) {
    if (!maps[a] || maps[a] !== maps[b]) continue;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  }
  const groups = new Map<number, number[]>();
  for (const i of [...parent.keys()].sort((a, b) => a - b)) {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), i]);
  }
  return [...groups.values()];
}
