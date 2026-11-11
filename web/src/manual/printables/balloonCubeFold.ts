// The balloon cube's fold as motion, with no drawing: the steps of the traditional paper balloon (the waterbomb) and where every piece
// of balloonCubeModel.ts is at any moment. Within a step each fold turns its pieces about the fold line (so they stay the shapes cut
// on the sheet); the collapse into the base is the rigid motion of its six creases round the middle; blowing it up moves each piece
// from the flat model to its place on the cube. balloonCubeFold.test.ts checks that every step ends where the model says.
import { EIGHTHS, FACE_REGIONS, OPS, PIECES, inside, type FoldedPiece } from './balloonCubeModel';
import { ap, centroid, type V2, type V3 } from './balloonCubeSim';

interface FoldStep {
  /** Short label for the slider's spoken value. */
  label: string;
  /** What folds, in plain words. */
  caption: string;
}
/** Step 0 is the flat square; each later step is one fold (or one move of the model). The waterbomb is a traditional fold, not anyone's design. */
export const STEPS: FoldStep[] = [
  {
    label: 'Flat square',
    caption:
      'The cut-out square, printed side up. The middle row (a half face, a face, the middle face, a face, a half face) and the triangles above and below it end up outside; the gray corners tuck inside and the white paper is hidden.',
  },
  {
    label: 'Pre-crease',
    caption:
      'Printed side up, fold both diagonals away from you (mountain folds) and the line across the middle toward you (a valley fold). Crease each one hard, then open the square flat again.',
  },
  {
    label: 'Collapse into a triangle',
    caption:
      'Push the middle of the left and right edges in toward the center. The top half folds down behind and the square collapses into a triangle: two flaps on each side, its point at the middle of the sheet.',
  },
  {
    label: 'Front corners up',
    caption: 'Fold both bottom corners of the front flaps up to the top point. The front is now a diamond.',
  },
  {
    label: 'Front side points in',
    caption: 'Fold the left and right points of the diamond in to meet at the center line.',
  },
  {
    label: 'Front top flaps down',
    caption: 'Two small loose flaps stick up at the top. Fold each one down along the top edges of the side triangles.',
  },
  {
    label: 'Tuck them in (close-up)',
    caption:
      'Each side triangle has a pocket along its top edge. Slide each small flap all the way into the pocket next to it. This is the lock: the tucked flaps hold the folds shut.',
  },
  { label: 'Turn it over', caption: 'Turn the model over, keeping the point at the top.' },
  { label: 'Back corners up', caption: 'Fold both bottom corners up to the top point, the same as on the front.' },
  { label: 'Back side points in', caption: 'Fold the side points in to the center line.' },
  {
    label: 'Back flaps down and tucked',
    caption: 'Fold the two small top flaps down and tuck them into their pockets. Both sides are locked.',
  },
  {
    label: 'Blow it up',
    caption: 'Blow hard into the small hole at the bottom point. The paper swells into a cube; press out the corners gently. The face with the hole is the 0.',
  },
];
export const LAST = STEPS.length - 1;

const LAYER = 0.0003; // drawing thickness of one step of layer number (the numbers run to about 70, both stacks together)
const H = 1 / 8;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Turn p about the axis through `o` along unit `d` by `a` radians (right-handed). */
function turn(p: V3, o: V3, d: V3, a: number): V3 {
  const v: V3 = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = (d[0] * v[0] + d[1] * v[1] + d[2] * v[2]) * (1 - c);
  const x: V3 = [d[1] * v[2] - d[2] * v[1], d[2] * v[0] - d[0] * v[2], d[0] * v[1] - d[1] * v[0]];
  return [0, 1, 2].map((i) => o[i] + v[i] * c + x[i] * s + d[i] * k) as V3;
}
const unit = (x: number, y: number): V3 => {
  const n = Math.hypot(x, y);
  return [x / n, y / n, 0];
};

// ---- the collapse: the bottom quarter stays, the top quarter turns down behind about the midline, the side quarters fold in half ----
/** How far a side quarter's halves turn about the diagonals when the top quarter has turned `theta`: tan(phi/2) = sqrt 2 tan(theta/2),
 * which keeps the edge midpoint on the mirror plane between the two quarters (worked out from the geometry; the test checks the halves meet). */
export const phiOf = (theta: number): number => (theta >= Math.PI - 1e-12 ? Math.PI : 2 * Math.atan(Math.SQRT2 * Math.tan(theta / 2)));
const O3: V3 = [0, 0, 0];
const AXES: Record<string, V3> = { 'E-': unit(1, -1), 'W-': unit(-1, -1), 'E+': unit(1, 1), 'W+': unit(-1, 1) };
const MIDS: Record<string, V3> = { 'E-': [0.5, 0, 0], 'W-': [-0.5, 0, 0], 'E+': [0.5, 0, 0], 'W+': [-0.5, 0, 0] };
/** The turn about a diagonal that sends the quarter's edge midpoint behind the sheet (toward -z). */
const sideTurn = (e: string, phi: number) => {
  const probe = turn(MIDS[e], O3, AXES[e], 0.1);
  const a = probe[2] < 0 ? phi : -phi;
  return (p: V3) => turn(p, O3, AXES[e], a);
};
const topTurn = (theta: number) => (p: V3) => turn(p, O3, [-1, 0, 0], theta); // +y goes toward -z
/** A sheet point of an eighth, partway through the collapse. */
export function collapsePoint(eighth: string, q: V2, theta: number): V3 {
  const p: V3 = [q[0], q[1], 0];
  const phi = phiOf(theta);
  if (eighth.startsWith('S')) return p;
  if (eighth.startsWith('N')) return topTurn(theta)(p);
  if (eighth.endsWith('-')) return sideTurn(eighth, phi)(p);
  return topTurn(theta)(sideTurn(eighth, phi)(p));
}

