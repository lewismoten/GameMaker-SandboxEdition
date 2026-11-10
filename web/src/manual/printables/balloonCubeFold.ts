// The balloon cube's fold as motion, with no drawing: the same panels as balloonCubeModel.ts, joined by hinges the way the paper is,
// and a list of fold steps (one fold each) that carry the flat square to the finished cube. Every pose is a rotation about a crease,
// so the panels stay the shapes printed on the sheet. balloonCubeFold.test.ts checks that the last pose is balloonCubeModel's cube.
// Flat pose: the sheet lies in z = 0, printed side toward +z. Faces fold toward -z (away from you), so the cube hangs below it;
// `display` turns that over (a half turn about x) so the cube stands on the table with its lid up.
import { PLACEMENTS, type V2, type V3 } from './balloonCubeModel';

type Mat = number[]; // 3x4, row-major: the first three columns are the rotation, the last the shift
const IDENTITY: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
const mul = (a: Mat, b: Mat): Mat => {
  const o: Mat = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) o.push(a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + (c === 3 ? a[r * 4 + 3] : 0));
  }
  return o;
};
export const apply = (m: Mat, p: V3): V3 => [0, 1, 2].map((r) => m[r * 4] * p[0] + m[r * 4 + 1] * p[1] + m[r * 4 + 2] * p[2] + m[r * 4 + 3]) as V3;
/** A panel's printed side faces this way (its sheet normal, turned by the pose). */
export const normalOf = (m: Mat): V3 => [m[2], m[6], m[10]];

/** Turn by `angle` about the sheet line a to b, in the direction that carries `toward` (a point of the moving panel) down to -z. */
function hingeTurn(a: V2, b: V2, toward: V2, angle: number): Mat {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  if (dx * (toward[1] - a[1]) - dy * (toward[0] - a[0]) > 0) {
    dx = -dx;
    dy = -dy;
  }
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = 1 - c;
  // Rodrigues, axis (dx, dy, 0)
  const R = [c + dx * dx * k, dx * dy * k, dy * s, dx * dy * k, c + dy * dy * k, -dx * s, -dy * s, dx * s, c];
  const t = [a[0] - (R[0] * a[0] + R[1] * a[1]), a[1] - (R[3] * a[0] + R[4] * a[1]), -(R[6] * a[0] + R[7] * a[1])];
  return [R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2]];
}

export type PanelKind = 'bottom' | 'side' | 'tuck' | 'corner';
export interface Panel {
  id: string;
  kind: PanelKind;
  /** Its outline on the flat sheet. */
  poly: V2[];
  /** Index into PLACEMENTS when it carries printed art. */
  art?: number;
  parent?: string;
  /** The crease it turns on (two sheet points, shared with its parent). */
  hinge?: [V2, V2];
}

