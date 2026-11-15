// A small flat-fold simulator for the balloon cube (balloonCubeModel.ts uses it): the sheet is a set of polygon pieces, each with a 2D
// placement (an isometry, mirrored when the printed side faces away) and a layer. A fold splits the pieces it selects along a line and
// reflects the part on one side over it, onto the front, onto the back or into a pocket between two layers. Every piece keeps its
// whole history, so the animation can replay any step and the tests can check that no fold tears the paper.

export type V2 = [number, number];
export type V3 = [number, number, number];
/** x' = a x + b y + e, y' = c x + d y + f, as [a, b, c, d, e, f]. */
export type Aff = [number, number, number, number, number, number];

export const ID: Aff = [1, 0, 0, 1, 0, 0];
export const ap = (m: Aff, p: V2): V2 => [m[0] * p[0] + m[1] * p[1] + m[4], m[2] * p[0] + m[3] * p[1] + m[5]];
/** a after b. */
const compose = (a: Aff, b: Aff): Aff => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
  a[0] * b[4] + a[1] * b[5] + a[4],
  a[2] * b[4] + a[3] * b[5] + a[5],
];
/** +1 when the printed side faces the front (+z), -1 when the piece is turned over. */
export const facing = (m: Aff): number => Math.sign(m[0] * m[3] - m[1] * m[2]);

/** The reflection over the line through a and b. */
export function reflectOver(a: V2, b: V2): Aff {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len;
  const dy = (b[1] - a[1]) / len;
  const r: Aff = [2 * dx * dx - 1, 2 * dx * dy, 2 * dx * dy, 2 * dy * dy - 1, 0, 0];
  const ra = ap(r, a);
  return [r[0], r[1], r[2], r[3], a[0] - ra[0], a[1] - ra[1]];
}

/** Which side of the line a-b a point is on (positive to the left), scaled by the line's length. */
const sideOf = (a: V2, b: V2, p: V2): number => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

export const area = (poly: V2[]): number =>
  Math.abs(poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0)) / 2;
export const centroid = (poly: V2[]): V2 => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];

/** Keep the part of a polygon where f >= 0 (f is affine in the point). */
function clip(poly: V2[], f: (p: V2) => number): V2[] {
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = f(p);
    const fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp > 0 && fq < 0) || (fp < 0 && fq > 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  // drop repeated points (a vertex on the line comes out twice)
  return out.filter((p, i) => {
    const q = out[(i + 1) % out.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-12;
  });
}

export interface Piece {
  /** Its outline on the flat sheet (u right, v up, printed side toward you). */
  poly: V2[];
  /** Where it is now. */
  m: Aff;
  layer: number;
  tags: Set<string>;
  /** Its placement and layer after each operation, and whether that operation moved it. */
  hist: { m: Aff; layer: number; moved: boolean }[];
}

export interface Fold {
  line: [V2, V2];
  /** A point on the side that moves. */
  moving: V2;
  select: (p: Piece) => boolean;
  /** Which way the moving part turns: over the front (it lands on top of everything) or round the back (under everything). */
  to: 'front' | 'back';
  /** Instead, slide the moving part in between two layers: this names them (a tuck going into a pocket). */
  pocket?: (all: Piece[]) => [number, number];
  tag?: string;
}

const EPS = 1e-12;

/** Split the selected pieces along the fold line and reflect the moving parts. Returns the new piece list. */
export function fold(pieces: Piece[], f: Fold): Piece[] {
  const [a, b] = f.line;
  const sgn = Math.sign(sideOf(a, b, f.moving));
  const out: Piece[] = [];
  const movers: Piece[] = [];
  for (const p of pieces) {
    if (!f.select(p)) {
      out.push(p);
      continue;
    }
    const s = (q: V2) => sgn * sideOf(a, b, ap(p.m, q));
    const mov = clip(p.poly, s);
    const stay = clip(p.poly, (q) => -s(q));
    const child = (poly: V2[]): Piece => ({ ...p, poly, tags: new Set(p.tags), hist: [...p.hist] });
    if (area(stay) > EPS) out.push(child(stay));
    if (area(mov) > EPS) movers.push(child(mov));
  }
  const r = reflectOver(a, b);
  const layers = pieces.map((p) => p.layer);
  const ml = movers.map((p) => p.layer);
  const [lo, hi] = f.pocket ? f.pocket(pieces) : [0, 0];
  const order = [...new Set(ml)].sort((x, y) => y - x); // top layer first: it lands at the bottom of the moved stack
  for (const p of movers) {
    p.m = compose(r, p.m);
    if (f.pocket) p.layer = lo + ((hi - lo) * (order.indexOf(p.layer) + 1)) / (order.length + 1);
    else if (f.to === 'front') p.layer = Math.max(...layers) + 1 + (Math.max(...ml) - p.layer);
    else if (f.to === 'back') p.layer = Math.min(...layers) - 1 - (p.layer - Math.min(...ml));
    if (f.tag) p.tags.add(f.tag);
    p.hist.push({ m: p.m, layer: p.layer, moved: true });
    out.push(p);
  }
  for (const p of out) if (!movers.includes(p)) p.hist.push({ m: p.m, layer: p.layer, moved: false });
  return out;
}

/** Split every piece along a line without moving anything (a crease made later, such as a cube edge when it inflates). */
export function crease(pieces: Piece[], a: V2, b: V2): Piece[] {
  const out: Piece[] = [];
  for (const p of pieces) {
    const s = (q: V2) => sideOf(a, b, ap(p.m, q));
    for (const poly of [clip(p.poly, s), clip(p.poly, (q) => -s(q))]) {
      if (area(poly) > EPS) out.push({ ...p, poly, tags: new Set(p.tags), hist: [...p.hist] });
    }
  }
  return out;
}
