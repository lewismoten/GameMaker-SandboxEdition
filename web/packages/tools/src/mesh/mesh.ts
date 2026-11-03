// A triangle mesh as flat arrays, shared by the mesher (tetraMesh.ts), the STL reader and
// writer (stl.ts) and the checks (meshCheck.ts). Counter-clockwise triangles face outward.

export interface Mesh {
  /** x, y, z per vertex. */
  positions: Float32Array;
  /** Three vertex numbers per triangle. */
  indices: Uint32Array;
  /** Optional color per triangle: r, g, b (0-255) each. */
  colors?: Uint8Array;
}

export type Vec3 = [number, number, number];
