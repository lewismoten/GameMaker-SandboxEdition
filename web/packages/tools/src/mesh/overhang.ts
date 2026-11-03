// What a plain filament printer (FDM) cannot print without support: faces that lean out over
// nothing. `overhang` measures them on a mesh; `supportBody` builds the support pillars for a
// distance field as a separate closed mesh, for a printer with a second material to print them in.
import { inspectMesh } from './meshCheck';
import type { Mesh, Vec3 } from './mesh';
import { surfaceNets } from './surfaceNets';

export interface Overhang {
  /** Area of the faces tipped more than the limit from upright and off the bed, in the mesh's units squared. */
  area: number;
  /** Their share of the whole surface. */
  share: number;
}

/** Faces whose normal points down past `limit` degrees from upright (45 is the usual FDM limit) and that are above the bed (z = 0). */
export function overhang(mesh: Mesh, limit = 45, bed = 0.4): Overhang {
  const { positions: p, indices: ix } = mesh;
  const down = -Math.sin((limit * Math.PI) / 180);
  let area = 0;
  let total = 0;
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t] * 3;
    const b = ix[t + 1] * 3;
    const c = ix[t + 2] * 3;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const wx = p[c] - p[a];
    const wy = p[c + 1] - p[a + 1];
    const wz = p[c + 2] - p[a + 2];
    const nx = uy * wz - uz * wy;
    const ny = uz * wx - ux * wz;
    const nz = ux * wy - uy * wx;
    const twice = Math.hypot(nx, ny, nz);
    total += twice / 2;
    const z = (p[a + 2] + p[b + 2] + p[c + 2]) / 3;
    if (twice > 0 && nz / twice < down && z > bed) area += twice / 2;
  }
  return { area, share: total ? area / total : 0 };
}

export interface SupportOptions {
  min: Vec3;
  max: Vec3;
  /** Voxel size. */
  cell: number;
  /** Air kept between a support and the model so they part cleanly. */
  gap: number;
}

/**
 * Support pillars for `field` (negative inside, floor at z = 0): under every part that leans out more than
 * 45 degrees (a voxel with nothing solid straight below it or to its four sides below), a column straight
 * down to the model or the bed, a voxel wider all round, kept `gap` away from the model. Undefined when
 * nothing needs support.
 */
export function supportBody(field: (x: number, y: number, z: number) => number, o: SupportOptions): Mesh | undefined {
  const { cell } = o;
  const nx = Math.ceil((o.max[0] - o.min[0]) / cell) + 1;
  const ny = Math.ceil((o.max[1] - o.min[1]) / cell) + 1;
  const nz = Math.ceil((o.max[2] - o.min[2]) / cell) + 1;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const d = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) d[at(i, j, k)] = field(o.min[0] + i * cell, o.min[1] + j * cell, o.min[2] + k * cell);
  const solid = (i: number, j: number, k: number) => i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && d[at(i, j, k)] < 0;
  const mark = new Uint8Array(nx * ny * nz);
  let any = false;
  for (let k = 1; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        if (!solid(i, j, k)) continue;
        if (o.min[2] + k * cell < 0.4) continue;
        if (solid(i, j, k - 1) || solid(i - 1, j, k - 1) || solid(i + 1, j, k - 1) || solid(i, j - 1, k - 1) || solid(i, j + 1, k - 1)) continue;
        // an overhang: a column down from under it, a voxel wider each way, until something solid or the bed
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++)
            for (let kk = k - 1; kk >= 0; kk--) {
              const ii = i + di;
              const jj = j + dj;
              if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) break;
              if (d[at(ii, jj, kk)] < o.gap) break;
              mark[at(ii, jj, kk)] = 1;
              any = true;
            }
      }
  if (!any) return undefined;
  const lookup = (x: number, y: number, z: number) => {
    const i = Math.round((x - o.min[0]) / cell);
    const j = Math.round((y - o.min[1]) / cell);
    const k = Math.round((z - o.min[2]) / cell);
    return i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && mark[at(i, j, k)] ? -1 : 1;
  };
  // the floor is flat: nothing below the bed
  const mesh = surfaceNets((x, y, z) => Math.max(lookup(x, y, z), -z), { min: o.min, max: o.max, cell });
  return inspectMesh(mesh).triangles ? mesh : undefined;
}
