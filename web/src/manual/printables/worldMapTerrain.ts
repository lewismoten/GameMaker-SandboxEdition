// The land the World Map (worldMap.ts) draws round its places: each scene's own colors turned
// into a kind of country (forest, water, sand, snow...) and a muted ink for the paper, and
// wobbly coastlines. Pure arithmetic on numbers and strings, deterministic, so every print is
// the same.
import type { Point } from '../../formats/game';
import { xorshift32 } from '../../seededRandom';

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
  const rand = xorshift32(seed);
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
