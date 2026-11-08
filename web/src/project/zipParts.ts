// A game's ZIP in two parts for the site: a .zpart file with the bytes only it has, and the
// stored (compressed) entry data it has in common with other games' ZIPs, kept once each in
// games/shared/<name>.bin (the DOS player, the kit's pictures). Joining them gives back the same
// ZIP, byte for byte. The build splits (scripts/zipShare.ts); the browser joins (project/sharedZip.ts).
//
// A .zpart file: "GMZP", a version byte, the header's length (uint32, little-endian), the header
// as JSON (PartHeader), then the ZIP's own bytes with each shared range left out.

/** Where shared data goes back in: [offset in the ZIP, length, blob name]. */
export type SharedRange = [offset: number, length: number, name: string];

export interface PartHeader {
  /** The joined ZIP's length in bytes. */
  size: number;
  /** In offset order. */
  shared: SharedRange[];
}

const MAGIC = [0x47, 0x4d, 0x5a, 0x50]; // GMZP
const VERSION = 1;

/** Each entry's stored data in a ZIP, as [start, length], in central directory order. */
export function zipDataRanges(zip: Uint8Array): [start: number, length: number][] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let end = zip.length - 22;
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error('zipParts: no end of central directory');
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true);
  const out: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zipParts: bad central directory');
    const stored = v.getUint32(p + 20, true);
    const local = v.getUint32(p + 42, true);
    if (v.getUint32(local, true) !== 0x04034b50) throw new Error('zipParts: bad local header');
    out.push([local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true), stored]);
    p += 46 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return out;
}

/** The .zpart file of `zip` without the `shared` ranges (in offset order, not overlapping). */
export function encodePart(zip: Uint8Array, shared: SharedRange[]): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify({ size: zip.length, shared } satisfies PartHeader));
  const own = zip.length - shared.reduce((n, [, length]) => n + length, 0);
  const out = new Uint8Array(9 + json.length + own);
  out.set(MAGIC);
  out[4] = VERSION;
  new DataView(out.buffer).setUint32(5, json.length, true);
  out.set(json, 9);
  let at = 9 + json.length;
  let from = 0;
  for (const [offset, length] of shared) {
    if (offset < from) throw new Error('zipParts: shared ranges out of order');
    out.set(zip.subarray(from, offset), at);
    at += offset - from;
    from = offset + length;
  }
  out.set(zip.subarray(from), at);
  return out;
}

/** A .zpart file's header and its own bytes. */
export function decodePart(part: Uint8Array): { header: PartHeader; own: Uint8Array } {
  if (part.length < 9 || MAGIC.some((m, i) => part[i] !== m) || part[4] !== VERSION) throw new Error('zipParts: not a .zpart file');
  const length = new DataView(part.buffer, part.byteOffset, part.byteLength).getUint32(5, true);
  const header = JSON.parse(new TextDecoder().decode(part.subarray(9, 9 + length))) as PartHeader;
  return { header, own: part.subarray(9 + length) };
}

/** The ZIP again, from a .zpart file and its shared data by name. */
export function joinPart(part: Uint8Array, blob: (name: string) => Uint8Array): Uint8Array {
  const { header, own } = decodePart(part);
  const out = new Uint8Array(header.size);
  let at = 0;
  let from = 0;
  for (const [offset, length, name] of header.shared) {
    const data = blob(name);
    if (data.length !== length) throw new Error(`zipParts: shared data ${name} is ${data.length} bytes, not ${length}`);
    out.set(own.subarray(from, from + offset - at), at);
    from += offset - at;
    out.set(data, offset);
    at = offset + length;
  }
  if (own.length - from !== header.size - at) throw new Error('zipParts: the .zpart file is the wrong length');
  out.set(own.subarray(from), at);
  return out;
}
