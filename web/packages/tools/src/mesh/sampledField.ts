// A distance field sampled once on a grid and read back by trilinear interpolation, for the many passes
// over one figure (the mesh, the eroded check, the color bodies, the supports) that would each otherwise
// evaluate the model at every grid point. The grid starts three cells outside `min` (where surfaceNets.ts
// starts its own), so the mesher's first grid lands exactly on the samples and any other reads between them.
import type { NetsOptions } from './surfaceNets';

/** `field` sampled over the box; outside the grid the nearest sample is read, which is air. */
export function sampledField(
  field: (x: number, y: number, z: number) => number,
  o: Pick<NetsOptions, 'min' | 'max' | 'cell'>,
): (x: number, y: number, z: number) => number {
  const { cell } = o;
  const nx = Math.ceil((o.max[0] - o.min[0]) / cell) + 10;
  const ny = Math.ceil((o.max[1] - o.min[1]) / cell) + 10;
  const nz = Math.ceil((o.max[2] - o.min[2]) / cell) + 10;
  const x0 = o.min[0] - 3 * cell;
  const y0 = o.min[1] - 3 * cell;
  const z0 = o.min[2] - 3 * cell;
  const vals = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[i + nx * (j + ny * k)] = field(x0 + i * cell, y0 + j * cell, z0 + k * cell);
  return (x, y, z) => {
    const gx = Math.min(nx - 1.0001, Math.max(0, (x - x0) / cell));
    const gy = Math.min(ny - 1.0001, Math.max(0, (y - y0) / cell));
    const gz = Math.min(nz - 1.0001, Math.max(0, (z - z0) / cell));
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const k = Math.floor(gz);
    const fx = gx - i;
    const fy = gy - j;
    const fz = gz - k;
    const c = i + nx * (j + ny * k);
    const sx = 1;
    const sy = nx;
    const sz = nx * ny;
    const x00 = vals[c] * (1 - fx) + vals[c + sx] * fx;
    const x10 = vals[c + sy] * (1 - fx) + vals[c + sy + sx] * fx;
    const x01 = vals[c + sz] * (1 - fx) + vals[c + sz + sx] * fx;
    const x11 = vals[c + sy + sz] * (1 - fx) + vals[c + sy + sz + sx] * fx;
    return (x00 * (1 - fy) + x10 * fy) * (1 - fz) + (x01 * (1 - fy) + x11 * fy) * fz;
  };
}
