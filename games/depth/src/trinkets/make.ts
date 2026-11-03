// Meshes one of the game's models for 3D printing: the model's distance field, grown a little so
// no part is too thin to print, standing on a plinth (and a stem if it floats), scaled to
// millimeters with its floor at z = 0, then turned into a closed mesh with a color per triangle.
import { inspectMesh, type MeshReport } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import { surfaceNets } from '@lewismoten/gamemaker-sandbox-tools/mesh/surfaceNets';
import { rgb, type Material, type Shape, type V } from '../render/tracer';
import { colorOf, fieldOf, union, type Field } from './fields';

export interface TrinketDef {
  id: string;
  /** The name in the box. */
  title: string;
  /** One line about it for the box. */
  blurb: string;
  /** The model, built in the game's units (floor at z = 0). */
  shapes: () => Shape[];
  /** Printed height in mm (the plinth included). */
  height: number;
  /** Printed width or depth, at most, in mm. */
  maxWidth: number;
  /** How much to thicken the figure's skin, in mm (default 0.45): thin sheets need more. */
  grow?: number;
  /** A post from the plinth up to a floating figure: its x, y, radius and top z, in game units. */
  stem?: { at: [number, number]; r: number; top: number };
}

/** Plinth height, the grown skin and the cell of the mesh, in mm. */
export const PLINTH_MM = 2.6;
const GROW_MM = 0.45;
const CELL_MM = 0.95;
const FILLET_MM = 1.6;
const PLINTH_COLOR = rgb(52, 40, 120);
const plinthMat: Material = { color: PLINTH_COLOR };

const roundBox = (x: number, y: number, z: number, cx: number, cy: number, hx: number, hy: number, r: number, h: number) => {
  const qx = Math.abs(x - cx) - hx + r;
  const qy = Math.abs(y - cy) - hy + r;
  const flat = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  return Math.max(flat, Math.abs(z - h / 2) - h / 2);
};

export interface Trinket {
  mesh: Mesh;
  report: MeshReport;
  /** Millimeters per game unit. */
  scale: number;
}

export function makeTrinket(def: TrinketDef): Trinket {
  const fields = def.shapes().map(fieldOf);
  const bounds = def.shapes().map((s) => s.bounds!);
  const lo: V = [Infinity, Infinity, 0];
  const hi: V = [-Infinity, -Infinity, 0];
  for (const [a, b] of bounds)
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], a[i]);
      hi[i] = Math.max(hi[i], b[i]);
    }
  const top = Math.max(hi[2], def.stem?.top ?? 0);
  // a first, coarse pass finds where the figure really stands (the bounds are loose)
  const dxy = Math.max(hi[0] - lo[0], hi[1] - lo[1]);
  const s0 = Math.min(def.height / top, def.maxWidth / dxy);
  const raw = union(fields);
  const coarse = surfaceNets((x, y, z) => Math.max(s0 * raw.d(x / s0 + (lo[0] + hi[0]) / 2, y / s0 + (lo[1] + hi[1]) / 2, z / s0), -z), {
    min: [(lo[0] - hi[0]) * s0 * 0.5 - 3, (lo[1] - hi[1]) * s0 * 0.5 - 3, 0],
    max: [(hi[0] - lo[0]) * s0 * 0.5 + 3, (hi[1] - lo[1]) * s0 * 0.5 + 3, top * s0 + 3],
    cell: 0.8,
  });
  const cmin = [Infinity, Infinity];
  const cmax = [-Infinity, -Infinity];
  for (let i = 0; i < coarse.positions.length; i += 3)
    for (let a = 0; a < 2; a++) {
      cmin[a] = Math.min(cmin[a], coarse.positions[i + a]);
      cmax[a] = Math.max(cmax[a], coarse.positions[i + a]);
    }
  const mid: V = [(lo[0] + hi[0]) / 2 + (cmin[0] + cmax[0]) / 2 / s0, (lo[1] + hi[1]) / 2 + (cmin[1] + cmax[1]) / 2 / s0, 0];
  const halfX = (cmax[0] - cmin[0]) / 2 / s0 + 2.4 / s0;
  const halfY = (cmax[1] - cmin[1]) / 2 / s0 + 2.4 / s0;
  // the final scale: the plinth's margin counts toward the width
  const width = Math.max(halfX, halfY) * 2;
  const scale = Math.min((def.height - 0) / top, def.maxWidth / width);
  const ph = PLINTH_MM / scale;
  const grow = (def.grow ?? GROW_MM) / scale;
  const all: Field[] = fields.map((f) => ({ d: (x, y, z) => f.d(x, y, z) - grow, mat: f.mat }));
  const rr = Math.min(halfX, halfY) * 0.7;
  all.push({ d: (x, y, z) => roundBox(x, y, z, mid[0], mid[1], halfX, halfY, rr, ph), mat: () => plinthMat });
  if (def.stem) {
    const { at, r, top: st } = def.stem;
    all.push({
      d: (x, y, z) => Math.max(Math.hypot(x - at[0], y - at[1]) - r, z - st),
      mat: () => plinthMat,
    });
  }
  const f = union(all, FILLET_MM / scale);
  const toUnits = (x: number, y: number, z: number): V => [x / scale + mid[0], y / scale + mid[1], z / scale];
  const mesh = surfaceNets((x, y, z) => Math.max(f.d(...toUnits(x, y, z)) * scale, -z), {
    min: [-halfX * scale - 2, -halfY * scale - 2, 0],
    max: [halfX * scale + 2, halfY * scale + 2, top * scale + 2],
    cell: CELL_MM,
  });
  // a color per triangle, from the material at its middle
  const tris = mesh.indices.length / 3;
  const colors = new Uint8Array(tris * 3);
  const p = mesh.positions;
  for (let t = 0; t < tris; t++) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let c = 0; c < 3; c++) {
      const v = mesh.indices[t * 3 + c] * 3;
      cx += p[v] / 3;
      cy += p[v + 1] / 3;
      cz += p[v + 2] / 3;
    }
    const u = toUnits(cx, cy, cz);
    const m = f.mat(...u);
    const col = colorOf(m, u);
    const e = m.emit ?? [0, 0, 0];
    for (let a = 0; a < 3; a++) colors[t * 3 + a] = Math.round(Math.min(1, Math.max(0, col[a] + e[a] * 0.4)) * 255);
  }
  mesh.colors = colors;
  return { mesh, report: inspectMesh(mesh), scale };
}
