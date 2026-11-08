// Lossless packing of mesh files, so a site can serve a small file and make the real one in the browser:
// float32 arrays split into byte planes (the sign and exponent bytes of nearby values repeat, so deflate finds
// them), vertex numbers as small varints (how far back from the newest vertex, zigzagged), and a binary STL as
// one table of its corners plus those numbers, its normals worked out again (only the ones that differ are kept).
// `unpackStl(packStl(file))` is the file byte for byte; `packStl` checks that before it returns. Pure and
// synchronous: the caller deflates the result (Node's zlib, or the browser's DecompressionStream).

/** A growing byte buffer. */
class Out {
  private buf = new Uint8Array(1 << 16);
  length = 0;
  private room(n: number): void {
    if (this.length + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.length + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.length));
    this.buf = next;
  }
  bytes(b: Uint8Array): void {
    this.room(b.length);
    this.buf.set(b, this.length);
    this.length += b.length;
  }
  u32(v: number): void {
    this.room(4);
    new DataView(this.buf.buffer).setUint32(this.length, v, true);
    this.length += 4;
  }
  varint(v: number): void {
    this.room(8);
    while (v >= 128) {
      this.buf[this.length++] = (v % 128) | 128;
      v = Math.floor(v / 128);
    }
    this.buf[this.length++] = v;
  }
  done(): Uint8Array {
    return this.buf.slice(0, this.length);
  }
}

/** A reader over packed bytes. */
class In {
  at = 0;
  private view: DataView;
  constructor(private data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }
  bytes(n: number): Uint8Array {
    if (this.at + n > this.data.length) throw new Error('Packed mesh is cut short');
    const b = this.data.subarray(this.at, this.at + n);
    this.at += n;
    return b;
  }
  u32(): number {
    const v = this.view.getUint32(this.at, true);
    this.at += 4;
    return v;
  }
  varint(): number {
    let v = 0;
    let scale = 1;
    for (;;) {
      if (this.at >= this.data.length) throw new Error('Packed mesh is cut short');
      const b = this.data[this.at++];
      v += (b & 127) * scale;
      if (b < 128) return v;
      scale *= 128;
    }
  }
}

const zig = (v: number) => (v >= 0 ? v * 2 : -v * 2 - 1);
const unzig = (z: number) => (z % 2 ? -(z + 1) / 2 : z / 2);

/** Bytes of `size`-byte values split into planes: every value's first byte, then every second byte... */
export function toPlanes(data: Uint8Array, size: number): Uint8Array {
  const n = data.length / size;
  const out = new Uint8Array(data.length);
  for (let i = 0; i < n; i++) for (let k = 0; k < size; k++) out[k * n + i] = data[i * size + k];
  return out;
}

/** `toPlanes` undone. */
export function fromPlanes(data: Uint8Array, size: number): Uint8Array {
  const n = data.length / size;
  const out = new Uint8Array(data.length);
  for (let i = 0; i < n; i++) for (let k = 0; k < size; k++) out[i * size + k] = data[k * n + i];
  return out;
}

/** Vertex numbers as varints: each one's distance back from one past the highest so far, zigzagged; `starts` restart the count (a block per part). */
export function packIndices(ix: ArrayLike<number>, starts: Set<number> = new Set()): Uint8Array {
  const out = new Out();
  let hi = 0;
  for (let i = 0; i < ix.length; i++) {
    if (starts.has(i)) hi = 0;
    const v = ix[i];
    out.varint(zig(hi - v));
    if (v >= hi) hi = v + 1;
  }
  return out.done();
}

/** `count` vertex numbers read back from `packIndices`'s bytes at `src`. */
function readIndices(src: In, count: number, starts: Set<number> = new Set()): Uint32Array {
  const ix = new Uint32Array(count);
  let hi = 0;
  for (let i = 0; i < count; i++) {
    if (starts.has(i)) hi = 0;
    const v = hi - unzig(src.varint());
    ix[i] = v;
    if (v >= hi) hi = v + 1;
  }
  return ix;
}

/** `count` vertex numbers from `packIndices`'s bytes. */
export function unpackIndices(data: Uint8Array, count: number, starts: Set<number> = new Set()): Uint32Array {
  return readIndices(new In(data), count, starts);
}

const STL_MAGIC = 0x31534d47; // "GMS1"

