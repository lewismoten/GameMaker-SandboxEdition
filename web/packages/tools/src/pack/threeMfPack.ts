// A 3MF that write3mf wrote (mesh/threeMf.ts), packed so a site can serve a small file and make the 3MF in the browser:
// its title, and each part's name, color, corners and triangles. write3mf writes every corner in thousandths of a
// millimeter, so a corner is three whole numbers here (each axis as varint steps from the corner before), and the
// triangles' corner numbers are meshPack's varints. `pack3mf` refuses a file whose inner files it cannot make again
// byte for byte; zipped again, the 3MF's deflate may differ from the first one's, its contents do not.
import { packIndices, unpackIndices } from './meshPack';
import { write3mf, type Part } from '../mesh/threeMf';
import { readZip, type ZipCodec, type ZipEntry } from '../mesh/zipFile';

/** The files inside the 3MF write3mf writes for these parts, before any deflate (write3mf stores them when given no codec). */
export function threeMfEntries(parts: Part[], title: string): ZipEntry[] {
  return readZip(write3mf(parts, title));
}

const MAGIC = 0x4d334d47; // "GM3M"
const unesc = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
const zig = (v: number) => (v >= 0 ? v * 2 : -v * 2 - 1);
const unzig = (z: number) => (z % 2 ? -(z + 1) / 2 : z / 2);

function varints(values: ArrayLike<number>, out: number[]): void {
  for (let i = 0; i < values.length; i++) {
    let v = values[i];
    while (v >= 128) {
      out.push((v % 128) | 128);
      v = Math.floor(v / 128);
    }
    out.push(v);
  }
}

interface Packed {
  title: string;
  parts: { name: string; color: [number, number, number]; ints: Int32Array; indices: Uint32Array }[];
}

/** The model's title and parts, corners in thousandths, from its XML. */
function parseModel(text: string): Packed {
  const title = unesc(/<metadata name="Title">([^<]*)<\/metadata>/.exec(text)?.[1] ?? '');
  const colors = [...text.matchAll(/<base name="[^"]*" displaycolor="#([0-9A-F]{6})"\/>/g)].map((m) =>
    [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)),
  );
  const parts: Packed['parts'] = [];
  for (const o of text.matchAll(/<object id="\d+" type="model" name="([^"]*)" pid="1" pindex="(\d+)">([\s\S]*?)<\/object>/g)) {
    const color = colors[Number(o[2])];
    if (!color) throw new Error('A 3MF part names a color it does not have');
    const ints: number[] = [];
    for (const m of o[3].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)) ints.push(...[m[1], m[2], m[3]].map((s) => Math.round(Number(s) * 1000)));
    const indices: number[] = [];
    for (const m of o[3].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)) indices.push(Number(m[1]), Number(m[2]), Number(m[3]));
    parts.push({ name: unesc(o[1]), color: color as [number, number, number], ints: Int32Array.from(ints), indices: Uint32Array.from(indices) });
  }
  return { title, parts };
}

const asParts = (p: Packed): Part[] =>
  p.parts.map((q) => ({ name: q.name, color: q.color, mesh: { positions: Float32Array.from(q.ints, (k) => k / 1000), indices: q.indices } }));

const same = (a: ZipEntry[], b: ZipEntry[]) =>
  a.length === b.length && a.every((e, i) => e.name === b[i].name && e.data.length === b[i].data.length && e.data.every((v, k) => v === b[i].data[k]));

/** A 3MF from write3mf, packed (deflate the result); throws when its inner files would not come back the same. */
export function pack3mf(file: Uint8Array, codec: Pick<ZipCodec, 'inflate'>): Uint8Array {
  const entries = readZip(file, codec);
  const model = entries.find((e) => e.name === '3D/3dmodel.model');
  if (!model) throw new Error('No 3D/3dmodel.model in the file');
  const packed = parseModel(new TextDecoder().decode(model.data));
  if (!same(threeMfEntries(asParts(packed), packed.title), entries)) throw new Error('This 3MF would not be made again the same: not one write3mf wrote');
  const enc = new TextEncoder();
  const head: number[] = [];
  const text = (s: string) => {
    const b = enc.encode(s);
    varints([b.length], head);
    head.push(...b);
  };
  text(packed.title);
  varints([packed.parts.length], head);
  const body: number[] = [];
  for (const p of packed.parts) {
    text(p.name);
    head.push(...p.color);
    varints([p.ints.length / 3, p.indices.length / 3], head);
    for (let axis = 0; axis < 3; axis++) {
      const steps: number[] = [];
      let prev = 0;
      for (let v = axis; v < p.ints.length; v += 3) {
        steps.push(zig(p.ints[v] - prev));
        prev = p.ints[v];
      }
      varints(steps, body);
    }
    const ix = packIndices(p.indices);
    varints([ix.length], body);
    for (const b of ix) body.push(b);
  }
  const out = new Uint8Array(8 + head.length + body.length);
  new DataView(out.buffer).setUint32(0, MAGIC, true);
  new DataView(out.buffer).setUint32(4, head.length, true);
  out.set(head, 8);
  out.set(body, 8 + head.length);
  return out;
}

/** A packed 3MF's title and parts, ready for write3mf or threeMfEntries. */
export function unpack3mf(pack: Uint8Array): { title: string; parts: Part[] } {
  const view = new DataView(pack.buffer, pack.byteOffset, pack.byteLength);
  if (pack.length < 8 || view.getUint32(0, true) !== MAGIC) throw new Error('Not a packed 3MF');
  let at = 8;
  const varint = () => {
    let v = 0;
    let scale = 1;
    for (;;) {
      if (at >= pack.length) throw new Error('Packed 3MF is cut short');
      const b = pack[at++];
      v += (b & 127) * scale;
      if (b < 128) return v;
      scale *= 128;
    }
  };
  const dec = new TextDecoder();
  const text = () => {
    const n = varint();
    const s = dec.decode(pack.subarray(at, at + n));
    at += n;
    return s;
  };
  const title = text();
  const heads = Array.from({ length: varint() }, () => {
    const name = text();
    const color = [pack[at], pack[at + 1], pack[at + 2]] as [number, number, number];
    at += 3;
    return { name, color, verts: varint(), tris: varint() };
  });
  const parts: Packed['parts'] = heads.map((h) => {
    const ints = new Int32Array(h.verts * 3);
    for (let axis = 0; axis < 3; axis++) {
      let prev = 0;
      for (let v = axis; v < ints.length; v += 3) ints[v] = prev += unzig(varint());
    }
    const n = varint();
    const indices = unpackIndices(pack.subarray(at, at + n), h.tris * 3);
    at += n;
    return { name: h.name, color: h.color, ints, indices };
  });
  return { title, parts: asParts({ title, parts }) };
}
