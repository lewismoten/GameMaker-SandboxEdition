// Checks on a triangle mesh before it is printed: closed (every edge in exactly two triangles,
// once each way), how many separate pieces it has, its size and volume.
import type { Mesh, Vec3 } from './mesh';

export interface MeshReport {
  triangles: number;
  vertices: number;
  /** Edges that belong to one triangle or three or more (a closed mesh has none). */
  badEdges: number;
  /** Edges two triangles walk the same way (a flipped triangle). */
  flippedEdges: number;
  /** Triangles with no area. */
  degenerate: number;
  /** Separate pieces; a print wants 1 (or pieces that rest on the bed). */
  pieces: number;
  min: Vec3;
  max: Vec3;
  /** Enclosed volume (positive when the triangles face outward). */
  volume: number;
  /** Surface area. */
  area: number;
}

export function inspectMesh(mesh: Mesh): MeshReport {
  const { positions: p, indices: ix } = mesh;
  const tris = ix.length / 3;
  const verts = p.length / 3;
  const edges = new Map<number, number>();
  const directed = new Map<number, number>();
  const parent = Int32Array.from({ length: verts }, (_, i) => i);
  const find = (a: number): number => {
    while (parent[a] !== a) a = parent[a] = parent[parent[a]];
    return a;
  };
  let volume = 0;
  let area = 0;
  let degenerate = 0;
  for (let t = 0; t < tris; t++) {
    const a = ix[t * 3];
    const b = ix[t * 3 + 1];
    const c = ix[t * 3 + 2];
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = Math.min(u, v) * verts + Math.max(u, v);
      edges.set(key, (edges.get(key) ?? 0) + 1);
      const dk = u * verts + v;
      directed.set(dk, (directed.get(dk) ?? 0) + 1);
      parent[find(u)] = find(v);
    }
    const [ax, ay, az] = [p[a * 3], p[a * 3 + 1], p[a * 3 + 2]];
    const [bx, by, bz] = [p[b * 3], p[b * 3 + 1], p[b * 3 + 2]];
    const [cx, cy, cz] = [p[c * 3], p[c * 3 + 1], p[c * 3 + 2]];
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const twice = Math.hypot(nx, ny, nz);
    area += twice / 2;
    if (twice < 1e-12) degenerate++;
  }
  let badEdges = 0;
  for (const n of edges.values()) if (n !== 2) badEdges++;
  let flippedEdges = 0;
  for (const n of directed.values()) if (n > 1) flippedEdges++;
  const used = new Set<number>();
  for (let i = 0; i < ix.length; i++) used.add(find(ix[i]));
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i++) {
    min[i % 3] = Math.min(min[i % 3], p[i]);
    max[i % 3] = Math.max(max[i % 3], p[i]);
  }
  return { triangles: tris, vertices: verts, badEdges, flippedEdges, degenerate, pieces: used.size, min, max, volume, area };
}