/** A triangle's normal as writeStl works it out (stl.ts), into `out` at `at` as three float32s. */
function normalInto(view: DataView, at: number, out: DataView): void {
  const p = (c: number, i: number) => view.getFloat32(at + 12 + c * 12 + i * 4, true);
  const ux = p(1, 0) - p(0, 0);
  const uy = p(1, 1) - p(0, 1);
  const uz = p(1, 2) - p(0, 2);
  const wx = p(2, 0) - p(0, 0);
  const wy = p(2, 1) - p(0, 1);
  const wz = p(2, 2) - p(0, 2);
  const nx = uy * wz - uz * wy;
  const ny = uz * wx - ux * wz;
  const nz = ux * wy - uy * wx;
  // Math.sqrt is exact in every engine (Math.hypot is not specified to the last bit); a normal that comes out
  // different from the file's is kept in the pack.
  const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  out.setFloat32(0, nx / l, true);
  out.setFloat32(4, ny / l, true);
  out.setFloat32(8, nz / l, true);
}

/** A binary STL packed: its header, a table of its distinct corners, each triangle's corner numbers and attribute, and any normal that is not the one worked out again. */
export function packStl(stl: Uint8Array): Uint8Array {
  const view = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
  const tris = stl.length >= 84 ? view.getUint32(80, true) : -1;
  if (stl.length !== 84 + tris * 50) throw new Error('Not a binary STL: its size does not match its triangle count');
  const seen = new Map<string, number>();
  const corners = new Out();
  const ix = new Uint32Array(tris * 3);
  const attrs = new Uint8Array(tris * 2);
  const odd: number[] = [];
  const n = new DataView(new ArrayBuffer(12));
  const nb = new Uint8Array(n.buffer);
  for (let t = 0; t < tris; t++) {
    const at = 84 + t * 50;
    for (let c = 0; c < 3; c++) {
      const o = at + 12 + c * 12;
      const key = `${view.getUint32(o, true)},${view.getUint32(o + 4, true)},${view.getUint32(o + 8, true)}`;
      let v = seen.get(key);
      if (v === undefined) {
        v = seen.size;
        seen.set(key, v);
        corners.bytes(stl.subarray(o, o + 12));
      }
      ix[t * 3 + c] = v;
    }
    attrs[t * 2] = stl[at + 48];
    attrs[t * 2 + 1] = stl[at + 49];
    normalInto(view, at, n);
    for (let k = 0; k < 12; k++)
      if (nb[k] !== stl[at + k]) {
        odd.push(t);
        break;
      }
  }
  const out = new Out();
  out.u32(STL_MAGIC);
  out.u32(tris);
  out.u32(seen.size);
  out.bytes(stl.subarray(0, 80));
  out.bytes(toPlanes(corners.done(), 4));
  out.bytes(toPlanes(attrs, 2));
  out.u32(odd.length);
  for (const t of odd) {
    out.u32(t);
    out.bytes(stl.subarray(84 + t * 50, 84 + t * 50 + 12));
  }
  out.bytes(packIndices(ix));
  const packed = out.done();
  const back = unpackStl(packed);
  if (back.length !== stl.length || back.some((b, i) => b !== stl[i])) throw new Error('The packed STL does not read back the same');
  return packed;
}

/** The binary STL `packStl` packed, byte for byte. */
export function unpackStl(pack: Uint8Array): Uint8Array {
  const src = new In(pack);
  if (src.u32() !== STL_MAGIC) throw new Error('Not a packed STL');
  const tris = src.u32();
  const verts = src.u32();
  const header = src.bytes(80);
  const corners = fromPlanes(src.bytes(verts * 12), 4);
  const attrs = fromPlanes(src.bytes(tris * 2), 2);
  const odd = new Map<number, Uint8Array>();
  for (let k = src.u32(); k > 0; k--) odd.set(src.u32(), src.bytes(12));
  const ix = readIndices(src, tris * 3);
  const stl = new Uint8Array(84 + tris * 50);
  const view = new DataView(stl.buffer);
  stl.set(header, 0);
  view.setUint32(80, tris, true);
  const n = new DataView(new ArrayBuffer(12));
  const nb = new Uint8Array(n.buffer);
  for (let t = 0; t < tris; t++) {
    const at = 84 + t * 50;
    for (let c = 0; c < 3; c++) {
      const v = ix[t * 3 + c];
      if (v >= verts) throw new Error('Packed STL names a corner it does not have');
      stl.set(corners.subarray(v * 12, v * 12 + 12), at + 12 + c * 12);
    }
    stl[at + 48] = attrs[t * 2];
    stl[at + 49] = attrs[t * 2 + 1];
    const kept = odd.get(t);
    if (kept) stl.set(kept, at);
    else {
      normalInto(view, at, n);
      stl.set(nb, at);
    }
  }
  return stl;
}