const SIDES = ['ne', 'nw', 'sw', 'se'] as const;
const centers: Record<(typeof SIDES)[number], V2> = { ne: [0.25, 0.25], nw: [-0.25, 0.25], sw: [-0.25, -0.25], se: [0.25, -0.25] };
const diamondAt = ([cx, cy]: V2): V2[] => [
  [cx + 0.25, cy],
  [cx, cy + 0.25],
  [cx - 0.25, cy],
  [cx, cy - 0.25],
];
// Each side's two vertical-edge vertices (its lower inner corner, the tuck's right angle, and the tuck's top corner) and its top hinge
const bottomHinge: Record<(typeof SIDES)[number], [V2, V2]> = {
  ne: [
    [0.25, 0],
    [0, 0.25],
  ],
  nw: [
    [0, 0.25],
    [-0.25, 0],
  ],
  sw: [
    [-0.25, 0],
    [0, -0.25],
  ],
  se: [
    [0, -0.25],
    [0.25, 0],
  ],
};
// The four tucks, as pairs of halves: [side, hinge on that side (right angle first), the far end of the middle crease]
const TUCK_HALVES: { id: string; side: (typeof SIDES)[number]; tip: V2; top: V2; mid: V2 }[] = [
  { id: 'tuckEast-ne', side: 'ne', tip: [0.25, 0], top: [0.5, 0.25], mid: [0.5, 0] },
  { id: 'tuckEast-se', side: 'se', tip: [0.25, 0], top: [0.5, -0.25], mid: [0.5, 0] },
  { id: 'tuckWest-nw', side: 'nw', tip: [-0.25, 0], top: [-0.5, 0.25], mid: [-0.5, 0] },
  { id: 'tuckWest-sw', side: 'sw', tip: [-0.25, 0], top: [-0.5, -0.25], mid: [-0.5, 0] },
  { id: 'tuckNorth-ne', side: 'ne', tip: [0, 0.25], top: [0.25, 0.5], mid: [0, 0.5] },
  { id: 'tuckNorth-nw', side: 'nw', tip: [0, 0.25], top: [-0.25, 0.5], mid: [0, 0.5] },
  { id: 'tuckSouth-sw', side: 'sw', tip: [0, -0.25], top: [-0.25, -0.5], mid: [0, -0.5] },
  { id: 'tuckSouth-se', side: 'se', tip: [0, -0.25], top: [0.25, -0.5], mid: [0, -0.5] },
];
// the corner placements in PLACEMENTS order (after bottom and the four sides): their parent side
const CORNER_PARENT = ['ne', 'se', 'sw', 'nw'] as const;

export const PANELS: Panel[] = [
  { id: 'bottom', kind: 'bottom', poly: diamondAt([0, 0]), art: 0 },
  ...SIDES.map((s, i): Panel => ({ id: s, kind: 'side', poly: diamondAt(centers[s]), art: 1 + i, parent: 'bottom', hinge: bottomHinge[s] })),
  ...TUCK_HALVES.map((t): Panel => ({ id: t.id, kind: 'tuck', poly: [t.tip, t.top, t.mid], parent: t.side, hinge: [t.tip, t.top] })),
  ...CORNER_PARENT.map((s, i): Panel => {
    const clip = PLACEMENTS[5 + i].clip;
    return { id: `corner-${s}`, kind: 'corner', poly: clip, art: 5 + i, parent: s, hinge: [clip[1], clip[2]] };
  }),
];
const byId = new Map(PANELS.map((p) => [p.id, p]));

const QUARTER = Math.PI / 2;
/** How far each fold has turned. `wall` is the sides' turn from flat (0 to a quarter turn). */
export interface FoldState {
  wall: number;
  /** Each corner triangle's turn over the top, in CORNER_PARENT order. */
  corner: [number, number, number, number];
  /** 0 to 1: the blown-up cube's slight swell. */
  puff: number;
}

/** The turn of a tuck half, from the wall's turn: both halves of a tuck meet along their middle crease at every moment (it stays in the mirror plane between the two sides). */
const tuckCache = new Map<string, number>();
export function tuckAngle(wall: number): number {
  const key = wall.toFixed(6);
  if (wall >= Math.PI / 2 - 1e-9) return (3 * Math.PI) / 4; // upright: each tuck half lies in the plane that splits the corner
  const hit = tuckCache.get(key);
  if (hit !== undefined) return hit;
  // the east tuck's ne half: the apex of its middle crease must lie in the plane y = 0
  const t = TUCK_HALVES[0];
  const side = byId.get('ne')!;
  const sideM = mul(IDENTITY, hingeTurn(side.hinge![0], side.hinge![1], centers.ne, wall));
  const apexY = (phi: number) => apply(mul(sideM, hingeTurn(t.tip, t.top, [0.5, 0], phi)), [t.mid[0], t.mid[1], 0])[1];
  let lo = 0;
  let hi = 0;
  const step = Math.PI / 720;
  let prev = apexY(0);
  for (let phi = step; phi <= Math.PI; phi += step) {
    const y = apexY(phi);
    if (Math.abs(y) < 1e-12) {
      tuckCache.set(key, phi);
      return phi;
    }
    if (Math.sign(y) !== Math.sign(prev) && Math.abs(prev) > 1e-12) {
      lo = phi - step;
      hi = phi;
      break;
    }
    prev = y;
  }
  if (wall < 1e-9) hi = lo = 0;
  for (let i = 0; i < 50 && hi > lo; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(apexY(mid)) === Math.sign(apexY(lo))) lo = mid;
    else hi = mid;
  }
  const r = (lo + hi) / 2;
  tuckCache.set(key, r);
  return r;
}

