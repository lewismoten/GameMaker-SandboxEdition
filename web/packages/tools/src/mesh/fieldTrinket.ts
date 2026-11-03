// A distance field in millimeters turned into everything a 3D-print trinket needs: a closed mesh with a color per
// triangle, the checks (thin parts, overhangs), up to four color bodies and, if the shape leans out, supports.
// Lifted from Depth Perception's trinket maker so every game's trinkets share it (the game supplies the field).
import { inspectMesh, type MeshReport } from './meshCheck';
import type { Mesh } from './mesh';
import { surfaceNets } from './surfaceNets';
import { decimate } from './decimate';
import { sampledField } from './sampledField';
import { colorBodies, pickPalette, type Rgb } from './colorBodies';
import { overhang, supportBody, type Overhang } from './overhang';

export type V3 = [number, number, number];

export interface FieldTrinketInput {
  /** Signed distance in mm (negative inside); must be positive below z = 0 so the floor is flat. */
  mm: (x: number, y: number, z: number) => number;
  /** The 0-255 color of the surface at a point, given its outward normal. */
  colorAt: (x: number, y: number, z: number, normal: V3) => Rgb;
  /** The box the mesh is sampled in, in mm. */
  box: { min: V3; max: V3 };
  /** Filament colors (at most four), when the automatic pick would join two the eye must tell apart. */
  palette?: Rgb[];
  /** How many separate solids the trinket is made of (default 1): a coin cut into pieces is 3. */
  pieces?: number;
}

export interface FieldTrinket {
  mesh: Mesh;
  report: MeshReport;
  /** The pieces left when the surface is eroded by half a millimeter (of at least a speck's size). */
  erodedPieces: number;
  /** Specks the eroded surface leaves: parts thinner than a millimeter that would not print. */
  erodedSpecks: number;
  overhang: Overhang;
  bodies: { color: Rgb; mesh: Mesh }[];
  wholeVolume: number;
  field: (x: number, y: number, z: number) => number;
  support?: Mesh;
}

const MAX_COLORS = 4;
/** Overhanging area, in mm squared, above which the trinket comes with a support body of its own. */
const SUPPORT_AREA = 25;
/** A piece of the eroded surface with fewer triangles than this is a speck, not a body. */
const SPECK = 150;
const ERODE_MM = 0.5;
/** How far, in mm, thinning a mesh may move its surface: well under what a 0.4 mm nozzle prints. */
const SIMPLIFY_MM = 0.15;
const BODY_SIMPLIFY_MM = 0.2;
const BODY_CELL_MM = 1.5;
const PALETTE_MERGE = 40;

const normalize = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** Mesh and check a trinket's field. `cell` is the mesh's cell in mm (default 0.95). */
export function meshFieldTrinket(input: FieldTrinketInput, cell = 0.95): FieldTrinket {
  const { box } = input;
  // the figure is sampled once; the mesh, the eroded check, the colors and the supports all read these samples
  const g = sampledField(input.mm, { ...box, cell });
  const fine = surfaceNets(g, { ...box, cell, maxPieces: input.pieces ?? 1 });
  // a color per triangle, from the surface at its middle
  const tris = fine.indices.length / 3;
  const colors = new Uint8Array(tris * 3);
  const p = fine.positions;
  for (let t = 0; t < tris; t++) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let c = 0; c < 3; c++) {
      const v = fine.indices[t * 3 + c] * 3;
      cx += p[v] / 3;
      cy += p[v + 1] / 3;
      cz += p[v + 2] / 3;
    }
    const e0 = 0.4;
    const nrm = normalize([g(cx + e0, cy, cz) - g(cx - e0, cy, cz), g(cx, cy + e0, cz) - g(cx, cy - e0, cz), g(cx, cy, cz + e0) - g(cx, cy, cz - e0)]);
    const col = input.colorAt(cx, cy, cz, nrm);
    for (let a = 0; a < 3; a++) colors[t * 3 + a] = col[a];
  }
  fine.colors = colors;
  const eroded = inspectMesh(surfaceNets((x, y, z) => g(x, y, z) + ERODE_MM, { ...box, cell, attempts: 3 }));
  const over = overhang(fine);
  const rawSupport = over.area > SUPPORT_AREA ? supportBody(g, { ...box, cell: 1, gap: 0.4 }) : undefined;
  const support = rawSupport && decimate(rawSupport, { maxError: 0.1 });
  // the file's mesh: the sampled one with its flats and gentle curves cut down to what holds the shape
  const mesh = decimate(fine, { maxError: SIMPLIFY_MM });
  const report = inspectMesh(mesh);
  const bodies = colorBodies(fine, input.palette ?? pickPalette(fine, MAX_COLORS, PALETTE_MERGE), g, {
    ...box,
    cell: BODY_CELL_MM,
    simplify: BODY_SIMPLIFY_MM,
    volume: report.volume,
  });
  return {
    mesh,
    report,
    erodedPieces: eroded.pieceTriangles.filter((n) => n >= SPECK).length,
    erodedSpecks: eroded.pieceTriangles.filter((n) => n < SPECK).length,
    overhang: over,
    support,
    bodies,
    wholeVolume: report.volume,
    field: g,
  };
}
