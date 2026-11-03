// Turns a signed distance field (negative inside) into a closed triangle mesh by surface nets:
// one vertex in every grid cell the surface passes through (the mean of where it crosses the
// cell's edges), and a quad between the four cells around every grid edge it crosses. It makes
// about a quarter of the triangles marching tetrahedra do, and smoother ones. The grid is padded
// so the surface never meets its edge, which keeps the mesh closed. A cell that holds two
// separate bits of surface can pinch an edge; `surfaceNets` shifts the grid and changes its spacing a hair (later it also blurs the samples a little) and tries
// again until the mesh is a clean 2-manifold (every edge in exactly two triangles).
import { inspectMesh } from './meshCheck';
import type { Mesh, Vec3 } from './mesh';

export interface NetsOptions {
  /** The box to sample: the surface must lie inside it. */
  min: Vec3;
  max: Vec3;
  /** The grid spacing, in the field's units. */
  cell: number;
  /** Retry a grid that splits the surface into more separate pieces than this (default: any number is fine). */
  maxPieces?: number;
  /** How many grids to try before settling for the best (default 30). */
  attempts?: number;
}

// the twelve edges of a cube: pairs of corner numbers (corner bits are x, y, z)
const EDGES: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

function once(field: (x: number, y: number, z: number) => number, o: NetsOptions, shift: Vec3, blur = 0): Mesh {
  const { cell } = o;
  const nx = Math.ceil((o.max[0] - o.min[0]) / cell) + 6;
  const ny = Math.ceil((o.max[1] - o.min[1]) / cell) + 6;
  const nz = Math.ceil((o.max[2] - o.min[2]) / cell) + 6;
  const x0 = o.min[0] - 3 * cell + shift[0] * cell;
  const y0 = o.min[1] - 3 * cell + shift[1] * cell;
  const z0 = o.min[2] - 3 * cell + shift[2] * cell;
  const vals = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = field(x0 + i * cell, y0 + j * cell, z0 + k * cell);
        // the outer cell of padding is air; a surface that reaches into it would be cut open
        const edge = (n: number, m: number) => n <= 1 || n >= m - 2;
        if (v < 0 && (edge(i, nx) || edge(j, ny) || edge(k, nz)))
          throw new Error(
            `surfaceNets: the surface leaves the box at ${i},${j},${k} of ${nx},${ny},${nz} (${x0 + i * cell}, ${y0 + j * cell}, ${z0 + k * cell}) value ${v}`,
          );
        if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) v = Math.max(v, 1e-6);
        vals[i + nx * (j + ny * k)] = v === 0 ? 1e-9 : v;
      }
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let pass = 0; pass < blur; pass++) {
    // a light blur of the samples closes slivers narrower than a cell
    const src = vals.slice();
    for (let k = 1; k < nz - 1; k++)
      for (let j = 1; j < ny - 1; j++)
        for (let i = 1; i < nx - 1; i++) {
          const c = at(i, j, k);
          vals[c] = src[c] * 0.4 + (src[c - 1] + src[c + 1] + src[c - nx] + src[c + nx] + src[c - nx * ny] + src[c + nx * ny]) * 0.1;
        }
  }
  // a vertex number for each cell (cell i,j,k has its lowest corner at i,j,k), or -1
  const cellVertex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const corner = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          corner[c] = vals[at(i + (c & 1), j + ((c >> 1) & 1), k + (c >> 2))];
          if (corner[c] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [a, b] of EDGES) {
          const va = corner[a];
          const vb = corner[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          sx += (a & 1) + t * ((b & 1) - (a & 1));
          sy += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1));
          sz += (a >> 2) + t * ((b >> 2) - (a >> 2));
          n++;
        }
        cellVertex[cellAt(i, j, k)] = pos.length / 3;
        pos.push(x0 + (i + sx / n) * cell, y0 + (j + sy / n) * cell, z0 + (k + sz / n) * cell);
      }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    // split along the shorter diagonal
    const dist = (p: number, q: number) => Math.hypot(pos[p * 3] - pos[q * 3], pos[p * 3 + 1] - pos[q * 3 + 1], pos[p * 3 + 2] - pos[q * 3 + 2]);
    const [p, q, r, s] = flip ? [a, d, c, b] : [a, b, c, d];
    if (dist(p, r) <= dist(q, s)) idx.push(p, q, r, p, r, s);
    else idx.push(p, q, s, q, r, s);
  };
  // every grid edge with a sign change: the four cells that share it make a quad
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const here = vals[at(i, j, k)] < 0;
        // x edge: cells (i,j-1..j,k-1..k)
        if (here !== vals[at(i + 1, j, k)] < 0)
          quad(cellVertex[cellAt(i, j - 1, k - 1)], cellVertex[cellAt(i, j, k - 1)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j - 1, k)], !here);
        if (here !== vals[at(i, j + 1, k)] < 0)
          quad(cellVertex[cellAt(i - 1, j, k - 1)], cellVertex[cellAt(i - 1, j, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j, k - 1)], !here);
        if (here !== vals[at(i, j, k + 1)] < 0)
          quad(cellVertex[cellAt(i - 1, j - 1, k)], cellVertex[cellAt(i, j - 1, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i - 1, j, k)], !here);
      }
  return { positions: Float32Array.from(pos), indices: Uint32Array.from(idx) };
}

/** The closed surface of `field` = 0 over the box. */
export function surfaceNets(field: (x: number, y: number, z: number) => number, o: NetsOptions): Mesh {
  let best: Mesh | undefined;
  let bestBad = Infinity;
  for (let attempt = 0; attempt < (o.attempts ?? 30); attempt++) {
    // shift the grid by a fraction of a cell, different each time
    const f = attempt * 0.137;
    const mesh = once(field, { ...o, cell: o.cell * (1 + 0.013 * attempt) }, [f % 1, (f * 1.7) % 1, (f * 2.3) % 1], attempt >= 22 ? 2 : attempt >= 10 ? 1 : 0);
    const report = inspectMesh(mesh);
    const bad = report.badEdges + Math.max(0, report.pieces - (o.maxPieces ?? Infinity));
    if (bad === 0) return mesh;
    if (bad < bestBad) [best, bestBad] = [mesh, bad];
  }
  return best!;
}
