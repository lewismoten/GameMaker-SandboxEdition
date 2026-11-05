// ROAD TILES' art: how the road pieces are drawn. Each piece is a 20x20 block. A piece is drawn on a 3x3 canvas of its
// ground (grass, sand or water) with its road laid as legs (lines and arcs, 13 pixels wide) that run on past the block's
// edges, then the middle block is cut out. Because the legs go on into the next blocks, a block beside a diagonal gets the
// corner triangle of road that spills into it, and every join lines up. A piece is drawn once; the others are the same
// block flipped or turned (what the block editor's Flip and Rotate buttons do).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

export const N = 20;
type Pt = [number, number];

/** A run of the road, in block pixels (0 to 20 is the block itself). `dash` puts a yellow center line on it. */
export interface Leg {
  pts: Pt[];
  dash?: boolean;
}

/** Half the road's width. The road is 13 pixels wide, a pixel of curb each side, leaving grass beside it. */
const HW = 6.5;

/** A straight run from `a` to `b`. */
export const run = (a: Pt, b: Pt, dash = false): Leg => ({ pts: [a, b], dash });

/** A quarter circle of road of radius 10 round the block's corner (cx, cy), from angle `from` to `to` (degrees). */
export function arc(cx: number, cy: number, from: number, to: number): Leg {
  const pts: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = ((from + ((to - from) * i) / 16) * Math.PI) / 180;
    pts.push([cx + 10 * Math.cos(a), cy + 10 * Math.sin(a)]);
  }
  return { pts, dash: true };
}

/** The distance from (x, y) to the polyline. */
function distance(x: number, y: number, pts: Pt[]): number {
  let best = 1e9;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

/** Where along `pts` (a distance from its start) the point is, and its length. */
function along(pts: Pt[], at: number): Pt {
  let left = at;
  for (let i = 0; i + 1 < pts.length; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (left <= len) return [pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * left) / len, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * left) / len];
    left -= len;
  }
  return pts[pts.length - 1];
}
const lengthOf = (pts: Pt[]): number => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** The grounds the roads lie on, as 20x20 blocks. `sw` and `gs` are the blend blocks where two grounds meet. */
export interface Grounds {
  grass: Pixels;
  sand: Pixels;
  water: Pixels;
  /** Grass on the left running into sand on the right. */
  gs: Pixels;
  /** Sand on the left running into water on the right. */
  sw: Pixels;
}

export function buildGrounds(pal: Pal): Grounds {
  const { c, r } = pal;
  const g = r('grass');
  const grass = new Pixels(N, N, g[2]);
  const rand = rng(77);
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rand() * 19);
    const y = Math.floor(rand() * 18);
    grass.set(x, y + 1, g[1]).set(x, y, i % 3 ? g[3] : g[4]);
  }
  const pa = r('parch');
  const sand = new Pixels(N, N, pa[3]);
  const rs = rng(31);
  for (let i = 0; i < 26; i++) sand.set(Math.floor(rs() * N), Math.floor(rs() * N), i % 3 ? pa[2] : pa[4]);
  const bl = r('blue');
  const sk = r('sky');
  const water = new Pixels(N, N, bl[2]);
  for (const [x, y] of [
    [2, 3],
    [11, 7],
    [5, 12],
    [14, 16],
  ] as const)
    water.rect(x, y, 5, 1, sk[3]).rect(x + 1, y + 1, 3, 1, bl[3]);
  for (const [x, y] of [
    [14, 2],
    [1, 8],
    [10, 13],
  ] as const)
    water.rect(x, y, 3, 1, bl[3]);
  // a ragged border: the line sways five rows each way, so the ground beside it is never a ruler's edge
  const sway = [0, 1, 2, 2, 1, 0, -1, -2, -2, -1];
  const border = (y: number) => 10 + sway[y % 10];
  const gs = new Pixels(N, N).map((x, y) => {
    const b = border(y);
    const mixed = x >= b - 2 && x < b + 2 && (x + y) % 2 === 0;
    return x < b !== mixed ? grass.get(x, y) : sand.get(x, y);
  });
  const sw = new Pixels(N, N).map((x, y) => {
    const b = border(y);
    if (x >= b) return x - b < 2 && (y + x) % 3 !== 0 ? c('white', 3) : water.get(x, y);
    return x >= b - 3 ? pa[1 + ((x + y) % 2)] : sand.get(x, y);
  });
  return { grass, sand, water, gs, sw };
}

/** A 3x3 canvas: `left`, `mid`, `right` blocks across, each repeated down. */
export function strip(left: Pixels, mid: Pixels, right: Pixels): Pixels {
  const p = new Pixels(3 * N, 3 * N);
  [left, mid, right].forEach((b, i) => {
    for (let j = 0; j < 3; j++) p.blit(b, i * N, j * N);
  });
  return p;
}

/**
 * Lays `legs` over a canvas of ground (3x3 blocks) and cuts out the block at (cx, cy) (the middle by default). `deck` draws
 * planks and rails over the ground (a bridge) instead of asphalt; `across` is the way its planks lie.
 */
export function laid(pal: Pal, ground: Pixels, legs: Leg[], opts: { deck?: boolean; cx?: number; cy?: number } = {}): Pixels {
  const { c, r } = pal;
  const canvas = ground.crop(0, 0, ground.w, ground.h);
  const moved = legs.map((l) => ({ ...l, pts: l.pts.map(([x, y]): Pt => [x + N, y + N]) }));
  const st = r('stone');
  const wo = r('wood');
  const rand = rng(5);
  canvas.map((x, y, was) => {
    const d = Math.min(...moved.map((l) => distance(x + 0.5, y + 0.5, l.pts)));
    if (d > HW + 1) return was;
    if (d > HW) return opts.deck ? wo[0] : c('ink', 0);
    if (opts.deck) {
      if (d > HW - 1.6) return d > HW - 0.8 ? wo[1] : wo[4];
      return x % 5 === 0 ? wo[1] : (x + y * 7) % 11 === 0 ? wo[2] : wo[3];
    }
    if (d > HW - 1.2) return st[3];
    return rand() < 0.07 ? st[1] : rand() < 0.05 ? st[3] : st[2];
  });
  // the yellow center line: dashes four pixels long, as many as fit and spread evenly along the leg
  for (const l of moved) {
    if (!l.dash) continue;
    const len = lengthOf(l.pts);
    const n = Math.max(1, Math.round(len / 10));
    for (let k = 0; k < n; k++)
      for (let t = ((k + 0.5) / n) * len - 2; t <= ((k + 0.5) / n) * len + 2; t += 0.5) {
        const [x, y] = along(l.pts, t);
        canvas.disc(x, y, 1.1, opts.deck ? wo[0] : c('gold', 3));
      }
  }
  return canvas.crop((opts.cx ?? 1) * N, (opts.cy ?? 1) * N, N, N);
}

/** The quarter turns and flips the block editor has as buttons (Flip left to right, Flip top to bottom, Rotate). */
export const flipX = (p: Pixels): Pixels => new Pixels(p.w, p.h).map((x, y) => p.get(p.w - 1 - x, y));
export const flipY = (p: Pixels): Pixels => new Pixels(p.w, p.h).map((x, y) => p.get(x, p.h - 1 - y));
export const turn = (p: Pixels): Pixels => new Pixels(p.w, p.h).map((x, y) => p.get(y, p.h - 1 - x));
