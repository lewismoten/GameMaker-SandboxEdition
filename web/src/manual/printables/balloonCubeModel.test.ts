// The balloon cube's fold model (balloonCubeModel.ts): the traditional waterbomb folded step by step on the simulated sheet, then blown
// up. These check that no fold tears the paper, that each face region of the printed square ends up as the outer layer of its face with
// the printing outward, that the tucks end inside the pockets, and that every bit of paper is accounted for. Paper is idealized (no
// thickness, no crumpling where the real cube's corners bunch up), so a test print is still the last word.
import { describe, expect, it } from 'vitest';
import { ap, area, centroid, facing, type V2, type V3 } from './balloonCubeSim';
import {
  FACE_FRAME,
  FACE_REGIONS,
  L,
  OPPOSITE,
  OPS,
  PIECES,
  PLACEMENTS,
  PRECREASES,
  TUCKS,
  cubeMap,
  inside,
  pieceAt,
  toCube,
  type FaceId,
  type FoldedPiece,
} from './balloonCubeModel';

const H = L / 2;
const close3 = (a: V3, b: V3, tol = 1e-9) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < tol;
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const onSegment = (a: V2, b: V2, p: V2) => {
  const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const d = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  return Math.abs(cr) < 1e-12 && d >= -1e-12 && d <= (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + 1e-12;
};
const onBoundary = (poly: V2[], p: V2) => poly.some((a, i) => onSegment(a, poly[(i + 1) % poly.length], p));
const strictly = (poly: V2[], p: V2) => {
  const s = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  });
  return s.every((v) => v > 1e-12) || s.every((v) => v < -1e-12);
};

/** Where a sheet point of a piece is on the cube. */
function cubePoint(p: FoldedPiece, s: V2): V3 {
  const { a1, a2, q0, c0 } = cubeMap(p);
  const d = [s[0] - q0[0], s[1] - q0[1]];
  return [0, 1, 2].map((i) => c0[i] + a1[i] * d[0] + a2[i] * d[1]) as V3;
}
/** The sheet point of a piece that lands on a cube point. */
function sheetPoint(p: FoldedPiece, c: V3): V2 {
  const { a1, a2, q0, c0 } = cubeMap(p);
  const d: V3 = [c[0] - c0[0], c[1] - c0[1], c[2] - c0[2]];
  return [q0[0] + dot(a1, d), q0[1] + dot(a2, d)];
}
/** The face a piece lies on at the end, or undefined. */
const faceOf = (p: FoldedPiece): FaceId | undefined =>
  (Object.keys(FACE_FRAME) as FaceId[]).find((f) => p.cube.every((c) => Math.abs(dot(c, FACE_FRAME[f].n) - H) < 1e-9));
/** A point on a face, from face coordinates a (along its art's right) and b (along its up). */
const facePoint = (f: FaceId, a: number, b: number): V3 => {
  const { n, right, up } = FACE_FRAME[f];
  return [0, 1, 2].map((i) => n[i] * H + right[i] * a + up[i] * b) as V3;
};
const faceCoords = (f: FaceId, c: V3): V2 => [dot(c, FACE_FRAME[f].right), dot(c, FACE_FRAME[f].up)];
/** How far out a piece is in its stack on the cube: bigger is nearer the outside. */
const outness = (p: FoldedPiece) => p.hist[p.hist.length - 1].layer * p.stack;
/** The pieces that cover a point of a face, outermost first. */
const stackAt = (f: FaceId, c: V3): FoldedPiece[] =>
  PIECES.filter(
    (p) =>
      faceOf(p) === f &&
      strictly(
        p.cube.map((q) => faceCoords(f, q)),
        faceCoords(f, c),
      ),
  ).sort((a, b) => outness(b) - outness(a));

// sample points on a face, kept off the cube's diagonals and the creases through its middle
const SAMPLES: V2[] = [];
for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) SAMPLES.push([((i + 0.5) / 9 - 0.5) * L * 0.999 + 0.0007, ((j + 0.5) / 9 - 0.5) * L * 0.999 - 0.0003]);

