// Vertex data for one phone part: the data's axes turned to the viewer's (the phone stands up, its front
// toward the viewer: x stays, height y comes toward the viewer, board y runs down), the winding made
// outward whatever the file had, and normals smoothed across soft edges only (so a round capacitor is
// round and a box keeps its corners). Nine floats a vertex: position, normal, color; three vertices a triangle.
import type { Vec3 } from './phoneData';

const CREASE = Math.cos((38 * Math.PI) / 180);

/** The color as the viewer's shader wants it (it treats colors as sRGB; the file's are linear). */
const encode = (c: Vec3): Vec3 => [c[0] ** (1 / 2.2), c[1] ** (1 / 2.2), c[2] ** (1 / 2.2)];

export function partVertices(positions: Float32Array, indices: Uint32Array, color: Vec3): Float32Array {
  const n = positions.length / 3;
  const p = new Float32Array(positions.length);
  for (let i = 0; i < n; i++) {
    p[i * 3] = positions[i * 3];
    p[i * 3 + 1] = -positions[i * 3 + 2];
    p[i * 3 + 2] = positions[i * 3 + 1];
  }
  const tris = indices.slice();
  // signed volume: a negative one means the triangles wind inward
  let vol = 0;
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const b = tris[t + 1] * 3;
    const c = tris[t + 2] * 3;
    vol += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  if (vol < 0) for (let t = 0; t < tris.length; t += 3) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]];

  // face normals (area weighted, unnormalized), gathered at each position
  const faces = new Float32Array(tris.length);
  const at = new Map<string, number[]>();
  const key = (v: number) => `${Math.round(p[v * 3] * 200)},${Math.round(p[v * 3 + 1] * 200)},${Math.round(p[v * 3 + 2] * 200)}`;
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const b = tris[t + 1] * 3;
    const c = tris[t + 2] * 3;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const wx = p[c] - p[a];
    const wy = p[c + 1] - p[a + 1];
    const wz = p[c + 2] - p[a + 2];
    faces[t] = uy * wz - uz * wy;
    faces[t + 1] = uz * wx - ux * wz;
    faces[t + 2] = ux * wy - uy * wx;
    for (let k = 0; k < 3; k++) {
      const kk = key(tris[t + k]);
      const list = at.get(kk);
      if (list) list.push(t);
      else at.set(kk, [t]);
    }
  }
  const col = encode(color);
  const out = new Float32Array(tris.length * 9);
  for (let t = 0; t < tris.length; t += 3) {
    const fl = Math.hypot(faces[t], faces[t + 1], faces[t + 2]) || 1;
    const fx = faces[t] / fl;
    const fy = faces[t + 1] / fl;
    const fz = faces[t + 2] / fl;
    for (let k = 0; k < 3; k++) {
      let nx = 0;
      let ny = 0;
      let nz = 0;
      for (const o of at.get(key(tris[t + k])) ?? []) {
        const l = Math.hypot(faces[o], faces[o + 1], faces[o + 2]) || 1;
        if ((faces[o] * fx + faces[o + 1] * fy + faces[o + 2] * fz) / l >= CREASE) {
          nx += faces[o];
          ny += faces[o + 1];
          nz += faces[o + 2];
        }
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      const o = (t + k) * 9;
      out.set(p.subarray(tris[t + k] * 3, tris[t + k] * 3 + 3), o);
      out[o + 3] = nx / nl;
      out[o + 4] = ny / nl;
      out[o + 5] = nz / nl;
      out.set(col, o + 6);
    }
  }
  return out;
}
