// The balloon cube is the traditional paper balloon (the waterbomb), folded step by step with balloonCubeSim.ts, then blown up.
// The sheet is a unit square centered on O (u right, v up, printed side toward you). With the printing face up the two diagonals are
// mountain folds and the left-right midline a valley fold; collapsing on them pulls the left and right edge midpoints in, the top half
// folds down behind, and the square becomes a triangle with its point at O (the waterbomb base: two flaps on each side). Then, on the
// front: both bottom corners up to the point, both side points to the center line, the two loose top flaps down and into the pockets of
// the side triangles (the lock); the same on the back. Blowing into the hole at the bottom point (where the four edge midpoints meet)
// makes a cube of edge 1/4 (`L`). On it:
//   - the middle square of the sheet (|u|, |v| <= 1/8) is the face opposite the hole;
//   - the squares between it and the left and right edges are two sides; the half-squares on those edges meet at the hole;
//   - the front and back faces are five triangles each, from below and above the middle row (they come from five layers);
//   - the four paper corners are the tucks (kites, hidden in the pockets) and everything else ends up inside, unseen.
// `FACE_REGIONS` (data) says which sheet region shows which face; their art frames come from the folded pieces, and
// balloonCubeModel.test.ts folds the sheet and checks every region is the outer layer of its face, printing outward.
import { ID, ap, centroid, crease, fold, type Aff, type Fold, type Piece, type V2, type V3 } from './balloonCubeSim';

export type { V2, V3 } from './balloonCubeSim';
export type FaceId = 'top' | 'bottom' | 'ne' | 'nw' | 'sw' | 'se';

/** The cube's edge, in sheet units (the sheet's side is 1). */
export const L = 1 / 4;
const H = 1 / 8;

// ---- the waterbomb base: where each eighth of the sheet (cut by the midlines and diagonals) lands in the triangle ----
// Triangle coordinates: its point at O = (0, 0), its base on y = -1/2 from x = -1/2 to 1/2. The bottom quarter of the sheet stays put
// (front layer); the top quarter folds down behind (back layer); the left and right quarters fold in half between them.
interface Eighth {
  id: string;
  poly: V2[];
  /** Sheet to triangle. */
  map: Aff;
  layer: number;
  /** Which flap of the base it is in: front or back, right or left. */
  flap: 'fr' | 'fl' | 'br' | 'bl';
}
const C = (x: number, y: number): V2 => [x / 2, y / 2];
export const EIGHTHS: Eighth[] = [
  { id: 'S+', poly: [C(0, 0), C(0, -1), C(1, -1)], map: ID, layer: 4, flap: 'fr' },
  { id: 'E-', poly: [C(0, 0), C(1, -1), C(1, 0)], map: [0, -1, -1, 0, 0, 0], layer: 3, flap: 'fr' },
  { id: 'E+', poly: [C(0, 0), C(1, 0), C(1, 1)], map: [0, 1, -1, 0, 0, 0], layer: 2, flap: 'br' },
  { id: 'N+', poly: [C(0, 0), C(1, 1), C(0, 1)], map: [1, 0, 0, -1, 0, 0], layer: 1, flap: 'br' },
  { id: 'N-', poly: [C(0, 0), C(0, 1), C(-1, 1)], map: [1, 0, 0, -1, 0, 0], layer: 1, flap: 'bl' },
  { id: 'W+', poly: [C(0, 0), C(-1, 1), C(-1, 0)], map: [0, -1, 1, 0, 0, 0], layer: 2, flap: 'bl' },
  { id: 'W-', poly: [C(0, 0), C(-1, 0), C(-1, -1)], map: [0, 1, 1, 0, 0, 0], layer: 3, flap: 'fl' },
  { id: 'S-', poly: [C(0, 0), C(-1, -1), C(0, -1)], map: ID, layer: 4, flap: 'fl' },
];

// ---- the folds after the base, as data: one list for the front flaps, mirrored for the back ----
const has =
  (...tags: string[]) =>
  (p: Piece) =>
    tags.every((t) => (t.startsWith('!') ? !p.tags.has(t.slice(1)) : p.tags.has(t)));
/** The pocket of a side triangle: between its outer two layers (the base) and its inner two (the corner folded up). */
const pocketOf = (flap: string) => (all: Piece[]) => {
  const side = all.filter(has(flap, 'R'));
  const inner = side.filter(has('F')).map((p) => p.layer);
  const outer = side.filter(has('!F')).map((p) => p.layer);
  return Math.max(...inner) < Math.min(...outer)
    ? ([Math.max(...inner), Math.min(...outer)] as [number, number])
    : ([Math.max(...outer), Math.min(...inner)] as [number, number]);
};