// ---- the poses ----
/** Is this piece part of a face (on the outside of the finished cube)? */
export const isFace = (p: FoldedPiece): boolean => FACE_REGIONS.some((r) => inside(r.clip, centroid(p.poly)));
const eighthOf = (p: FoldedPiece) => EIGHTHS.find((e) => p.tags.has(e.id))!.id;
const flat3 = (h: FoldedPiece['hist'][number], q: V2): V3 => {
  const [x, y] = ap(h.m, q);
  return [x, y, h.layer * LAYER];
};
const SHEET = { m: [1, 0, 0, 1, 0, 0] as FoldedPiece['hist'][number]['m'], layer: 0, moved: false };

export interface Pose {
  /** The piece's outline points in the model (x right, y up, z toward you; the finished cube's hole is down). */
  pts: V3[];
}

/** Where the step and the part of it are at a position along the slider (0 = flat; fractions are partway through a step). */
export function stepAt(pos: number): { step: number; t: number } {
  if (pos <= 0) return { step: 0, t: 1 };
  const step = Math.min(LAST, Math.ceil(pos - 1e-9));
  return { step, t: clamp01(pos - (step - 1)) };
}

/** Every piece's pose (in PIECES order) at a position along the steps. */
export function poseAt(pos: number): Pose[] {
  const { step, t } = stepAt(pos);
  const before = OPS.reduce((last, op, i) => (op.step < step ? i : last), -1);
  const mine = OPS.map((op, i) => ({ op, i })).filter((o) => o.op.step === step);
  return PIECES.map((p) => {
    let cur = before >= 0 ? p.hist[before] : SHEET;
    for (const { op, i } of mine) {
      const u = clamp01((t - op.phase[0]) / (op.phase[1] - op.phase[0]));
      if (u >= 1 && !op.fold && i > 0) return { pts: p.cube.map((c) => [c[0], c[1] - 2 * H, c[2]] as V3) }; // blown up
      if (u >= 1) {
        cur = p.hist[i];
        continue;
      }
      if (!p.hist[i].moved) continue;
      if (u <= 0) break;
      const next = p.hist[i];
      if (!op.fold) {
        if (i === 0) {
          const theta = u * Math.PI;
          const k = smooth(u);
          return { pts: p.poly.map((q) => collapsePoint(eighthOf(p), q, theta)).map((v) => [v[0], v[1], v[2] + k * next.layer * LAYER] as V3) };
        }
        // blowing it up: each point slides from the flat model to the cube (the cube's middle is 1/4 below the sheet's middle)
        const k = smooth(u);
        return {
          pts: p.poly.map((q, j) => {
            const a = flat3(cur, q);
            const c = p.cube[j];
            const b: V3 = [c[0], c[1] - 2 * H, c[2]];
            return [0, 1, 2].map((n) => a[n] + (b[n] - a[n]) * k) as V3;
          }),
        };
      }
      // a fold: turn about the line, over the front or round the back, while the layer height slides from the old layer to the new
      const [la, lb] = op.fold.line;
      const o: V3 = [la[0], la[1], 0];
      const d = unit(lb[0] - la[0], lb[1] - la[1]);
      const probe = turn([op.fold.moving[0], op.fold.moving[1], 0], o, d, 0.1);
      const a = probe[2] > 0 === (op.fold.to === 'front') ? Math.PI * u : -Math.PI * u;
      const z = (cur.layer + (next.layer - cur.layer) * u) * LAYER;
      return {
        pts: p.poly.map((q) => {
          const [x, y] = ap(cur.m, q);
          const r = turn([x, y, 0], o, d, a);
          return [r[0], r[1], r[2] + z] as V3;
        }),
      };
    }
    return { pts: p.poly.map((q) => flat3(cur, q)) };
  });
}

/** The printed side's direction for a posed piece (the sheet's pieces are counterclockwise, printed side toward you). */
export function normalOf(pose: Pose, poly: V2[]): V3 {
  const [a, b, c] = pose.pts;
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const ccw = poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0) > 0 ? 1 : -1;
  const len = Math.hypot(...n) || 1;
  return [(ccw * n[0]) / len, (ccw * n[1]) / len, (ccw * n[2]) / len];
}

// ---- the camera ----
export type View = { yaw: number; pitch: number };
/** The camera at a position: a little from the right and above; turned round for the back; from below at the end, to show the hole. */
export function viewAt(pos: number): View {
  const turnOver = smooth(clamp01(pos - 6));
  const end = smooth(clamp01(pos - 10));
  return { yaw: 0.32 + Math.PI * turnOver + 0.5 * end, pitch: 0.3 - 0.95 * end };
}
/** A model point seen from `view` (orthographic): [screen x, screen y (down), nearness]. */
export function toView(p: V3, view: View): V3 {
  const cy = Math.cos(view.yaw);
  const sy = Math.sin(view.yaw);
  const x1 = p[0] * cy - p[2] * sy;
  const z1 = p[0] * sy + p[2] * cy;
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  return [x1, -(p[1] * cp - z1 * sp), z1 * cp + p[1] * sp];
}

/** 0 to 1: how much of the pre-crease lines are drawn (step 1); they fade as the square collapses. */
export const creaseAt = (pos: number): number => clamp01(pos) * (1 - clamp01((pos - 1) * 3));
/** 0 to 1: the tuck close-up (step 6): the view zooms in on the right-hand pocket. */
export const tuckFocusAt = (pos: number): number => clamp01((pos - 5) * 2) * (1 - clamp01((pos - 6) * 2.5));
/** The point the close-up zooms in on (the right-hand pocket of the front). */
export const FOCUS: V3 = [0.07, -0.19, 0];
