// The other mesher: marching tetrahedra. Every grid cube is cut into six tetrahedra round its main
// diagonal and each one the surface crosses gives one or two triangles. It makes about four times the
// triangles surface nets (surfaceNets.ts) do, but the surface is a closed 2-manifold for any field, with
// no retries, and two fields that are each other's negative meet on exactly the same vertices: what a
// set of color bodies that must fit together needs.
import type { Mesh, Vec3 } from './mesh';
import type { NetsOptions } from './surfaceNets';

const TETS: [number, number, number, number][] = [
  [0, 1, 3, 7],
  [0, 3, 2, 7],
  [0, 2, 6, 7],
  [0, 6, 4, 7],
  [0, 4, 5, 7],
  [0, 5, 1, 7],
];

/** The closed surface of `field` = 0 over the box (the grid starts a fixed cell outside it). */
export function tetraMesh(field: (x: number, y: number, z: number) => number, o: Pick<NetsOptions, 'min' | 'max' | 'cell'>): Mesh {
  const { cell } = o;
  const nx = Math.ceil((o.max[0] - o.min[0]) / cell) + 5;
  const ny = Math.ceil((o.max[1] - o.min[1]) / cell) + 5;
  const nz = Math.ceil((o.max[2] - o.min[2]) / cell) + 5;
  const x0 = o.min[0] - 2 * cell;
  const y0 = o.min[1] - 2 * cell;
  const z0 = o.min[2] - 2 * cell;
  const vals = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = field(x0 + i * cell, y0 + j * cell, z0 + k * cell);
        if (v < 0 && (i <= 1 || j <= 1 || k <= 1 || i >= nx - 2 || j >= ny - 2 || k >= nz - 2)) throw new Error('tetraMesh: the surface leaves the box');
        if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) v = Math.max(v, 1e-6);
        vals[i + nx * (j + ny * k)] = v === 0 || Math.abs(v) < 1e-9 ? (v < 0 ? -1e-9 : 1e-9) : v;
      }
  const pos: number[] = [];
  const idx: number[] = [];
  const edge = new Map<number, number>();
  const N = nx * ny * nz;
  const at = (c: number): Vec3 => [x0 + (c % nx) * cell, y0 + (Math.floor(c / nx) % ny) * cell, z0 + Math.floor(c / (nx * ny)) * cell];
  const vertexOn = (a: number, b: number): number => {
    if (a > b) [a, b] = [b, a];
    let n = edge.get(a * N + b);
    if (n === undefined) {
      const va = vals[a];
      const vb = vals[b];
      const t = Math.min(0.99, Math.max(0.01, va / (va - vb)));
      const pa = at(a);
      const pb = at(b);
      n = pos.length / 3;
      pos.push(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t);
      edge.set(a * N + b, n);
    }
    return n;
  };
  const mean = (cs: number[]): Vec3 => {
    const r: Vec3 = [0, 0, 0];
    for (const c of cs) {
      const p = at(c);
      for (let a = 0; a < 3; a++) r[a] += p[a] / cs.length;
    }
    return r;
  };
  const emit = (a: number, b: number, c: number, ins: number[], out: number[]) => {
    const mi = mean(ins);
    const mo = mean(out);
    const [ux, uy, uz] = [pos[b * 3] - pos[a * 3], pos[b * 3 + 1] - pos[a * 3 + 1], pos[b * 3 + 2] - pos[a * 3 + 2]];
    const [wx, wy, wz] = [pos[c * 3] - pos[a * 3], pos[c * 3 + 1] - pos[a * 3 + 1], pos[c * 3 + 2] - pos[a * 3 + 2]];
    const d = (uy * wz - uz * wy) * (mo[0] - mi[0]) + (uz * wx - ux * wz) * (mo[1] - mi[1]) + (ux * wy - uy * wx) * (mo[2] - mi[2]);
    if (d >= 0) idx.push(a, b, c);
    else idx.push(a, c, b);
  };
  const corner = new Int32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const base = i + nx * (j + ny * k);
        let lo = Infinity;
        let hi = -Infinity;
        for (let c = 0; c < 8; c++) {
          corner[c] = base + (c & 1) + nx * (((c >> 1) & 1) + ny * (c >> 2));
          lo = Math.min(lo, vals[corner[c]]);
          hi = Math.max(hi, vals[corner[c]]);
        }
        if (lo >= 0 || hi < 0) continue;
        for (const t of TETS) {
          const ins: number[] = [];
          const out: number[] = [];
          for (const c of t) (vals[corner[c]] < 0 ? ins : out).push(corner[c]);
          if (!ins.length || !out.length) continue;
          if (ins.length === 1 || out.length === 1) {
            const lone = ins.length === 1 ? ins[0] : out[0];
            const rest = ins.length === 1 ? out : ins;
            emit(vertexOn(lone, rest[0]), vertexOn(lone, rest[1]), vertexOn(lone, rest[2]), ins, out);
          } else {
            const q = [vertexOn(ins[0], out[0]), vertexOn(ins[0], out[1]), vertexOn(ins[1], out[1]), vertexOn(ins[1], out[0])];
            emit(q[0], q[1], q[2], ins, out);
            emit(q[0], q[2], q[3], ins, out);
          }
        }
      }
  return { positions: Float32Array.from(pos), indices: Uint32Array.from(idx) };
}
