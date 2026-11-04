// The balloon cube's fold model (balloonCubeModel.ts): the pieces tile the sheet, every face is one square of the cube, and the pieces
// agree wherever they meet. This checks the geometry's own consistency; that real paper folds this way was not tested here.
import { describe, expect, it } from 'vitest';
import { CREASES, L, OPPOSITE, PLACEMENTS, TUCKS, toCube, type Placement, type V2, type V3 } from './balloonCubeModel';

const area = (poly: V2[]) => Math.abs(poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0)) / 2;
const near = (a: V3, b: V3) => expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-9);
const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
const at = (face: string, i = 0): Placement => PLACEMENTS.filter((p) => p.face === face)[i];

describe('balloon cube fold', () => {
  it('tiles the sheet: faces and tucks add up to the whole square', () => {
    expect(PLACEMENTS.reduce((s, p) => s + area(p.clip), 0)).toBeCloseTo(6 / 8, 12);
    expect(TUCKS.reduce((s, t) => s + area(t), 0)).toBeCloseTo(1 / 4, 12);
    for (const face of ['top', 'bottom', 'ne', 'nw', 'sw', 'se']) {
      expect(PLACEMENTS.filter((p) => p.face === face).reduce((s, p) => s + area(p.clip), 0)).toBeCloseTo(L * L, 12);
    }
  });

  it('maps every piece onto the cube without stretching it', () => {
    for (const p of PLACEMENTS) {
      for (let i = 0; i < p.clip.length; i++) {
        const j = (i + 1) % p.clip.length;
        expect(dist(toCube(p, p.clip[i]), toCube(p, p.clip[j]))).toBeCloseTo(dist(p.clip[i], p.clip[j]), 9);
      }
    }
  });

  it('puts every vertex on a corner of the cube (or the middle of the lid)', () => {
    const h = L / 2;
    for (const p of PLACEMENTS) {
      for (const v of p.clip) {
        const [x, y, z] = toCube(p, v);
        const middle = Math.abs(x) + Math.abs(y) < 1e-9 && Math.abs(z - L) < 1e-9;
        const cornerOfCube = Math.abs(Math.abs(x) - h) < 1e-9 && Math.abs(Math.abs(y) - h) < 1e-9 && (Math.abs(z) < 1e-9 || Math.abs(z - L) < 1e-9);
        expect(middle || cornerOfCube).toBe(true);
      }
    }
  });

  it('agrees where pieces meet: shared sheet points land on the same cube points', () => {
    // the bottom and each side: the center diamond's four edges
    near(toCube(at('bottom'), [0.125, 0.125]), toCube(at('ne'), [0.125, 0.125]));
    near(toCube(at('bottom'), [-0.125, 0.125]), toCube(at('nw'), [-0.125, 0.125]));
    near(toCube(at('bottom'), [-0.125, -0.125]), toCube(at('sw'), [-0.125, -0.125]));
    near(toCube(at('bottom'), [0.125, -0.125]), toCube(at('se'), [0.125, -0.125]));
    // each side's top edge and the lid corner triangle on its outer edge
    near(toCube(at('ne'), [0.375, 0.375]), toCube(at('top', 0), [0.375, 0.375]));
    near(toCube(at('se'), [0.375, -0.375]), toCube(at('top', 1), [0.375, -0.375]));
    near(toCube(at('sw'), [-0.375, -0.375]), toCube(at('top', 2), [-0.375, -0.375]));
    near(toCube(at('nw'), [-0.375, 0.375]), toCube(at('top', 3), [-0.375, 0.375]));
    // neighbors meet at a tuck: both sides' ends of the vertical edge are one cube edge, bottom corner and top corner
    near(toCube(at('ne'), [0.25, 0]), toCube(at('se'), [0.25, 0]));
    near(toCube(at('ne'), [0.5, 0.25]), toCube(at('se'), [0.5, -0.25]));
    near(toCube(at('nw'), [-0.25, 0]), toCube(at('sw'), [-0.25, 0]));
    near(toCube(at('nw'), [-0.5, 0.25]), toCube(at('sw'), [-0.5, -0.25]));
    near(toCube(at('ne'), [0, 0.25]), toCube(at('nw'), [0, 0.25]));
    near(toCube(at('ne'), [0.25, 0.5]), toCube(at('nw'), [-0.25, 0.5]));
    near(toCube(at('se'), [0, -0.25]), toCube(at('sw'), [0, -0.25]));
    near(toCube(at('se'), [0.25, -0.5]), toCube(at('sw'), [-0.25, -0.5]));
    // the lid's corner triangles meet along the paper edges: their legs run to the same top corner
    near(toCube(at('top', 0), [0.5, 0.25]), toCube(at('top', 1), [0.5, -0.25]));
    near(toCube(at('top', 1), [0.25, -0.5]), toCube(at('top', 2), [-0.25, -0.5]));
    near(toCube(at('top', 2), [-0.5, -0.25]), toCube(at('top', 3), [-0.5, 0.25]));
    near(toCube(at('top', 3), [-0.25, 0.5]), toCube(at('top', 0), [0.25, 0.5]));
    // all four paper corners meet at the middle of the lid
    for (const p of PLACEMENTS.filter((q) => q.face === 'top')) near(toCube(p, p.sheet.o), [0, 0, L]);
  });

  it('puts each face art frame on its own face, facing outward and not mirrored', () => {
    const outward: Record<string, V3> = { top: [0, 0, 1], bottom: [0, 0, -1], ne: [1, 0, 0], nw: [0, -1, 0], sw: [-1, 0, 0], se: [0, 1, 0] };
    for (const p of PLACEMENTS) {
      const { right, up } = p.cube;
      const n: V3 = [right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]];
      near(n, outward[p.face]); // right x up points out of the cube: the art reads correctly from outside
      // the sheet frame is a proper rotation (not mirrored)
      expect(p.sheet.right[0] * p.sheet.up[1] - p.sheet.right[1] * p.sheet.up[0]).toBeCloseTo(1, 12);
    }
  });

  it('has the cube edges as mountains and the four tuck middles as valleys', () => {
    expect(CREASES.filter((c) => c.kind === 'mountain')).toHaveLength(16); // 4 + 4 + the 4 vertical edges, each creased on both sides of its tuck
    expect(CREASES.filter((c) => c.kind === 'valley')).toHaveLength(4);
  });

  it('pairs opposite faces', () => {
    for (const [a, b] of Object.entries(OPPOSITE)) expect(OPPOSITE[b as keyof typeof OPPOSITE]).toBe(a);
  });
});
