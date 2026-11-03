// Binary STL, the format every slicer reads: an 80-byte header, a triangle count, then 50
// bytes per triangle (normal, three corners, a 2-byte attribute). Sizes are in millimeters by
// convention. A color per triangle goes in the attribute the way VisCAM and SolidView write it
// (bit 15 set, then 5 bits each of red, green and blue from bit 0); slicers ignore it, and the
// desk's 3D viewer paints with it.
import type { Mesh } from './mesh';

export interface StlOptions {
  /** Written into the header (80 bytes at most). */
  name?: string;
}

/** The mesh as a binary STL file. */
export function writeStl(mesh: Mesh, options: StlOptions = {}): Uint8Array {
  const { positions: p, indices: ix, colors } = mesh;
  const tris = ix.length / 3;
  const out = new Uint8Array(84 + tris * 50);
  const view = new DataView(out.buffer);
  const head = new TextEncoder().encode((options.name ?? 'mesh').slice(0, 79));
  out.set(head, 0);
  view.setUint32(80, tris, true);
  for (let t = 0; t < tris; t++) {
    const a = ix[t * 3] * 3;
    const b = ix[t * 3 + 1] * 3;
    const c = ix[t * 3 + 2] * 3;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const wx = p[c] - p[a];
    const wy = p[c + 1] - p[a + 1];
    const wz = p[c + 2] - p[a + 2];
    let nx = uy * wz - uz * wy;
    let ny = uz * wx - ux * wz;
    let nz = ux * wy - uy * wx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    const at = 84 + t * 50;
    const vals = [nx, ny, nz, p[a], p[a + 1], p[a + 2], p[b], p[b + 1], p[b + 2], p[c], p[c + 1], p[c + 2]];
    for (let i = 0; i < 12; i++) view.setFloat32(at + i * 4, vals[i], true);
    if (colors) view.setUint16(at + 48, 0x8000 | ((colors[t * 3] >> 3) | ((colors[t * 3 + 1] >> 3) << 5) | ((colors[t * 3 + 2] >> 3) << 10)), true);
  }
  return out;
}

/** A binary STL read back, its corners that coincide joined into shared vertices. */
export function readStl(data: Uint8Array): Mesh {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tris = view.getUint32(80, true);
  if (data.byteLength !== 84 + tris * 50) throw new Error('Not a binary STL: its size does not match its triangle count');
  const pos: number[] = [];
  const idx = new Uint32Array(tris * 3);
  const colors = new Uint8Array(tris * 3);
  let colored = false;
  const seen = new Map<string, number>();
  for (let t = 0; t < tris; t++) {
    const at = 84 + t * 50;
    for (let c = 0; c < 3; c++) {
      const x = view.getFloat32(at + 12 + c * 12, true);
      const y = view.getFloat32(at + 16 + c * 12, true);
      const z = view.getFloat32(at + 20 + c * 12, true);
      const key = `${x},${y},${z}`;
      let n = seen.get(key);
      if (n === undefined) {
        n = pos.length / 3;
        pos.push(x, y, z);
        seen.set(key, n);
      }
      idx[t * 3 + c] = n;
    }
    const attr = view.getUint16(at + 48, true);
    if (attr & 0x8000) {
      colored = true;
      colors[t * 3] = ((attr & 31) << 3) | 4;
      colors[t * 3 + 1] = (((attr >> 5) & 31) << 3) | 4;
      colors[t * 3 + 2] = (((attr >> 10) & 31) << 3) | 4;
    }
  }
  return { positions: Float32Array.from(pos), indices: idx, ...(colored ? { colors } : {}) };
}
