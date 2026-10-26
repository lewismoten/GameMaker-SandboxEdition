// The outlines of stickers, in inches: the cut line and the same line grown or shrunk (the bleed
// past it, the keyline inside it, the gap kept around it on the sheet). Plain shapes are
// polygons offset edge by edge; a die-cut follows its art at a set distance, traced from a
// distance field round the art's solid pixels, its inner corners rounded and narrow gaps filled
// so the blade follows one smooth shape. The sheet rules (sizes, bleed, spacing) are in the
// printables README.

export type StickerShape = 'circle' | 'rect' | 'star' | 'badge' | 'heart' | 'burst' | 'bubble' | 'floppy' | 'tv' | 'cut';
export type Pt = [number, number];

/** The solid parts of a die-cut's art, as cells `cell` inches square, placed at (CUT_OFFSET, CUT_OFFSET). */
export interface Solid {
  cols: number;
  rows: number;
  cell: number;
  bits: Uint8Array;
}

/** A sticker's size and shape before it is placed: its cut line fills [0, w] x [0, h]. */
export interface StickerGeom {
  w: number;
  h: number;
  shape: StickerShape;
  solid?: Solid;
}

/** How far a die-cut's cut line runs outside its art: its border, 1/8 inch as Cricut's offset tool is usually set. */
export const CUT_OFFSET = 0.125;
/** The least radius of a die-cut's inner corners; gaps narrower than about twice this plus the border are filled. */
const CUT_ROUND = 0.1;
/** Every sticker is at least this many inches across at its narrowest, so it is easy to cut and peel. */
export const MIN_SIZE = 1;

/** A die-cut's size around its solid art. */
export function cutGeom(solid: Solid): StickerGeom {
  return { w: solid.cols * solid.cell + 2 * CUT_OFFSET, h: solid.rows * solid.cell + 2 * CUT_OFFSET, shape: 'cut', solid };
}

const TAU = Math.PI * 2;

function arc(out: Pt[], cx: number, cy: number, r: number, a0: number, a1: number, n: number): void {
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
}

function roundRect(x: number, y: number, w: number, h: number, r: number): Pt[] {
  r = Math.max(0.001, Math.min(r, w / 2, h / 2));
  const out: Pt[] = [];
  arc(out, x + w - r, y + r, r, -Math.PI / 2, 0, 6);
  arc(out, x + w - r, y + h - r, r, 0, Math.PI / 2, 6);
  arc(out, x + r, y + h - r, r, Math.PI / 2, Math.PI, 6);
  arc(out, x + r, y + r, r, Math.PI, Math.PI * 1.5, 6);
  return out;
}

/**
 * A heart: two round lobes and a point, grown by `grow` exactly (bigger lobes, the point pushed
 * out along its axis), so the notch between the lobes never folds over itself.
 */
function heart(w: number, h: number, grow: number): Pt[] {
  const r0 = w * 0.28;
  const ly = r0;
  const lobes = [w * 0.28, w * 0.72];
  // the point's half angle (between its axis and either side), from the ungrown heart
  const alpha = Math.atan2(w / 2 - lobes[0], h - ly) + Math.asin(r0 / Math.hypot(w / 2 - lobes[0], h - ly));
  const r = r0 + grow;
  const tip: Pt = [w / 2, h + grow / Math.sin(Math.min(alpha, Math.PI / 2 - 1e-6))];
  const notch = Math.acos(Math.min(1, (w / 2 - lobes[0]) / r));
  const tangent = (x: number, side: number) => {
    const phi = Math.atan2(tip[1] - ly, tip[0] - x);
    return phi + side * Math.acos(r / Math.hypot(tip[0] - x, tip[1] - ly));
  };
  const out: Pt[] = [tip];
  arc(out, lobes[0], ly, r, tangent(lobes[0], 1), TAU - notch, 30);
  arc(out, lobes[1], ly, r, Math.PI + notch, TAU + tangent(lobes[1], -1), 30);
  return out;
}