export interface Op {
  /** The animation step it belongs to, and which part of that step (0 to 1) it takes. */
  step: number;
  phase: [number, number];
  name: string;
  fold?: Fold;
}

function flapFolds(flap: 'fr' | 'fl' | 'br' | 'bl', steps: [number, number, number, number], c1: [number, number], c2: [number, number]): Op[] {
  const k = flap.endsWith('r') ? 1 : -1; // right or left: the lines mirror in x
  const to = flap.startsWith('f') ? 'front' : 'back';
  const where = `${to} ${k > 0 ? 'right' : 'left'}`;
  return [
    {
      step: steps[0],
      phase: [0, 1],
      name: `${where} corner up to the point`,
      fold: {
        line: [
          [0, -0.5],
          [k * 0.25, -0.25],
        ],
        moving: [k * 0.5, -0.5],
        select: has(flap),
        to,
        tag: 'F',
      },
    },
    {
      step: steps[1],
      phase: [0, 1],
      name: `${where} point to the center line`,
      fold: {
        line: [
          [k * H, 0],
          [k * H, -1],
        ],
        moving: [k, -0.25],
        select: has(flap),
        to,
        tag: 'R',
      },
    },
    {
      step: steps[2],
      phase: c1,
      name: `${where} top flap down`,
      fold: {
        line: [
          [-1, -H],
          [1, -H],
        ],
        moving: [0, 0],
        select: has(flap, 'F', '!R'),
        to,
        tag: 'T',
      },
    },
    {
      step: steps[3],
      phase: c2,
      name: `${where} flap tucked into the pocket`,
      fold: {
        line: [
          [0, -2 * H],
          [k * H, -H],
        ],
        moving: [0, -H],
        select: has(flap, 'F', '!R'),
        to,
        pocket: pocketOf(flap),
        tag: 'T',
      },
    },
  ];
}

/** Every operation, in the order of the steps (the left and right flaps fold together): the collapse, the front, the back, the inflation. */
export const OPS: Op[] = [
  { step: 2, phase: [0, 1], name: 'collapse into the waterbomb base' },
  ...[
    ...flapFolds('fr', [3, 4, 5, 6], [0, 1], [0, 1]),
    ...flapFolds('fl', [3, 4, 5, 6], [0, 1], [0, 1]),
    ...flapFolds('br', [8, 9, 10, 10], [0, 0.5], [0.5, 1]),
    ...flapFolds('bl', [8, 9, 10, 10], [0, 0.5], [0.5, 1]),
  ].sort((a, b) => a.step - b.step || a.phase[0] - b.phase[0]),
  { step: 11, phase: [0, 1], name: 'blow it up' },
];

// ---- inflation: the flat model (front and back faces |x| <= 1/8, -3/8 <= y <= -1/8) opens into the cube ----
/** +1 for the front stack, -1 for the back one. */
const stackOf = (p: Piece): number => (p.tags.has('fr') || p.tags.has('fl') ? 1 : -1);
/** The left and right quarters' inner layers swing out of the middle of the stack to become the left and right faces. */
const swings = (p: Piece): boolean => ['E-', 'E+', 'W-', 'W+'].some((e) => p.tags.has(e)) && !p.tags.has('F') && !p.tags.has('R');

/** Where a flat-model point of a piece goes on the cube (cube centered on 0, x right, y toward the face opposite the hole, z front). */
function inflate(p: Piece, q: V2): V3 {
  const [x, y] = ap(p.m, q);
  const s = stackOf(p);
  const c = centroid(p.poly.map((v) => ap(p.m, v)));
  const zone = c[1] > -H ? 'top' : c[1] < -3 * H ? 'bottom' : 'mid';
  let r: V3;
  if (swings(p)) {
    const side = Math.sign(c[0]);
    const z = s * Math.abs(x);
    r = zone === 'mid' ? [side * H, y, z] : zone === 'top' ? [side * -y, -H, z] : [side * (y + 0.5), -3 * H, z];
  } else r = zone === 'mid' ? [x, y, s * H] : zone === 'top' ? [x, -H, -s * y] : [x, -3 * H, s * (y + 0.5)];
  return [r[0], r[1] + 2 * H, r[2]];
}