describe('balloon cube: the waterbomb fold', () => {
  it('cuts the sheet into pieces that tile it with no gaps or overlaps', () => {
    expect(PIECES.reduce((s, p) => s + area(p.poly), 0)).toBeCloseTo(1, 12);
    for (let i = 0; i < 40; i++) {
      for (let j = 0; j < 40; j++) {
        const pt: V2 = [(i + 0.5) / 40 - 0.5 + 0.0003, (j + 0.5) / 40 - 0.5 - 0.0002];
        expect(PIECES.filter((p) => strictly(p.poly, pt))).toHaveLength(1);
      }
    }
  });

  it('collapses into the waterbomb base: a triangle pointing up from the middle of the sheet, four layers everywhere', () => {
    for (const p of PIECES) {
      for (const q of p.poly) {
        const [x, y] = ap(p.hist[0].m, q);
        expect(y).toBeLessThanOrEqual(1e-12);
        expect(y).toBeGreaterThanOrEqual(-0.5 - 1e-12);
        expect(Math.abs(x)).toBeLessThanOrEqual(-y + 1e-12);
      }
    }
    const total = PIECES.reduce((s, p) => s + area(p.poly.map((q) => ap(p.hist[0].m, q))), 0);
    expect(total).toBeCloseTo(1, 12); // four layers of a triangle a quarter of the sheet
  });

  it('never tears the paper: at every step, pieces that touch on the sheet touch in the fold', () => {
    for (let k = 0; k < OPS.length; k++) {
      for (const p of PIECES) {
        for (const v of p.poly) {
          const here = ap(p.hist[k].m, v);
          for (const q of PIECES) {
            if (q === p || !onBoundary(q.poly, v)) continue;
            const there = ap(q.hist[k].m, v);
            expect(Math.hypot(here[0] - there[0], here[1] - there[1]), `after ${OPS[k].name}, at ${v.join(',')}`).toBeLessThan(1e-9);
          }
        }
      }
    }
  });

  it('ends flat in the traditional shape: a square face on each side with a point above and below', () => {
    const last = OPS.length - 1;
    for (const p of PIECES) {
      for (const q of p.poly) {
        const [x, y] = ap(p.hist[last].m, q);
        expect(Math.abs(x)).toBeLessThanOrEqual(H + 1e-12);
        expect(Math.abs(x)).toBeLessThanOrEqual(Math.min(-y, y + 0.5) + 1e-12); // the points at the top (the sheet's middle) and bottom (the hole)
      }
    }
  });

  it('opens into a cube without tearing or stretching: every piece lands flat on a face', () => {
    for (const p of PIECES) {
      const { a1, a2 } = cubeMap(p);
      expect(dot(a1, a1)).toBeCloseTo(1, 9);
      expect(dot(a2, a2)).toBeCloseTo(1, 9);
      expect(dot(a1, a2)).toBeCloseTo(0, 9);
      expect(faceOf(p)).toBeDefined();
      p.poly.forEach((v, i) => expect(close3(cubePoint(p, v), p.cube[i])).toBe(true));
      for (const v of p.poly) for (const q of PIECES) if (q !== p && onBoundary(q.poly, v)) expect(close3(cubePoint(p, v), cubePoint(q, v))).toBe(true);
    }
  });

  it('puts the middle of the sheet in the middle of the face opposite the hole, and all four edge midpoints at the hole', () => {
    const at = (s: V2) => PIECES.filter((p) => p.poly.some((v) => Math.hypot(v[0] - s[0], v[1] - s[1]) < 1e-12)).map((p) => cubePoint(p, s));
    for (const c of at([0, 0])) expect(close3(c, [0, H, 0])).toBe(true);
    for (const m of [
      [0.5, 0],
      [-0.5, 0],
      [0, 0.5],
      [0, -0.5],
    ] as V2[]) {
      const cs = at(m);
      expect(cs.length).toBeGreaterThan(0);
      for (const c of cs) expect(close3(c, [0, -H, 0])).toBe(true);
    }
  });

  it('shows each face, all over, as the outer layer from its own region of the sheet, printing outward and the art the right way round', () => {
    for (const f of Object.keys(FACE_FRAME) as FaceId[]) {
      for (const [a, b] of SAMPLES) {
        const c = facePoint(f, a, b);
        const stack = stackAt(f, c);
        expect(stack.length, `${f} at ${a},${b}`).toBeGreaterThan(0);
        // the layers there all come from one stack (or are the one swung-out side layer)
        expect(new Set(stack.map((p) => p.swing)).size).toBe(1);
        const top = stack[0];
        if (stack.length > 1) expect(outness(stack[0])).toBeGreaterThan(outness(stack[1]));
        const s = sheetPoint(top, c);
        const pl = PLACEMENTS.filter((p) => p.face === f && inside(p.clip, s));
        expect(pl.length, `${f}: sheet point ${s.join(',')} is not in that face's printed region`).toBeGreaterThan(0);
        const { a1, a2 } = cubeMap(top);
        expect(close3(cross(a1, a2), FACE_FRAME[f].n)).toBe(true); // the printed side faces out
        expect(close3(toCube(pl[0], s), c)).toBe(true); // and the art drawn there is where the fold puts it
      }
    }
  });

  it('keeps every face region of the printed square on the outside of its face', () => {
    for (const r of FACE_REGIONS) {
      const c0 = centroid(r.clip);
      for (const t of [0, 0.3, 0.6, 0.9]) {
        for (const v of r.clip) {
          const s: V2 = [c0[0] + (v[0] - c0[0]) * t + 0.0001, c0[1] + (v[1] - c0[1]) * t - 0.0002];
          const p = pieceAt(s)!;
          expect(p).toBeDefined();
          expect(faceOf(p)).toBe(r.face);
          expect(stackAt(r.face, cubePoint(p, s))[0]).toBe(p);
        }
      }
    }
    for (const f of Object.keys(FACE_FRAME)) {
      expect(FACE_REGIONS.filter((r) => r.face === f).reduce((s, r) => s + area(r.clip), 0)).toBeCloseTo(L * L, 12);
    }
  });

  it('ends each tuck inside its pocket: within the side triangle, under its outer layers and over its inner ones', () => {
    const tucked = PIECES.filter((p) => p.tags.has('T'));
    expect(tucked.reduce((s, p) => s + area(p.poly), 0)).toBeCloseTo(
      TUCKS.reduce((s, t) => s + area(t), 0),
      12,
    );
    for (const p of tucked) {
      expect(TUCKS.some((t) => inside(t, centroid(p.poly)))).toBe(true);
      const f = faceOf(p)!;
      expect(f === 'se' || f === 'nw').toBe(true);
      // geometrically inside one of that face's two side triangles (the side points folded in)
      const sides = PLACEMENTS.filter((q) => q.face === f && Math.abs(Math.abs(q.sheet.o[0]) - 0.25) < 1e-9);
      expect(sides).toHaveLength(2);
      const tris = sides.map((q) => q.clip.map((v) => faceCoords(f, toCube(q, v))));
      expect(tris.some((t) => p.cube.every((c) => inside(t, faceCoords(f, c), 1e-9)))).toBe(true);
      // and between its layers: the side triangle's outer layers over it, its inner layers (the corner folded up) under it
      const c = p.cube.reduce((s, v) => [s[0] + v[0] / p.cube.length, s[1] + v[1] / p.cube.length, s[2] + v[2] / p.cube.length] as V3, [0, 0, 0] as V3);
      const flap = [...p.tags].find((t) => /^[fb][rl]$/.test(t))!;
      const side = stackAt(f, c).filter((q) => q.tags.has(flap) && q.tags.has('R'));
      expect(side.some((q) => !q.tags.has('F') && outness(q) > outness(p))).toBe(true);
      expect(side.some((q) => q.tags.has('F') && outness(q) < outness(p))).toBe(true);
    }
  });

  it('accounts for every bit of paper: six faces, four tucks, and the rest hidden inside', () => {
    let faces = 0;
    let tucks = 0;
    let hidden = 0;
    for (const p of PIECES) {
      const c = centroid(p.poly);
      const a = area(p.poly);
      if (FACE_REGIONS.some((r) => inside(r.clip, c))) faces += a;
      else if (TUCKS.some((t) => inside(t, c))) tucks += a;
      else {
        hidden += a;
        expect(stackAt(faceOf(p)!, cubePoint(p, c))[0]).not.toBe(p); // something lies over it on the cube
      }
    }
    expect(faces).toBeCloseTo(6 * L * L, 12);
    expect(tucks).toBeCloseTo(1 / 8, 12);
    expect(hidden).toBeCloseTo(1 / 2, 12);
  });

  it('marks the pre-creases the way they fold, seen from the printed side', () => {
    for (const c of PRECREASES) {
      for (const t of [0.15, 0.35, 0.65, 0.85]) {
        const p: V2 = [c.a[0] + (c.b[0] - c.a[0]) * t, c.a[1] + (c.b[1] - c.a[1]) * t];
        const n: V2 = [-(c.b[1] - c.a[1]) * 0.001, (c.b[0] - c.a[0]) * 0.001];
        const [one, two] = [pieceAt([p[0] + n[0], p[1] + n[1]])!, pieceAt([p[0] - n[0], p[1] - n[1]])!];
        const [f1, f2] = [facing(one.hist[0].m), facing(two.hist[0].m)];
        expect(f1).toBe(-f2); // folded flat in the base
        // mountain: the half whose printing faces you lies in front, so the printing is on the outside of the fold
        const front = one.hist[0].layer > two.hist[0].layer ? f1 : f2;
        expect(front > 0 ? 'mountain' : 'valley').toBe(c.kind);
      }
    }
  });

  it('pairs opposite faces', () => {
    for (const [a, b] of Object.entries(OPPOSITE)) {
      expect(OPPOSITE[b]).toBe(a);
      expect(dot(FACE_FRAME[a as FaceId].n, FACE_FRAME[b].n)).toBe(-1);
    }
  });
});