/** The cut line of a plain shape, clockwise on the page (y down), in [0, w] x [0, h]. */
function basePolygon(shape: StickerShape, w: number, h: number): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  switch (shape) {
    case 'circle': {
      const out: Pt[] = [];
      for (let i = 0; i < 96; i++) out.push([cx + (w / 2) * Math.cos((TAU * i) / 96), cy + (h / 2) * Math.sin((TAU * i) / 96)]);
      return out;
    }
    case 'star': {
      // a seal: shallow points a blade can follow
      const out: Pt[] = [];
      const n = 14;
      for (let i = 0; i < n * 2; i++) {
        const a = (Math.PI * i) / n - Math.PI / 2;
        const k = i % 2 ? 1 - Math.min(0.16, (w / 2) * 0.16) / (w / 2) : 1;
        out.push([cx + (w / 2) * k * Math.cos(a), cy + (h / 2) * k * Math.sin(a)]);
      }
      return out;
    }
    case 'burst': {
      // a comic-book bang: eleven uneven points
      const R = [1, 0.86, 0.97, 0.9, 1, 0.84, 0.95, 0.88, 1, 0.9, 0.93];
      const out: Pt[] = [];
      const n = R.length;
      for (let i = 0; i < n * 2; i++) {
        const a = (Math.PI * i) / n - Math.PI / 2 + 0.12;
        const k = i % 2 ? 0.74 : R[i / 2];
        out.push([cx + (w / 2) * k * Math.cos(a), cy + (h / 2) * k * Math.sin(a)]);
      }
      return out;
    }
    case 'heart':
      return heart(w, h, 0);
    case 'bubble': {
      // a speech balloon, its tail down at the left
      const bh = h * 0.8;
      const r = Math.min(0.28, bh / 2);
      const out: Pt[] = [];
      arc(out, w - r, r, r, -Math.PI / 2, 0, 6);
      arc(out, w - r, bh - r, r, 0, Math.PI / 2, 6);
      out.push([w * 0.5, bh], [w * 0.14, h], [w * 0.28, bh]);
      arc(out, r, bh - r, r, Math.PI / 2, Math.PI, 6);
      arc(out, r, r, r, Math.PI, Math.PI * 1.5, 6);
      return out;
    }
    case 'floppy': {
      // a 3½" disk seen from its label side, shutter down: square, round corners, and the
      // corner cut at the bottom left (it is at the top right with the shutter up)
      const r = 0.06;
      const c = Math.min(w, h) * 0.1;
      const out: Pt[] = [];
      arc(out, w - r, r, r, -Math.PI / 2, 0, 4);
      arc(out, w - r, h - r, r, 0, Math.PI / 2, 4);
      out.push([c, h], [0, h - c]);
      arc(out, r, r, r, Math.PI, Math.PI * 1.5, 4);
      return out;
    }
    case 'tv': {
      // a little TV set on two feet
      const bh = h * 0.9;
      const out = roundRect(0, 0, w, bh, 0.2);
      const at = out.findIndex(([x, y]) => y >= bh - 1e-9 && x < w / 2);
      out.splice(at, 0, [w * 0.8, bh], [w * 0.78, h], [w * 0.64, h], [w * 0.62, bh], [w * 0.38, bh], [w * 0.36, h], [w * 0.22, h], [w * 0.2, bh]);
      return out;
    }
    case 'badge':
      return roundRect(0, 0, w, h, 0.32);
    default:
      return roundRect(0, 0, w, h, 0.14);
  }
}

function signedArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

