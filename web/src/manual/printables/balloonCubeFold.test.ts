// The balloon cube's fold steps (balloonCubeFold.ts): each step of the animation ends exactly where the fold model puts the paper, the
// motion in between never tears it, and the last step is the blown-up cube with every face region outside on its own face.
import { describe, expect, it } from 'vitest';
import { ap, type V2, type V3 } from './balloonCubeSim';
import { FACE_FRAME, FACE_REGIONS, L, OPS, PIECES, inside } from './balloonCubeModel';
import { LAST, STEPS, collapsePoint, isFace, normalOf, phiOf, poseAt, stepAt, toView } from './balloonCubeFold';

const near2 = (a: V3, b: V2, tol = 1e-9) => Math.hypot(a[0] - b[0], a[1] - b[1]) < tol;
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const onSegment = (a: V2, b: V2, p: V2) => {
  const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const d = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  return Math.abs(cr) < 1e-12 && d >= -1e-12 && d <= (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + 1e-12;
};
/** For a pose, the farthest apart two pieces' copies of a shared sheet point are. */
function worstTear(pos: number): number {
  const poses = poseAt(pos);
  let worst = 0;
  PIECES.forEach((p, i) => {
    p.poly.forEach((v, j) => {
      PIECES.forEach((q, k) => {
        if (k === i) return;
        const e = q.poly.findIndex((a, n) => onSegment(a, q.poly[(n + 1) % q.poly.length], v));
        if (e < 0) return;
        // the same sheet point on q: interpolate along q's edge
        const a = q.poly[e];
        const b = q.poly[(e + 1) % q.poly.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const t = Math.hypot(v[0] - a[0], v[1] - a[1]) / len;
        const pa = poses[k].pts[e];
        const pb = poses[k].pts[(e + 1) % q.poly.length];
        const there: V3 = [0, 1, 2].map((n) => pa[n] + (pb[n] - pa[n]) * t) as V3;
        worst = Math.max(worst, dist(poses[i].pts[j], there));
      });
    });
  });
  return worst;
}

describe('balloon cube fold steps', () => {
  it('has a flat start, one fold or move per step and a caption for each', () => {
    expect(STEPS).toHaveLength(12);
    expect(LAST).toBe(11);
    for (const s of STEPS) expect(s.caption.length).toBeGreaterThan(20);
    for (const op of OPS) expect(op.step).toBeGreaterThan(1); // steps 0 and 1 are the flat square (the creases are only drawn)
    expect(stepAt(0)).toEqual({ step: 0, t: 1 });
    expect(stepAt(2.5)).toEqual({ step: 3, t: 0.5 });
  });

  it('starts as the flat square and ends each step where the fold model puts every piece', () => {
    for (const pos of [0, 1]) poseAt(pos).forEach((ps, i) => PIECES[i].poly.forEach((q, j) => expect(near2(ps.pts[j], q)).toBe(true)));
    for (let step = 2; step < LAST; step++) {
      const last = OPS.reduce((k, op, i) => (op.step <= step ? i : k), -1);
      poseAt(step).forEach((ps, i) => PIECES[i].poly.forEach((q, j) => expect(near2(ps.pts[j], ap(PIECES[i].hist[last].m, q))).toBe(true)));
    }
  });

  it('ends on the blown-up cube, with every face region on the outside of its face', () => {
    const end = poseAt(LAST);
    PIECES.forEach((p, i) => p.cube.forEach((c, j) => expect(dist(end[i].pts[j], [c[0], c[1] - L, c[2]])).toBeLessThan(1e-9)));
    PIECES.forEach((p, i) => {
      if (!isFace(p)) return;
      const r = FACE_REGIONS.find((f) => inside(f.clip, p.poly[0]) && inside(f.clip, p.poly[1]) && inside(f.clip, p.poly[2]))!;
      const n = normalOf(end[i], p.poly);
      expect(dist(n, FACE_FRAME[r.face].n)).toBeLessThan(1e-9);
    });
  });

  it('collapses with the side quarters meeting the top quarter all the way down', () => {
    expect(phiOf(0)).toBe(0);
    expect(phiOf(Math.PI)).toBe(Math.PI);
    for (const theta of [0.3, 1, Math.PI / 2, 2.4, 3]) {
      // the right edge midpoint is in two eighths: both copies of it agree
      expect(dist(collapsePoint('E-', [0.5, 0], theta), collapsePoint('E+', [0.5, 0], theta))).toBeLessThan(1e-12);
      expect(dist(collapsePoint('W-', [-0.5, 0], theta), collapsePoint('W+', [-0.5, 0], theta))).toBeLessThan(1e-12);
      // a corner too
      expect(dist(collapsePoint('E+', [0.5, 0.5], theta), collapsePoint('N+', [0.5, 0.5], theta))).toBeLessThan(1e-12);
    }
  });

  it('never tears the paper while folding: shared points stay together within the drawn paper thickness', () => {
    for (let pos = 1.25; pos <= LAST; pos += 0.25) expect(worstTear(pos), `at ${pos}`).toBeLessThan(0.03);
    for (let step = 2; step <= LAST; step++) expect(worstTear(step), `end of step ${step}`).toBeLessThan(1e-9 + 0.025);
  });
});

describe('balloon cube view direction', () => {
  it('turns the front face left as yaw grows, which is why the fold view negates the drag yaw', () => {
    const front: V3 = [0, 0, 1];
    expect(toView(front, { yaw: 0.3, pitch: 0 })[0]).toBeLessThan(0);
    // the fold view passes -cam.yaw: a drag to the right (cam.yaw > 0) moves the front face right
    expect(toView(front, { yaw: -0.3, pitch: 0 })[0]).toBeGreaterThan(0);
  });
});
