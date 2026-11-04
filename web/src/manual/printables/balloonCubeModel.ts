// The balloon cube's fold, as plain geometry with no drawing: which part of the square sheet becomes which face of the cube.
// The sheet is a unit square centered on the origin (u right, v up, printed side toward you). The cube stands on `bottom` (the sheet's
// center), with the four side faces folded up away from you (every cube edge is a mountain fold, so the printing is on the outside) and
// the four paper corners folded over the top, their right angles meeting at the middle of the lid, where the blow hole is.
//   - bottom: the diamond |u|+|v| <= 1/4; each side face: a diamond of the same size centered at (+-1/4, +-1/4);
//   - lid: the four corner triangles (legs 1/4), their hypotenuses on the top edges of the side faces;
//   - tucks: four triangles on the edge midpoints (legs 1/4), each folded in half inward between two side faces (a valley fold).
// Each face is a square of side L = 1 / (2 sqrt 2) (diagonal 1/2); the six cube faces use 6/8 of the sheet, the tucks 1/4 of it.
// `PLACEMENTS` put the printed art on both the sheet and the cube; balloonCubeModel.test.ts checks that they agree.
export type FaceId = 'top' | 'bottom' | 'ne' | 'nw' | 'sw' | 'se';
export type V2 = [number, number];
export type V3 = [number, number, number];

/** The cube's edge, in sheet units (the sheet's side is 1). */
export const L = 1 / (2 * Math.SQRT2);
const S = Math.SQRT1_2;

/** A flat piece of art's frame: its center and its right and up directions, as unit vectors. */
export interface Frame2 {
  o: V2;
  right: V2;
  up: V2;
}
export interface Frame3 {
  o: V3;
  right: V3;
  up: V3;
}
/** One piece of sheet that becomes (part of) a face; `clip` is its outline. The lid comes in four pieces, one per corner. */
export interface Placement {
  face: FaceId;
  clip: V2[];
  sheet: Frame2;
  cube: Frame3;
}

const diamond = (cx: number, cy: number, r = 0.25): V2[] => [
  [cx + r, cy],
  [cx, cy + r],
  [cx - r, cy],
  [cx, cy - r],
];

const side = (face: FaceId, c: V2, up: V2, cube: Frame3): Placement => ({
  face,
  clip: diamond(c[0], c[1]),
  sheet: { o: c, up, right: [up[1], -up[0]] },
  cube,
});

const corner = (c: V2, spin: 0 | 180): Placement => {
  const k = spin === 180 ? -1 : 1;
  const sx = -Math.sign(c[0]); // the legs run into the sheet
  const sy = -Math.sign(c[1]);
  return {
    face: 'top',
    clip: [c, [c[0] + sx * 0.25, c[1]], [c[0], c[1] + sy * 0.25]],
    sheet: { o: c, right: [k * S, -k * S], up: [k * S, k * S] },
    cube: { o: [0, 0, L], right: [0, -1, 0], up: [1, 0, 0] },
  };
};

/** Every piece of the sheet that shows on the cube. Cube coordinates: x, y along the base, z up, the lid at z = L. */
export const PLACEMENTS: Placement[] = [
  { face: 'bottom', clip: diamond(0, 0), sheet: { o: [0, 0], right: [1, 0], up: [0, 1] }, cube: { o: [0, 0, 0], right: [S, S, 0], up: [S, -S, 0] } },
  side('ne', [0.25, 0.25], [S, S], { o: [L / 2, 0, L / 2], right: [0, 1, 0], up: [0, 0, 1] }),
  side('nw', [-0.25, 0.25], [-S, S], { o: [0, -L / 2, L / 2], right: [1, 0, 0], up: [0, 0, 1] }),
  side('sw', [-0.25, -0.25], [-S, -S], { o: [-L / 2, 0, L / 2], right: [0, -1, 0], up: [0, 0, 1] }),
  side('se', [0.25, -0.25], [S, -S], { o: [0, L / 2, L / 2], right: [-1, 0, 0], up: [0, 0, 1] }),
  corner([0.5, 0.5], 180),
  corner([0.5, -0.5], 0),
  corner([-0.5, -0.5], 180),
  corner([-0.5, 0.5], 0),
];

/** The four tucks: triangles on the edge midpoints that fold in half, inside the cube. */
export const TUCKS: V2[][] = [
  [[0.25, 0], [0.5, 0.25], [0.5, -0.25]],
  [[-0.25, 0], [-0.5, 0.25], [-0.5, -0.25]],
  [[0, 0.25], [0.25, 0.5], [-0.25, 0.5]],
  [[0, -0.25], [0.25, -0.5], [-0.25, -0.5]],
];

export interface Crease {
  kind: 'mountain' | 'valley';
  a: V2;
  b: V2;
}
/** The creases, in the sheet's own coordinates: mountains (the cube's 12 edges; the 4 vertical ones are creased on both sides of a tuck) and 4 valleys (the tucks' middles). */
export const CREASES: Crease[] = (() => {
  const out: Crease[] = [];
  const m = (a: V2, b: V2) => out.push({ kind: 'mountain', a, b });
  // the bottom's four edges and the top's four edges
  for (const [sx, sy] of [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    m([sx * 0.25, 0], [0, sy * 0.25]);
    m([sx * 0.5, sy * 0.25], [sx * 0.25, sy * 0.5]);
  }
  for (const t of TUCKS) {
    m(t[0], t[1]);
    m(t[0], t[2]);
    out.push({ kind: 'valley', a: t[0], b: [(t[1][0] + t[2][0]) / 2, (t[1][1] + t[2][1]) / 2] });
  }
  return out;
})();

/** Where a sheet point of a placement lands on the cube. */
export function toCube(p: Placement, pt: V2): V3 {
  const dx = pt[0] - p.sheet.o[0];
  const dy = pt[1] - p.sheet.o[1];
  const r = dx * p.sheet.right[0] + dy * p.sheet.right[1];
  const u = dx * p.sheet.up[0] + dy * p.sheet.up[1];
  return [0, 1, 2].map((i) => p.cube.o[i] + r * p.cube.right[i] + u * p.cube.up[i]) as V3;
}

/** Opposite faces of the cube. */
export const OPPOSITE: Record<FaceId, FaceId> = { top: 'bottom', bottom: 'top', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw' };
