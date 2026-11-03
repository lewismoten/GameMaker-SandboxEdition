// Voxels to a closed triangle mesh: every exposed voxel face is found, coplanar faces are merged into
// the biggest rectangles a greedy scan finds, and each rectangle is cut into triangles that meet its
// neighbors vertex to vertex (every lattice point along its edges is a corner), so the mesh stays
// watertight with no T-junctions. A rectangle w x h costs 2(w+h) triangles as a fan, or 2wh as unit
// squares, whichever is fewer. Counter-clockwise triangles face outward (mesh.ts). Sizes are in `size`
// units per voxel; x, y, z of the grid are the mesh's x, y, z.
import type { Mesh } from './mesh';

export interface VoxelGrid {
  nx: number;
  ny: number;
  nz: number;
  /** True where a voxel is filled. Outside the grid is empty. */
  has: (x: number, y: number, z: number) => boolean;
}

/** The surface of the filled voxels as a mesh. A voxel touching another only along an edge makes a non-manifold edge: avoid that in the grid. */
export function voxelMesh(g: VoxelGrid, size = 1): Mesh {
  const n = [g.nx, g.ny, g.nz];
  const pos: number[] = [];
  const idx: number[] = [];
  const ids = new Map<number, number>();
  const vertex = (c: number[]): number => {
    // doubled lattice coordinates, so a rectangle's center is a whole number too
    const key = (c[0] * 4096 + c[1]) * 4096 + c[2];
    let id = ids.get(key);
    if (id === undefined) {
      id = pos.length / 3;
      ids.set(key, id);
      pos.push((c[0] * size) / 2, (c[1] * size) / 2, (c[2] * size) / 2);
    }
    return id;
  };
  const filled = (c: number[]) => c[0] >= 0 && c[1] >= 0 && c[2] >= 0 && c[0] < g.nx && c[1] < g.ny && c[2] < g.nz && g.has(c[0], c[1], c[2]);

  for (let a = 0; a < 3; a++) {
    const u = (a + 1) % 3;
    const v = (a + 2) % 3;
    for (const sign of [1, -1]) {
      for (let d = 0; d <= n[a]; d++) {
        // the faces on the plane a = d: voxel d-1 below it and d above it
        const mask = new Uint8Array(n[u] * n[v]);
        let any = false;
        for (let j = 0; j < n[v]; j++)
          for (let i = 0; i < n[u]; i++) {
            const lo: number[] = [0, 0, 0];
            const hi: number[] = [0, 0, 0];
            lo[a] = d - 1;
            hi[a] = d;
            lo[u] = hi[u] = i;
            lo[v] = hi[v] = j;
            if (sign === 1 ? filled(lo) && !filled(hi) : filled(hi) && !filled(lo)) {
              mask[j * n[u] + i] = 1;
              any = true;
            }
          }
        if (!any) continue;
        for (let j = 0; j < n[v]; j++)
          for (let i = 0; i < n[u]; i++) {
            if (!mask[j * n[u] + i]) continue;
            let w = 1;
            while (i + w < n[u] && mask[j * n[u] + i + w]) w++;
            let h = 1;
            grow: for (; j + h < n[v]; h++) for (let k = 0; k < w; k++) if (!mask[(j + h) * n[u] + i + k]) break grow;
            for (let jj = 0; jj < h; jj++) for (let ii = 0; ii < w; ii++) mask[(j + jj) * n[u] + i + ii] = 0;
            emit(a, u, v, d, i, j, w, h, sign);
          }
      }
    }
  }

  function emit(a: number, u: number, v: number, d: number, i: number, j: number, w: number, h: number, sign: number): void {
    const at = (uu: number, vv: number): number => {
      const c = [0, 0, 0];
      c[a] = d * 2;
      c[u] = uu * 2;
      c[v] = vv * 2;
      return vertex(c);
    };
    const tri = (p: number, q: number, r: number) => (sign === 1 ? idx.push(p, q, r) : idx.push(p, r, q));
    if (w + h >= w * h) {
      for (let jj = 0; jj < h; jj++)
        for (let ii = 0; ii < w; ii++) {
          const p = at(i + ii, j + jj);
          const q = at(i + ii + 1, j + jj);
          const r = at(i + ii + 1, j + jj + 1);
          const s = at(i + ii, j + jj + 1);
          tri(p, q, r);
          tri(p, r, s);
        }
      return;
    }
    const ring: number[] = [];
    for (let k = 0; k < w; k++) ring.push(at(i + k, j));
    for (let k = 0; k < h; k++) ring.push(at(i + w, j + k));
    for (let k = w; k > 0; k--) ring.push(at(i + k, j + h));
    for (let k = h; k > 0; k--) ring.push(at(i, j + k));
    const c = [0, 0, 0];
    c[a] = d * 2;
    c[u] = 2 * i + w;
    c[v] = 2 * j + h;
    const mid = vertex(c);
    for (let k = 0; k < ring.length; k++) tri(mid, ring[k], ring[(k + 1) % ring.length]);
  }

  return { positions: Float32Array.from(pos), indices: Uint32Array.from(idx) };
}