/** A polygon moved `d` outward along its edges (mitered corners, capped at 4d), or inward for d < 0. */
function offsetPolygon(pts: Pt[], d: number): Pt[] {
  if (!d) return pts;
  // outward is to the left of each edge of a clockwise polygon on the page (y down); flip for the other way round
  const s = signedArea(pts) > 0 ? 1 : -1;
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const n1 = normal(p0, p1, s);
    const n2 = normal(p1, p2, s);
    const bx = n1[0] + n2[0];
    const by = n1[1] + n2[1];
    const bl = Math.hypot(bx, by);
    if (bl < 1e-9) {
      out.push([p1[0] + n1[0] * d, p1[1] + n1[1] * d]);
      continue;
    }
    // the miter: along the bisector, far enough that both edges move d
    const cos = (n1[0] * bx + n1[1] * by) / bl;
    const e1: Pt = [-n1[1] * s, n1[0] * s];
    const e2: Pt = [-n2[1] * s, n2[0] * s];
    if (cos < 0.5 && (n1[0] * e2[0] + n1[1] * e2[1]) * d < 0) {
      // a sharp point on the side that grows: square it off a distance d past the point instead
      out.push([p1[0] + (n1[0] + e1[0]) * d, p1[1] + (n1[1] + e1[1]) * d], [p1[0] + (n2[0] - e2[0]) * d, p1[1] + (n2[1] - e2[1]) * d]);
      continue;
    }
    const len = Math.min(Math.abs(d) / Math.max(cos, 0.25), Math.abs(d) * 4) * Math.sign(d);
    out.push([p1[0] + (bx / bl) * len, p1[1] + (by / bl) * len]);
  }
  return out;
}

function normal(a: Pt, b: Pt, s: number): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [(s * dy) / l, (-s * dx) / l];
}

// ------------------------------------------------------------------ die-cuts

interface Field {
  cols: number;
  rows: number;
  res: number;
  /** a distance in inches at each sample; sample (i, j) sits at (i, j) * res - pad */
  d: Float32Array;
  pad: number;
}

const FIELD_RES = 0.01;
/** Room round the art for the border, the widest corner rounding and the bleed. */
const FIELD_PAD = CUT_OFFSET + 0.6;
/** Corner roundings tried in turn, until the cut is one piece round all of the art. */
const ROUNDS = [CUT_ROUND, 0.2, 0.3, 0.45];
const fields = new WeakMap<Solid, Field>();
const cutFields = new WeakMap<Solid, Field>();

/** 1-D squared distance transform (Felzenszwalb and Huttenlocher). */
function edt1(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) ** 2 + f[v[k]];
  }
}

/** Distance in samples from every sample of a cols x rows grid to the nearest one marked in `on`. */
function edt(on: Uint8Array, cols: number, rows: number): Float32Array {
  const g = new Float64Array(cols * rows);
  for (let k = 0; k < g.length; k++) g[k] = on[k] ? 0 : 1e12;
  const n = Math.max(cols, rows);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) f[j] = g[j * cols + i];
    edt1(f, rows, d, v, z);
    for (let j = 0; j < rows; j++) g[j * cols + i] = d[j];
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) f[i] = g[j * cols + i];
    edt1(f, cols, d, v, z);
    for (let i = 0; i < cols; i++) g[j * cols + i] = d[i];
  }
  const out = new Float32Array(cols * rows);
  for (let k = 0; k < out.length; k++) out[k] = Math.sqrt(g[k]);
  return out;
}

/** Distance from each sample to the art's nearest solid cell, in inches. */
function fieldOf(solid: Solid): Field {
  const hit = fields.get(solid);
  if (hit) return hit;
  const res = FIELD_RES;
  const pad = FIELD_PAD;
  const cols = Math.ceil((solid.cols * solid.cell + 2 * pad) / res) + 1;
  const rows = Math.ceil((solid.rows * solid.cell + 2 * pad) / res) + 1;
  const on = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const cx = Math.floor((i * res - pad) / solid.cell);
      const cy = Math.floor((j * res - pad) / solid.cell);
      if (cx >= 0 && cy >= 0 && cx < solid.cols && cy < solid.rows && solid.bits[cy * solid.cols + cx]) on[j * cols + i] = 1;
    }
  const d = edt(on, cols, rows);
  for (let k = 0; k < d.length; k++) d[k] *= res;
  const field = { cols, rows, res, d, pad };
  fields.set(solid, field);
  return field;
}

/** How many separate pieces the marked samples make (4-connected). */
function pieces(on: Uint8Array, cols: number): number {
  const seen = new Uint8Array(on.length);
  const stack: number[] = [];
  let n = 0;
  for (let k = 0; k < on.length; k++) {
    if (!on[k] || seen[k]) continue;
    n++;
    seen[k] = 1;
    stack.push(k);
    while (stack.length) {
      const c = stack.pop()!;
      const i = c % cols;
      for (const m of [i > 0 ? c - 1 : -1, i < cols - 1 ? c + 1 : -1, c - cols, c + cols])
        if (m >= 0 && m < on.length && on[m] && !seen[m]) ((seen[m] = 1), stack.push(m));
    }
  }
  return n;
}