export interface FoldedPiece {
  poly: V2[];
  tags: Set<string>;
  /** Its placement and layer after each operation in `OPS` (the last is the flat model, before it opens). */
  hist: Piece['hist'];
  /** Its outline's points on the finished cube. */
  cube: V3[];
  stack: number;
  swing: boolean;
}

/** Fold the sheet: every piece with its history (one entry per operation) and its place on the cube. */
function foldAll(): FoldedPiece[] {
  let pieces: Piece[] = EIGHTHS.map((e) => ({
    poly: e.poly,
    m: e.map,
    layer: e.layer,
    tags: new Set([e.id, e.flap]),
    hist: [{ m: e.map, layer: e.layer, moved: true }],
  }));
  for (const op of OPS) if (op.fold) pieces = fold(pieces, op.fold);
  // the cube's top and bottom edges, creased as it opens
  pieces = crease(pieces, [-1, -H], [1, -H]);
  pieces = crease(pieces, [-1, -3 * H], [1, -3 * H]);
  // and the edges of the side triangles, where a face's outer layer changes from one piece of paper to the next (no fold: for the art)
  pieces = crease(pieces, [0, -2 * H], [H, -H]);
  pieces = crease(pieces, [0, -2 * H], [-H, -H]);
  return pieces.map((p) => ({
    poly: p.poly,
    tags: p.tags,
    hist: [...p.hist, { m: p.m, layer: p.layer, moved: true }],
    cube: p.poly.map((q) => inflate(p, q)),
    stack: stackOf(p),
    swing: swings(p),
  }));
}
export const PIECES: FoldedPiece[] = foldAll();

// ---- the faces ----
/** Each face's outward direction and its art's right and up directions on the cube (right x up = outward, so it reads from outside). */
export const FACE_FRAME: Record<FaceId, { n: V3; right: V3; up: V3 }> = {
  bottom: { n: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] }, // opposite the hole: the middle of the sheet
  top: { n: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] }, // the lid with the blow hole
  ne: { n: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
  sw: { n: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
  se: { n: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  nw: { n: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
};
export const OPPOSITE: Record<FaceId, FaceId> = { top: 'bottom', bottom: 'top', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw' };

const sq = (u0: number, v0: number, u1: number, v1: number): V2[] => [
  [u0, v0],
  [u1, v0],
  [u1, v1],
  [u0, v1],
];
const flipV = (poly: V2[]): V2[] => poly.map(([u, v]) => [u, -v] as V2).reverse();
const FRONT_PIECES: V2[][] = [
  // under the middle square: the top triangle of the front face
  [
    [-H, -H],
    [0, -2 * H],
    [H, -H],
  ],
  // its right and left triangles (the side points folded in)
  [
    [H, -H],
    [2 * H, -2 * H],
    [3 * H, -H],
  ],
  [
    [-3 * H, -H],
    [-2 * H, -2 * H],
    [-H, -H],
  ],
  // its bottom triangle, in two halves on the right and left edges
  [
    [3 * H, -H],
    [0.5, -2 * H],
    [0.5, -H],
  ],
  [
    [-0.5, -H],
    [-0.5, -2 * H],
    [-3 * H, -H],
  ],
];
/** Which region of the printed square shows which face (the mapping, as data). */
export const FACE_REGIONS: { face: FaceId; clip: V2[] }[] = [
  { face: 'bottom', clip: sq(-H, -H, H, H) },
  { face: 'ne', clip: sq(H, -H, 3 * H, H) },
  { face: 'sw', clip: sq(-3 * H, -H, -H, H) },
  { face: 'top', clip: sq(3 * H, -H, 0.5, H) },
  { face: 'top', clip: sq(-0.5, -H, -3 * H, H) },
  ...FRONT_PIECES.map((clip): { face: FaceId; clip: V2[] } => ({ face: 'se', clip })),
  ...FRONT_PIECES.map((clip): { face: FaceId; clip: V2[] } => ({ face: 'nw', clip: flipV(clip) })),
];

/** The four tucks: the paper corners (right triangles with legs 1/4), folded into the pockets. */
export const TUCKS: V2[][] = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
].map(([sx, sy]) => [
  [sx / 2, sy / 2],
  [sx / 4, sy / 2],
  [sx / 2, sy / 4],
]);

/** The creases to make first, as seen from the printed side: both diagonals mountain, the left-right midline valley. */
export const PRECREASES: { kind: 'mountain' | 'valley'; a: V2; b: V2 }[] = [
  { kind: 'mountain', a: [-0.5, -0.5], b: [0.5, 0.5] },
  { kind: 'mountain', a: [-0.5, 0.5], b: [0.5, -0.5] },
  { kind: 'valley', a: [-0.5, 0], b: [0.5, 0] },
];

// ---- art frames, worked out from the folded pieces ----
/** A flat piece of art's frame: its center and its right and up directions, as unit vectors. */
export interface Frame2 {
  o: V2;
  right: V2;
  up: V2;
}
interface Frame3 {
  o: V3;
  right: V3;
  up: V3;
}
export interface Placement {
  face: FaceId;
  clip: V2[];
  sheet: Frame2;
  cube: Frame3;
}

/** Whether a point is in a convex polygon (on its edge counts when tol >= 0). */
export const inside = (poly: V2[], p: V2, tol = 1e-9): boolean => {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const s = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(s) <= tol) continue;
    if (sign === 0) sign = Math.sign(s);
    else if (Math.sign(s) !== sign) return false;
  }
  return true;
};
/** Whether a point is strictly inside a convex polygon (not on an edge). */
const strictlyInside = (poly: V2[], p: V2): boolean => {
  const s = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  });
  return s.every((v) => v > 1e-12) || s.every((v) => v < -1e-12);
};
/** The piece of folded paper that holds a sheet point (strictly inside it). */
export const pieceAt = (p: V2): FoldedPiece | undefined => PIECES.find((q) => strictlyInside(q.poly, p));

