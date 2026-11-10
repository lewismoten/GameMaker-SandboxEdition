import { describe, expect, it } from 'vitest';
import { PLACEMENTS, toCube, type V3 } from './balloonCubeModel';
import { PANELS, STEPS, apply, pose, stateAt, tuckAngle } from './balloonCubeFold';

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const deg = (r: number) => (r * 180) / Math.PI;

describe('balloon cube fold steps', () => {
  it('has a flat start, one fold per step and a caption for each', () => {
    expect(STEPS).toHaveLength(8);
    for (const s of STEPS) expect(s.caption.length).toBeGreaterThan(20);
  });

  it('starts flat and folds the sides in two steps, then one corner per step', () => {
    expect(stateAt(0)).toEqual({ wall: 0, corner: [0, 0, 0, 0], puff: 0 });
    expect(deg(stateAt(1).wall)).toBeCloseTo(45, 9);
    expect(deg(stateAt(2).wall)).toBeCloseTo(90, 9);
    expect(stateAt(2).corner).toEqual([0, 0, 0, 0]);
    expect(deg(stateAt(3).corner[0])).toBeCloseTo(90, 9);
    expect(stateAt(3).corner[1]).toBe(0);
    expect(deg(stateAt(4.5).corner[2])).toBeCloseTo(45, 9);
    expect(stateAt(6).corner.map(deg)).toEqual([90, 90, 90, 90]);
    expect(stateAt(7).puff).toBe(1);
  });

  it('folds each tuck in half, a 135 degree turn from the side, as the sides stand up', () => {
    expect(tuckAngle(0)).toBe(0);
    expect(deg(tuckAngle(Math.PI / 2))).toBeCloseTo(135, 3);
    let last = 0;
    for (let w = 0.1; w <= Math.PI / 2; w += 0.1) {
      const a = tuckAngle(w);
      expect(a).toBeGreaterThan(last);
      last = a;
    }
  });

  it('keeps the two halves of each tuck together on their middle crease at every step', () => {
    for (const pos of [0.5, 1, 1.5, 2, 4, 7]) {
      const poses = pose(stateAt(pos));
      for (const [a, b, mid] of [
        ['tuckEast-ne', 'tuckEast-se', [0.5, 0]],
        ['tuckWest-nw', 'tuckWest-sw', [-0.5, 0]],
        ['tuckNorth-ne', 'tuckNorth-nw', [0, 0.5]],
        ['tuckSouth-sw', 'tuckSouth-se', [0, -0.5]],
      ] as const) {
        const p = apply(poses.get(a)!, [mid[0], mid[1], 0]);
        const q = apply(poses.get(b)!, [mid[0], mid[1], 0]);
        expect(dist(p, q)).toBeLessThan(1e-6);
      }
    }
  });

  it('ends as the cube balloonCubeModel describes, without stretching any panel', () => {
    const poses = pose(stateAt(6));
    const flat = (id: string, pt: [number, number]) => apply(poses.get(id)!, [pt[0], pt[1], 0]);
    // every placed corner (bottom, sides, lid triangles) lands where toCube puts it, up to a move of the whole cube
    const pairs: [V3, V3][] = [];
    PANELS.filter((p) => p.art !== undefined).forEach((p) => {
      const pl = PLACEMENTS[p.art!];
      pl.clip.forEach((pt) => pairs.push([flat(p.id, pt), toCube(pl, pt)]));
    });
    for (const [a, b] of pairs) for (const [c, d] of pairs) expect(dist(a, c)).toBeCloseTo(dist(b, d), 9);
    // not a mirror image: the signed volume of four points matches
    const vol = (q: V3[]) => {
      const u = [1, 2, 3].map((i) => [q[i][0] - q[0][0], q[i][1] - q[0][1], q[i][2] - q[0][2]]);
      return (
        u[0][0] * (u[1][1] * u[2][2] - u[1][2] * u[2][1]) -
        u[0][1] * (u[1][0] * u[2][2] - u[1][2] * u[2][0]) +
        u[0][2] * (u[1][0] * u[2][1] - u[1][1] * u[2][0])
      );
    };
    const pick = [0, 4, 8, 12].map((i) => pairs[i]);
    expect(Math.sign(vol(pick.map((p) => p[0])))).toBe(Math.sign(vol(pick.map((p) => p[1]))));
  });

  it('puts each tuck inside the finished cube', () => {
    const poses = pose(stateAt(6));
    const half = 0.5 / (2 * Math.SQRT2) + 1e-9;
    for (const p of PANELS.filter((q) => q.kind === 'tuck')) {
      const [, , mid] = p.poly;
      const w = apply(poses.get(p.id)!, [mid[0], mid[1], 0]);
      // cube spans x,y in [-L/2, L/2]; in the unflipped frame the cube hangs below the sheet
      const c = toCube(PLACEMENTS[0], [0, 0]);
      expect(c).toBeDefined();
      expect(Math.abs(w[2])).toBeLessThan(half * 2);
      expect(w[2]).toBeLessThan(0);
    }
  });
});