/** Each panel's pose (a 3x4 matrix taking flat sheet coordinates to the folded paper), flat-sheet frame. */
export function pose(state: FoldState): Map<string, Mat> {
  const out = new Map<string, Mat>();
  const phi = tuckAngle(state.wall);
  for (const p of PANELS) {
    const parent = p.parent ? out.get(p.parent)! : IDENTITY;
    let m = parent;
    if (p.hinge) {
      const angle = p.kind === 'side' ? state.wall : p.kind === 'tuck' ? phi : state.corner[CORNER_PARENT.indexOf(p.parent as (typeof CORNER_PARENT)[number])];
      const cx = p.poly.reduce((s, q) => s + q[0], 0) / p.poly.length;
      const cy = p.poly.reduce((s, q) => s + q[1], 0) / p.poly.length;
      m = mul(parent, hingeTurn(p.hinge[0], p.hinge[1], [cx, cy], angle));
    }
    out.set(p.id, m);
  }
  return out;
}

export interface FoldStep {
  /** Short label for the slider's spoken value. */
  label: string;
  /** What folds, in plain words. */
  caption: string;
}
/** Step 0 is the flat square; each later step is one fold. */
export const STEPS: FoldStep[] = [
  {
    label: 'Flat square',
    caption:
      'The cut-out square, printed side down. The middle diamond is the bottom, the four diamonds around it are the sides, the four paper corners are the lid, and the four gray triangles between the sides are the tucks.',
  },
  {
    label: 'Lift the sides',
    caption: 'Lift all four sides from the middle diamond. Each gray tuck, joined to two sides, starts to buckle along its middle line.',
  },
  {
    label: 'Stand the sides up',
    caption: 'Stand the sides upright. Each tuck folds in half along its middle line and lies flat inside the cube, between two sides.',
  },
  { label: 'First corner over the top', caption: 'Fold the first paper corner (a triangle on top of a side) over the top, along its edge.' },
  { label: 'Second corner over the top', caption: 'Fold the second corner triangle over the top. Its tip meets the first at the middle of the lid.' },
  { label: 'Third corner over the top', caption: 'Fold the third corner triangle over the top, to the same middle point.' },
  {
    label: 'Fourth corner over the top',
    caption: 'Fold the fourth corner triangle over the top. The four right angles meet at the middle, where the blow hole is.',
  },
  { label: 'Blow it up', caption: 'Blow gently into the hole. The cube swells and the corners press out. The lid is the 0.' },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** The fold state at a position along the steps (0 = flat, 7 = finished); fractions are partway through a step. */
export function stateAt(pos: number): FoldState {
  const wall = QUARTER * (0.5 * clamp01(pos) + 0.5 * clamp01(pos - 1));
  const corner = [0, 1, 2, 3].map((i) => QUARTER * clamp01(pos - 2 - i)) as FoldState['corner'];
  return { wall, corner, puff: clamp01(pos - 6) };
}

export type View = { yaw: number; pitch: number };
/** Turn the folded paper over (cube standing, lid up), then look at it from `view` (orthographic): [screen x, screen y (down), nearness]. */
export function toView(p: V3, view: View): V3 {
  const x = p[0];
  const y = -p[1];
  const z = -p[2];
  const x1 = x * Math.cos(view.yaw) - y * Math.sin(view.yaw);
  const y1 = x * Math.sin(view.yaw) + y * Math.cos(view.yaw);
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  return [x1, -(z * cp + y1 * sp), -y1 * cp + z * sp];
}
