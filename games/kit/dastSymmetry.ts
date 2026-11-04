// A search for swastika-like shapes in a picture (the DAST tool's automatic check, dast.ts).
// A swastika is chiral with four-fold rotational symmetry: one connected shape whose quarter turn about
// its own center lands on itself, whose mirror images (across the center's vertical, horizontal and two
// diagonal lines) do not, with four arms ending in four tips. Plus signs, squares and X marks are
// mirror symmetric, so they pass by. Pinwheels, propellers and some fret patterns are chiral too, so
// they are reported; a finding is a suggestion for a person to look at, never a verdict.
// The mask tried is every color on its own, and the dark and the light halves of the region.
import type { Pix } from './dastImage';

export interface Hit {
  /** Bounding box in the region. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The mask's color (0xRRGGBB), or -1 for the dark half and -2 for the light half. */
  mask: number;
  /** Quarter-turn match and the best mirror match, 0 to 1. */
  rot: number;
  mirror: number;
}

const ROT_MIN = 0.9;
const ROT_EXACT_MIN = 0.7;
const CONTRAST_MIN = 45; // brightness levels of 255
const MIRROR_MAX = 0.72; // a drawn swastika scores about 0.64 at any size

function lum(c: number): number {
  return 0.299 * (c >> 16) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);
}

/** The share of `pts` (relative to the center) that a transform lands on `set` or beside it (one pixel of slack for the quarter turn, none for the mirrors). */
function match(pts: [number, number][], set: Set<number>, cx: number, cy: number, f: (dx: number, dy: number) => [number, number], slack = true): number {
  let hit = 0;
  for (const [x, y] of pts) {
    const [tx, ty] = f(x + 0.5 - cx, y + 0.5 - cy);
    const px = Math.floor(cx + tx);
    const py = Math.floor(cy + ty);
    let ok = false;
    for (let j = -1; j <= 1 && !ok; j++)
      for (let i = -1; i <= 1 && !ok; i++) if ((slack ? i === 0 || j === 0 : i === 0 && j === 0) && set.has((py + j) * 4096 + px + i)) ok = true;
    if (ok) hit++;
  }
  return hit / pts.length;
}

/** The tips test: the pixels far from the center fall into four to eight separate angles. */
function tips(pts: [number, number][], cx: number, cy: number): number {
  let rmax = 0;
  for (const [x, y] of pts) rmax = Math.max(rmax, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
  const bins = new Array<boolean>(48).fill(false);
  for (const [x, y] of pts) {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    if (Math.hypot(dx, dy) >= 0.8 * rmax) bins[Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 48) % 48] = true;
  }
  let arcs = 0;
  for (let i = 0; i < 48; i++) if (bins[i] && !bins[(i + 47) % 48]) arcs++;
  return arcs;
}

/** The shape must stand out: its pixels and the ring of pixels around it differ in brightness. */
function stands(pts: [number, number][], set: Set<number>, p: Pix): boolean {
  let inL = 0;
  let outL = 0;
  let outN = 0;
  const ring = new Set<number>();
  for (const [x, y] of pts) {
    inL += lum(p.px[y * p.w + x]);
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= p.w || ny >= p.h || set.has(ny * 4096 + nx) || ring.has(ny * 4096 + nx)) continue;
      ring.add(ny * 4096 + nx);
      outL += lum(p.px[ny * p.w + nx]);
      outN++;
    }
  }
  return outN === 0 || Math.abs(inL / pts.length - outL / outN) >= CONTRAST_MIN;
}

