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
  /** Triangles in each piece, largest first. */
  pieceTriangles: number[];
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
  // every edge as a number (low end * vertices + high end), once undirected and once directed, counted after sorting
  const edges = new Float64Array(ix.length);
  const directed = new Float64Array(ix.length);
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
    for (let k = 0; k < 3; k++) {
      const u = ix[t * 3 + k];
      const v = ix[t * 3 + ((k + 1) % 3)];
      edges[t * 3 + k] = Math.min(u, v) * verts + Math.max(u, v);
      directed[t * 3 + k] = u * verts + v;
      parent[find(u)] = find(v);
    }
    const [ax, ay, az] = [p[a * 3], p[a * 3 + 1], p[a * 3 + 2]];
    const [bx, by, bz] = [p[b * 3], p[b * 3 + 1], p[b * 3 + 2]];
    const [cx, cy, cz] = [p[c * 3], p[c * 3 + 1], p[c * 3 + 2]];
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const twice = Math.sqrt(nx * nx + ny * ny + nz * nz);
    area += twice / 2;
    if (twice < 1e-12) degenerate++;
  }
  edges.sort();
  directed.sort();
  let badEdges = 0;
  for (let i = 0; i < edges.length;) {
    let j = i;
    while (j < edges.length && edges[j] === edges[i]) j++;
    if (j - i !== 2) badEdges++;
    i = j;
  }
  let flippedEdges = 0;
  for (let i = 1; i < directed.length; i++) if (directed[i] === directed[i - 1] && directed[i] !== directed[i - 2]) flippedEdges++;
  const used = new Set<number>();
  const perPiece = new Map<number, number>();
  for (let i = 0; i < ix.length; i++) {
    const r = find(ix[i]);
    used.add(r);
    if (i % 3 === 0) perPiece.set(r, (perPiece.get(r) ?? 0) + 1);
  }
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i++) {
    min[i % 3] = Math.min(min[i % 3], p[i]);
    max[i % 3] = Math.max(max[i % 3], p[i]);
  }
  return {
    triangles: tris,
    vertices: verts,
    badEdges,
    flippedEdges,
    degenerate,
    pieces: used.size,
    pieceTriangles: [...perPiece.values()].sort((a, b) => b - a),
    min,
    max,
    volume,
    area,
  };
}
