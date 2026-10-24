// Minimal ZIP reader/writer using the platform's (de)compression streams.
// Writes deflate (falling back to stored); reads stored and deflated entries.
// Used to import and export game projects and to build the DOS and web app downloads.
// This is not a port of anything in the original Game-Maker.
//
// Layout (PKWARE APPNOTE; a copy is in code/GM/APPNOTE.TXT): for each file a local header
// (signature 0x04034B50, 30 bytes + name) and its data, then the central directory (one
// 0x02014B50 entry, 46 bytes + name + extra + comment, per file, pointing back at its
// local header), then the end of central directory record (0x06054B50, 22 bytes + comment)
// giving the entry count, directory size and directory offset. ZIP64 and encryption are
// not supported; the writer uses no data descriptors.

export interface ZipEntry {
  name: string;
  data: Uint8Array;
  /** Unix file mode (e.g. 0o100755 for a program); stored so unzipping keeps it executable. */
  mode?: number;
}

// CRC-32 (reflected polynomial 0xEDB88320, initial value and final XOR 0xFFFFFFFF),
// computed a byte at a time from a 256-entry table.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function transform(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== 'undefined';

// MS-DOS time (hour << 11 | minute << 5 | second / 2) and date ((year - 1980) << 9 |
// month << 5 | day), in local time; years before 1980 cannot be stored.
function dosDateTime(d: Date): [number, number] {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return [time, date];
}

export async function createZip(entries: ZipEntry[], date = new Date()): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const [time, day] = dosDateTime(date);
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    let method = 0;
    let body = e.data;
    // Method 8 is deflate; the zip stores raw deflate data (no zlib header). Tiny files and
    // files that do not shrink are stored (method 0).
    if (canCompress() && e.data.length > 64) {
      const deflated = await transform(e.data, new CompressionStream('deflate-raw'));
      if (deflated.length < e.data.length) {
        method = 8;
        body = deflated;
      }
    }
    // Local header: signature, version needed (2.0), flags, method, time, date, CRC,
    // compressed size, uncompressed size, name length, extra length (0), then the name.
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true); // UTF-8 names
    h.setUint16(8, method, true);
    h.setUint16(10, time, true);
    h.setUint16(12, day, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, body.length, true);
    h.setUint32(22, e.data.length, true);
    h.setUint16(26, name.length, true);
    local.push(new Uint8Array(h.buffer), name, body);

    // Central directory entry: the same fields after "version made by", plus extra and
    // comment lengths, disk, attributes (all 0 here) and the local header's offset at +42.
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, method, true);
    c.setUint16(12, time, true);
    c.setUint16(14, day, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, body.length, true);
    c.setUint32(24, e.data.length, true);
    c.setUint16(28, name.length, true);
    // A Unix mode goes in the high half of the external attributes, "made by" Unix (3).
    if (e.mode !== undefined) {
      c.setUint16(4, (3 << 8) | 20, true);
      c.setUint32(38, (e.mode << 16) >>> 0, true);
    }
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const centralSize = central.reduce((n, p) => n + p.length, 0);
  // End of central directory: entries on this disk and in total, directory size, and the
  // directory's offset, which is where the local records end.
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const parts = [...local, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Limits for a zip from somewhere untrusted (linkIn/): more entries or bytes than these throw. */
export interface ZipLimits {
  maxEntries: number;
  /** Unpacked bytes in all, as the directory says and as actually inflated. */
  maxBytes: number;
}

/** Inflates at most `cap` bytes; a stream that would give more throws (a zip bomb, or a lying directory). */
async function inflateCapped(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new Error('A file in the ZIP is bigger than its directory says');
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export async function readZip(bytes: Uint8Array, limits?: ZipLimits): Promise<ZipEntry[]> {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  // The end record is 22 bytes plus a comment of up to 65535 bytes, so scan back from the
  // end of the file at most that far for its signature.
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Not a ZIP file');
  const count = v.getUint16(eocd + 10, true);
  if (limits && count > limits.maxEntries) throw new Error(`The ZIP holds ${count} entries, more than ${limits.maxEntries}`);
  let declared = 0;
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('Damaged ZIP directory');
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const unpacked = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const localOffset = v.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    // Folder entries carry no data. Sizes come from the central directory because the
    // local header's may be 0 when the writer used a data descriptor; its name and extra
    // lengths can differ from the directory's, so they are read from the local header.
    // CRCs are not checked, and entries using other methods are skipped.
    if (name.endsWith('/')) continue;
    const lNameLen = v.getUint16(localOffset + 26, true);
    const lExtraLen = v.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const body = bytes.subarray(start, start + size);
    if (limits && (declared += unpacked) > limits.maxBytes) throw new Error(`The ZIP unpacks to more than ${limits.maxBytes} bytes`);
    if (method === 0) out.push({ name, data: body.slice() });
    else if (method === 8)
      out.push({ name, data: limits ? await inflateCapped(body, unpacked) : await transform(body, new DecompressionStream('deflate-raw')) });
  }
  return out;
}

export function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}
