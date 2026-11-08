// Final Curtain's Stage Box as a 3D model (texturedGl.ts): the assembled outer box, six plywood panels of the sizes the kit's
// manifest lists (games/sleuth/laser/stageBoxDims.ts made them) at the material's thickness, glued as the kit says: front and
// back between nothing, side walls between them, the lid and the base between the walls. The faces carry the engraving, cropped
// from each panel's place on the sheet's preview picture. The mechanism inside (the plates and the drawer) is not drawn: this
// is the box as it looks closed. The frame is trinketGl.ts's: z up, the front (the proscenium arch) faces +y.
import { tri } from './coinModel';
import type { LaserSheet } from './laserKits';
import type { TexPiece } from './texturedGl';

const WOOD: [number, number, number] = [0.86, 0.68, 0.46];

type V3 = [number, number, number];
type Face = 'x+' | 'x-' | 'y+' | 'y-' | 'z+' | 'z-';

export interface BoxSize {
  /** Width (x), depth (y), height (z) of the closed box, in mm. */
  w: number;
  d: number;
  h: number;
  /** The plywood's thickness. */
  t: number;
}

/** The closed box's size from the parts the first sheet lists: P (front) gives the width and height, L (a wall) the depth. */
export function boxSize(sheets: LaserSheet[], thickness: number): BoxSize | undefined {
  const find = (name: string) => sheets.flatMap((s) => s.parts).find((p) => p.name === name);
  const p = find('P');
  const l = find('L');
  return p && l ? { w: p.w, d: l.w, h: p.h, t: thickness } : undefined;
}

/** Where each panel's outside face is, and which sheet part pictures it. */
const PANELS: { part: string; face: Face }[] = [
  { part: 'P', face: 'y+' },
  { part: 'K', face: 'y-' },
  { part: 'L', face: 'x-' },
  { part: 'R', face: 'x+' },
  { part: 'T', face: 'z+' },
  { part: 'B', face: 'z-' },
];

/** The six cuboids (min and max corner) of the glued panels. */
export function panelBoxes(s: BoxSize): Record<string, [V3, V3]> {
  const x = s.w / 2;
  const y = s.d / 2;
  const z = s.h / 2;
  const t = s.t;
  return {
    P: [
      [-x, y - t, -z],
      [x, y, z],
    ],
    K: [
      [-x, -y, -z],
      [x, -y + t, z],
    ],
    L: [
      [-x, -y + t, -z],
      [-x + t, y - t, z],
    ],
    R: [
      [x - t, -y + t, -z],
      [x, y - t, z],
    ],
    T: [
      [-x + t, -y + t, z - t],
      [x - t, y - t, z],
    ],
    B: [
      [-x + t, -y + t, -z],
      [x - t, y - t, -z + t],
    ],
  };
}

/** Pushes one axis-aligned face of the box [lo, hi]; with `uv` it also pushes (u, v) for each corner from `st`. */
function face(pos: number[], nor: number[], uv: number[] | undefined, lo: V3, hi: V3, f: Face, st?: (p: V3) => [number, number]) {
  const axis = f[0] === 'x' ? 0 : f[0] === 'y' ? 1 : 2;
  const sign = f[1] === '+' ? 1 : -1;
  const n: V3 = [0, 0, 0];
  n[axis] = sign;
  const [a, b] = [0, 1, 2].filter((k) => k !== axis);
  const at = sign > 0 ? hi[axis] : lo[axis];
  const corner = (u: number, v: number): V3 => {
    const p: V3 = [0, 0, 0];
    p[axis] = at;
    p[a] = u ? hi[a] : lo[a];
    p[b] = v ? hi[b] : lo[b];
    return p;
  };
  const c = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
  const uvs = st && c.map(st);
  tri(pos, nor, c[0], c[1], c[2], n, uv, uvs && [uvs[0], uvs[1], uvs[2]]);
  tri(pos, nor, c[0], c[2], c[3], n, uv, uvs && [uvs[0], uvs[2], uvs[3]]);
}

/**
 * The box's pieces: the wood of every panel (all faces), and over each panel's outside face its engraving, inset by the
 * thickness (the sheet's picture there has the finger joints' outlines). `pictures` are the panels' engraving crops by part name.
 */
export function boxPieces(s: BoxSize, pictures: Record<string, TexImageSource | undefined> = {}): TexPiece[] {
  const boxes = panelBoxes(s);
  const wood: number[] = [];
  const woodN: number[] = [];
  const pieces: TexPiece[] = [];
  for (const { part, face: f } of PANELS) {
    const [lo, hi] = boxes[part];
    for (const g of ['x+', 'x-', 'y+', 'y-', 'z+', 'z-'] as Face[]) face(wood, woodN, undefined, lo, hi, g);
    const picture = pictures[part];
    if (!picture) continue;
    // the engraving: a quad a hair above the outside face, inset by t, its picture upright as seen from outside
    const inset = s.t;
    const L: V3 = [lo[0], lo[1], lo[2]];
    const H: V3 = [hi[0], hi[1], hi[2]];
    const axis = f[0] === 'x' ? 0 : f[0] === 'y' ? 1 : 2;
    const sign = f[1] === '+' ? 1 : -1;
    for (const k of [0, 1, 2]) {
      if (k === axis) continue;
      L[k] += inset;
      H[k] -= inset;
    }
    if (sign > 0) {
      L[axis] = H[axis] = hi[axis] + 0.02;
    } else L[axis] = H[axis] = lo[axis] - 0.02;
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    // u across to the viewer's right, v down, whichever way the face looks (z+ and z-: read along x, away from the viewer's back edge)
    const st = (p: V3): [number, number] => {
      const un = (k: number) => (p[k] - L[k]) / (H[k] - L[k] || 1);
      if (f === 'y+') return [1 - un(0), 1 - un(2)];
      if (f === 'y-') return [un(0), 1 - un(2)];
      if (f === 'x-') return [1 - un(1), 1 - un(2)];
      if (f === 'x+') return [un(1), 1 - un(2)];
      if (f === 'z+') return [un(0), un(1)];
      return [un(0), 1 - un(1)];
    };
    face(pos, nor, uv, L, H, f, st);
    pieces.push({ positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), texture: picture, color: [1, 1, 1] });
  }
  return [{ positions: new Float32Array(wood), normals: new Float32Array(woodN), color: WOOD }, ...pieces];
}