/**
 * The die-cut's shape as a signed distance in inches (negative inside): the art grown by the
 * border, then closed (grown by a rounding and shrunk back), which rounds every inner corner and
 * fills narrow gaps between arms, legs and words. If the art's parts are still apart, a wider
 * rounding bridges them, so the sticker is always one piece.
 */
function cutFieldOf(solid: Solid): Field {
  const hit = cutFields.get(solid);
  if (hit) return hit;
  const art = fieldOf(solid);
  const { cols, rows, res } = art;
  const n = cols * rows;
  let shape = new Uint8Array(n);
  for (const r of ROUNDS) {
    const grown = new Uint8Array(n);
    for (let k = 0; k < n; k++) grown[k] = art.d[k] < CUT_OFFSET + r ? 0 : 1; // marks the outside
    const toOutside = edt(grown, cols, rows);
    shape = new Uint8Array(n);
    for (let k = 0; k < n; k++) shape[k] = toOutside[k] * res >= r ? 1 : 0;
    if (pieces(shape, cols) <= 1) break;
  }
  const outside = new Uint8Array(n);
  for (let k = 0; k < n; k++) outside[k] = shape[k] ? 0 : 1;
  const toShape = edt(shape, cols, rows);
  const toOut = edt(outside, cols, rows);
  const d = new Float32Array(n);
  // a sample's distance to the boundary, less half a sample so inside and outside meet on it
  for (let k = 0; k < n; k++) d[k] = (shape[k] ? -(toOut[k] - 0.5) : toShape[k] - 0.5) * res;
  const field = { cols, rows, res, d, pad: art.pad };
  cutFields.set(solid, field);
  return field;
}

/** Every closed line where the field equals `level` (marching squares), in field-sample units. */
function rings(fd: Field, level: number): Pt[][] {
  const { cols, rows, d } = fd;
  const at = (i: number, j: number) => d[j * cols + i];
  // edges keyed by cell edge id; each segment joins two edge points
  const pointOf = new Map<number, Pt>();
  const next = new Map<number, number[]>();
  const edgePt = (i: number, j: number, horiz: boolean): number => {
    const id = ((j * cols + i) << 1) | (horiz ? 1 : 0);
    if (!pointOf.has(id)) {
      const a = at(i, j);
      const b = horiz ? at(i + 1, j) : at(i, j + 1);
      const t = (level - a) / (b - a);
      pointOf.set(id, horiz ? [i + t, j] : [i, j + t]);
    }
    return id;
  };
  const link = (a: number, b: number) => {
    (next.get(a) ?? next.set(a, []).get(a)!).push(b);
    (next.get(b) ?? next.set(b, []).get(b)!).push(a);
  };
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const v0 = at(i, j) < level ? 1 : 0;
      const v1 = at(i + 1, j) < level ? 1 : 0;
      const v2 = at(i + 1, j + 1) < level ? 1 : 0;
      const v3 = at(i, j + 1) < level ? 1 : 0;
      const code = v0 | (v1 << 1) | (v2 << 2) | (v3 << 3);
      if (code === 0 || code === 15) continue;
      const top = () => edgePt(i, j, true);
      const right = () => edgePt(i + 1, j, false);
      const bottom = () => edgePt(i, j + 1, true);
      const left = () => edgePt(i, j, false);
      switch (code) {
        case 1:
        case 14:
          link(left(), top());
          break;
        case 2:
        case 13:
          link(top(), right());
          break;
        case 3:
        case 12:
          link(left(), right());
          break;
        case 4:
        case 11:
          link(right(), bottom());
          break;
        case 6:
        case 9:
          link(top(), bottom());
          break;
        case 7:
        case 8:
          link(left(), bottom());
          break;
        case 5:
          link(left(), top());
          link(right(), bottom());
          break;
        case 10:
          link(top(), right());
          link(left(), bottom());
          break;
      }
    }
  // walk the rings
  const seen = new Set<number>();
  const out: Pt[][] = [];
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const ring: Pt[] = [];
    let prev = -1;
    let cur = start;
    while (!seen.has(cur)) {
      seen.add(cur);
      ring.push(pointOf.get(cur)!);
      const nb = next.get(cur)!.find((x) => x !== prev && !seen.has(x)) ?? -1;
      if (nb < 0) break;
      prev = cur;
      cur = nb;
    }
    if (ring.length > 2) out.push(ring);
  }
  return out;
}