/** A piece's map onto the cube: the images of the sheet's u and v directions, and the image c0 of its first point q0. */
export function cubeMap(p: { poly: V2[]; cube: V3[] }): { a1: V3; a2: V3; q0: V2; c0: V3 } {
  const [q0, q1, q2] = p.poly;
  const [c0, c1, c2] = p.cube;
  const d1 = [q1[0] - q0[0], q1[1] - q0[1]];
  const d2 = [q2[0] - q0[0], q2[1] - q0[1]];
  const det = d1[0] * d2[1] - d1[1] * d2[0];
  const e1 = [0, 1, 2].map((i) => c1[i] - c0[i]);
  const e2 = [0, 1, 2].map((i) => c2[i] - c0[i]);
  // [a1 a2] [d1 d2] = [e1 e2]
  const a1 = [0, 1, 2].map((i) => (e1[i] * d2[1] - e2[i] * d1[1]) / det) as V3;
  const a2 = [0, 1, 2].map((i) => (e2[i] * d1[0] - e1[i] * d2[0]) / det) as V3;
  return { a1, a2, q0, c0 };
}
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function placement(face: FaceId, clip: V2[]): Placement {
  const f = FACE_FRAME[face];
  const probe: V2 = [0, 1].map((i) => clip[0][i] * 0.6 + clip[1][i] * 0.3 + clip[2][i] * 0.1) as V2;
  const piece = pieceAt(probe);
  if (!piece) throw new Error(`no paper at ${probe.join(',')}`);
  const { a1, a2, q0, c0 } = cubeMap(piece);
  const o3: V3 = [f.n[0] * H, f.n[1] * H, f.n[2] * H];
  const rel: V3 = [o3[0] - c0[0], o3[1] - c0[1], o3[2] - c0[2]];
  return {
    face,
    clip,
    sheet: { o: [q0[0] + dot3(a1, rel), q0[1] + dot3(a2, rel)], right: [dot3(a1, f.right), dot3(a2, f.right)], up: [dot3(a1, f.up), dot3(a2, f.up)] },
    cube: { o: o3, right: f.right, up: f.up },
  };
}
/** Every region of the sheet that shows on the cube, with its art frame on the sheet and on the cube. */
export const PLACEMENTS: Placement[] = FACE_REGIONS.map((r) => placement(r.face, r.clip));

/** Where a sheet point of a placement lands on the cube. */
export function toCube(p: Placement, pt: V2): V3 {
  const dx = pt[0] - p.sheet.o[0];
  const dy = pt[1] - p.sheet.o[1];
  const r = dx * p.sheet.right[0] + dy * p.sheet.right[1];
  const u = dx * p.sheet.up[0] + dy * p.sheet.up[1];
  return [0, 1, 2].map((i) => p.cube.o[i] + r * p.cube.right[i] + u * p.cube.up[i]) as V3;
}