function test(pts: [number, number][], p: Pix, mask: number, allowEdge: boolean): Hit | undefined {
  const [w, h] = [p.w, p.h];
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1;
  let y1 = -1;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
    sx += x + 0.5;
    sy += y + 0.5;
  }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  if (bw < 7 || bh < 7 || bw / bh > 1.4 || bh / bw > 1.4) return undefined;
  if (!allowEdge && (x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1)) return undefined;
  // a shape that touches three or four sides is the picture's own background, not a mark on it
  if ([x0 === 0, y0 === 0, x1 === w - 1, y1 === h - 1].filter(Boolean).length >= 3) return undefined;
  const fill = pts.length / (bw * bh);
  if (fill < 0.2 || fill > 0.6) return undefined;
  // arms are thin: a blob has most of its pixels inside, with all four neighbors in the shape
  const inside = new Set(pts.map(([x, y]) => y * 4096 + x));
  let interior = 0;
  for (const [x, y] of pts)
    if (inside.has(y * 4096 + x - 1) && inside.has(y * 4096 + x + 1) && inside.has((y - 1) * 4096 + x) && inside.has((y + 1) * 4096 + x)) interior++;
  if (interior / pts.length > 0.4) return undefined;
  const cx = sx / pts.length;
  const cy = sy / pts.length;
  const set = new Set(pts.map(([x, y]) => y * 4096 + x));
  // speckled noise matches with a pixel of slack, a drawn shape also matches exactly: try that first, it is cheapest
  if (match(pts, set, cx, cy, (x, y) => [-y, x], false) < ROT_EXACT_MIN) return undefined;
  const rot = Math.min(
    match(pts, set, cx, cy, (x, y) => [-y, x]),
    match(pts, set, cx, cy, (x, y) => [y, -x]),
  );
  if (rot < ROT_MIN) return undefined;
  const mirror = Math.max(
    match(pts, set, cx, cy, (x, y) => [-x, y], false),
    match(pts, set, cx, cy, (x, y) => [x, -y], false),
    match(pts, set, cx, cy, (x, y) => [y, x], false),
    match(pts, set, cx, cy, (x, y) => [-y, -x], false),
  );
  if (process.env.DAST_DEBUG) console.log('mirror', mirror);
  if (mirror > MIRROR_MAX) return undefined;
  if (!stands(pts, set, p)) return undefined;
  const t = tips(pts, cx, cy);
  if (t < 4 || t > 8) return undefined;
  return { x: x0, y: y0, w: bw, h: bh, mask, rot, mirror };
}

/** Swastika-like shapes in a picture. `allowEdge`: a shape may touch the picture's border (one block on its own). */
export function findSwastikaLike(p: Pix, allowEdge = false): Hit[] {
  const n = p.px.length;
  const first = p.px[0];
  if (p.px.every((c) => c === first)) return [];
  // Otsu's threshold on luminance splits the picture into a dark and a light half
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < n; i++) hist[Math.min(255, Math.round(lum(p.px[i])))]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let wb = 0;
  let sb = 0;
  let best = 0;
  let mid = 128;
  for (let t = 0; t < 256; t++) {
    wb += hist[t];
    if (!wb || wb === n) continue;
    sb += t * hist[t];
    const d = sb / wb - (sum - sb) / (n - wb);
    if (wb * (n - wb) * d * d > best) ((best = wb * (n - wb) * d * d), (mid = t));
  }
  const side = Uint8Array.from(p.px, (c) => (lum(c) <= mid ? 1 : 0));
  const hits: Hit[] = [];
  const stack = new Int32Array(n);
  const comp = new Int32Array(n);
  // two labelings: connected pixels of one color, then connected pixels of one half
  for (const byColor of [true, false]) {
    const key: ArrayLike<number> = byColor ? p.px : side;
    const seen = new Uint8Array(n);
    for (let s = 0; s < n; s++) {
      if (seen[s]) continue;
      const v = key[s];
      let top = 0;
      let size = 0;
      let [x0, y0, x1, y1] = [p.w, p.h, -1, -1];
      stack[top++] = s;
      seen[s] = 1;
      while (top) {
        const i = stack[--top];
        comp[size++] = i;
        const x = i % p.w;
        const y = (i - x) / p.w;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= p.h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= p.w) continue;
            const j = ny * p.w + nx;
            if (!seen[j] && key[j] === v) ((seen[j] = 1), (stack[top++] = j));
          }
        }
      }
      // cheap rejections first: too small or large, or not roughly square
      if (size < 12 || size > 1500 || x1 - x0 < 6 || y1 - y0 < 6) continue;
      const pts: [number, number][] = [];
      for (let k = 0; k < size; k++) pts.push([comp[k] % p.w, Math.floor(comp[k] / p.w)]);
      const hit = test(pts, p, byColor ? v : v === 1 ? -1 : -2, allowEdge);
      if (hit) hits.push(hit);
    }
  }
  return hits;
}