/** The biggest ring where the field equals `level`. */
function contour(fd: Field, level: number): Pt[] {
  let best: Pt[] = [];
  let bestArea = 0;
  for (const ring of rings(fd, level)) {
    const a = Math.abs(signedArea(ring));
    if (a > bestArea) ((bestArea = a), (best = ring));
  }
  return best;
}

/** Fewer points along nearly straight runs (Ramer-Douglas-Peucker on a closed ring). */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 8) return pts;
  const keep = new Uint8Array(pts.length);
  const rdp = (a: number, b: number) => {
    let far = -1;
    let fd = eps;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const l = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const dd = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / l;
      if (dd > fd) ((fd = dd), (far = i));
    }
    if (far >= 0) {
      keep[far] = 1;
      rdp(a, far);
      rdp(far, b);
    }
  };
  const mid = pts.length >> 1;
  keep[0] = keep[mid] = 1;
  rdp(0, mid);
  rdp(mid, pts.length - 1);
  keep[pts.length - 1] = 1;
  return pts.filter((_, i) => keep[i]);
}

/** One round of corner cutting (Chaikin) on a closed ring: each corner becomes a short bevel, so a few rounds make a smooth curve. */
function chaikin(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    out.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
  }
  return out;
}

const cutCache = new WeakMap<Solid, Map<number, Pt[]>>();

/** Field samples to inches, in the die-cut's own coordinates. */
const toInches = (fd: Field, pts: Pt[]): Pt[] => pts.map(([i, j]): Pt => [i * fd.res - fd.pad + CUT_OFFSET, j * fd.res - fd.pad + CUT_OFFSET]);

function dieCut(solid: Solid, grow: number): Pt[] {
  let m = cutCache.get(solid);
  if (!m) cutCache.set(solid, (m = new Map()));
  const key = Math.round(grow * 1e4);
  const hit = m.get(key);
  if (hit) return hit;
  const fd = cutFieldOf(solid);
  const level = Math.min(grow, FIELD_PAD - CUT_OFFSET - 2 * FIELD_RES);
  // the closed shape is traced from whole samples, so its line steps; straighten the steps, then round the corners
  const ring = toInches(fd, chaikin(chaikin(simplify(contour(fd, level), 0.75))));
  m.set(key, ring);
  return ring;
}

/** The lines `d` inches round a die-cut's art (every part of it, holes too: fill them even-odd). */
export function artHalo(g: StickerGeom, d: number): Pt[][] {
  if (!g.solid) return [];
  const fd = fieldOf(g.solid);
  return rings(fd, Math.max(d, FIELD_RES * 0.6)).map((r) => toInches(fd, simplify(r, 0.0025 / FIELD_RES)));
}

/** The sticker's cut line grown by `grow` inches (negative shrinks), in its own coordinates. */
export function outline(g: StickerGeom, grow = 0): Pt[] {
  if (g.shape === 'cut' && g.solid) return dieCut(g.solid, grow);
  if (g.shape === 'heart') return dedupe(heart(g.w, g.h, grow));
  return offsetPolygon(dedupe(basePolygon(g.shape, g.w, g.h)), grow);
}

function dedupe(pts: Pt[]): Pt[] {
  return pts.filter((p, i, a) => Math.hypot(p[0] - a[(i + 1) % a.length][0], p[1] - a[(i + 1) % a.length][1]) > 1e-6);
}

/** True if the point is inside the polygon (even-odd). */
export function inside(pts: Pt[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Distance from a point to the polygon's edges. */
export function edgeDistance(pts: Pt[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
  }
  return best;
}
