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
  /** Kept uncompressed (stored), as an ePub's first file, `mimetype`, must be. */
  store?: boolean;
}

// CRC-32 (reflected polynomial 0xEDB88320, initial value and final XOR 0xFFFFFFFF),
// computed eight bytes at a time ("slicing-by-8") from eight 256-entry tables.
const CRC_TABLES = (() => {
  const t = new Uint32Array(256 * 8);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  for (let n = 0; n < 256; n++) for (let k = 1; k < 8; k++) t[k * 256 + n] = (t[(k - 1) * 256 + n] >>> 8) ^ t[t[(k - 1) * 256 + n] & 0xff];
  return t;
})();

/** Running CRC state over data[start, end); begin with 0xffffffff, finish with `^ 0xffffffff`. */
function crcRun(c: number, data: Uint8Array, start: number, end: number): number {
  const t = CRC_TABLES;
  let i = start;
  for (; i + 8 <= end; i += 8) {
    const lo = c ^ (data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24));
    c =
      t[1792 + (lo & 0xff)] ^
      t[1536 + ((lo >>> 8) & 0xff)] ^
      t[1280 + ((lo >>> 16) & 0xff)] ^
      t[1024 + (lo >>> 24)] ^
      t[768 + data[i + 4]] ^
      t[512 + data[i + 5]] ^
      t[256 + data[i + 6]] ^
      t[data[i + 7]];
  }
  for (; i < end; i++) c = t[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return c;
}

export function crc32(data: Uint8Array): number {
  return (crcRun(0xffffffff, data, 0, data.length) ^ 0xffffffff) >>> 0;
}

const CRC_SLICE = 1 << 20;

/** The same CRC-32, in 1 MiB slices with a hand-back to the event loop between them, so a large entry does not freeze the page. */
async function crc32Yielding(data: Uint8Array): Promise<number> {
  if (data.length <= CRC_SLICE) return crc32(data);
  let c = 0xffffffff;
  for (let at = 0; at < data.length; at += CRC_SLICE) {
    c = crcRun(c, data, at, Math.min(data.length, at + CRC_SLICE));
    await new Promise<void>((done) => setTimeout(done, 0));
  }
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
  if (entries.length > 0xffff) throw new Error('Too many entries for a non-ZIP64 archive');
  let maximumSize = 22;
  for (const entry of entries) {
    if (entry.name.length > 0xffff || enc.encode(entry.name).length > 0xffff) throw new Error('ZIP file name is too long');
    if (!Number.isSafeInteger(entry.data.length) || entry.data.length < 0 || entry.data.length >= 0xffffffff) throw new Error('ZIP file is too large');
    maximumSize += 76 + enc.encode(entry.name).length * 2 + entry.data.length;
    if (maximumSize >= 0xffffffff) throw new Error('Archive is too large for non-ZIP64 offsets');
  }
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
    if (canCompress() && !e.store && e.data.length > 64) {
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

/**
 * What listZip and readZip use when a caller passes none: 8192 entries and 256 MB unpacked, with
 * wide headroom over the web app's own downloads (about 40 MB) and every zip on the CD (273 KB
 * at most). Because each entry is inflated no further than its directory says, this also caps
 * the compression ratio a lying directory could claim.
 */
export const DEFAULT_ZIP_LIMITS: ZipLimits = { maxEntries: 8192, maxBytes: 256 * 1024 * 1024 };

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
  if (total !== cap) throw new Error('A file in the ZIP is shorter than its directory says');
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** An entry of a zip's directory, read only when asked (listZip). */
export interface ZipListing {
  name: string;
  /** Whether read() supports this entry’s compression method. */
  supported: boolean;
  /** Unpacked bytes, as the directory says. */
  size: number;
  /** Inflates it (stored and deflated entries; others give undefined). */
  read: () => Promise<Uint8Array | undefined>;
}

/**
 * A zip's files from its central directory, without inflating any (a self-extracting .EXE's
 * too, which is never run): an import looks for the
 * .gam files first and reads the rest only for the games picked (project/importScan.ts).
 */
export function listZip(bytes: Uint8Array, limits: ZipLimits = DEFAULT_ZIP_LIMITS): ZipListing[] {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let damage: Error | undefined;
  // A stored ZIP can have its own end record before ours, and a comment can contain one
  // after ours. Prefer the record reaching furthest, then the one enclosing the comment.
  const candidates: { offset: number; end: number }[] = [];
  for (let i = Math.max(0, bytes.length - 65557); i <= bytes.length - 22; i++) {
    if (v.getUint32(i, true) === 0x06054b50) candidates.push({ offset: i, end: i + 22 + v.getUint16(i + 20, true) });
  }
  candidates.sort((a, b) => Math.min(bytes.length, b.end) - Math.min(bytes.length, a.end) || a.offset - b.offset);
  for (const { offset, end } of candidates) {
    try {
      const entries = readDirectory(bytes, v, offset, limits, end === bytes.length || !isZip(bytes));
      if (end > bytes.length) throw new Error('Truncated ZIP archive comment');
      return entries;
    } catch (error) {
      if (!(error instanceof DirectoryError)) throw error;
      damage ??= error;
    }
  }
  throw damage ?? new Error('Not a ZIP file');
}

class DirectoryError extends Error {}

function readDirectory(bytes: Uint8Array, v: DataView, eocd: number, limits: ZipLimits, allowPrefix: boolean): ZipListing[] {
  const count = v.getUint16(eocd + 10, true);
  let declared = 0;
  // Offsets can be relative to the archive after a prefix (even another ZIP).
  // Apply the same shift to the directory and every local header it references.
  const dirSize = v.getUint32(eocd + 12, true);
  const dirAt = v.getUint32(eocd + 16, true);
  const shift = allowPrefix ? Math.max(0, eocd - dirSize - dirAt) : 0;
  const dirStart = dirAt + shift;
  if (dirStart + dirSize !== eocd) throw new DirectoryError('Damaged ZIP directory extent');
  if (v.getUint16(eocd + 8, true) !== count || count * 46 > dirSize) throw new DirectoryError('Damaged ZIP directory count');
  if (count > limits.maxEntries) throw new Error(`The ZIP holds ${count} entries, more than ${limits.maxEntries}`);
  let p = dirStart;
  const headers: [number, number][] = [];
  const dec = new TextDecoder();
  const out: ZipListing[] = [];
  for (let i = 0; i < count; i++) {
    if (p + 46 > eocd || v.getUint32(p, true) !== 0x02014b50) throw new DirectoryError('Damaged ZIP directory');
    const method = v.getUint16(p + 10, true);
    const expectedCrc = v.getUint32(p + 16, true);
    const size = v.getUint32(p + 20, true);
    const unpacked = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const localOffset = v.getUint32(p + 42, true) + shift;
    if (p + 46 + nameLen + extraLen + commentLen > eocd) throw new DirectoryError('Damaged ZIP directory entry');
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    // Folder entries carry no data. Sizes come from the central directory because the
    // local header's may be 0 when the writer used a data descriptor; its name and extra
    // lengths can differ from the directory's, so they are read from the local header.
    if (localOffset + 30 > dirStart || v.getUint32(localOffset, true) !== 0x04034b50) throw new DirectoryError('Damaged ZIP local header');
    const start = localOffset + 30 + v.getUint16(localOffset + 26, true) + v.getUint16(localOffset + 28, true);
    if (start > dirStart || start + size > dirStart) throw new DirectoryError('Damaged ZIP entry extent');
    headers.push([localOffset, start]);
    if (name.endsWith('/')) continue;
    if ((declared += unpacked) > limits.maxBytes) throw new Error(`The ZIP unpacks to more than ${limits.maxBytes} bytes`);
    const read = async (): Promise<Uint8Array | undefined> => {
      if (headers.some(([a, b]) => a < start + size && b > start)) throw new Error('ZIP data overlaps a local header');
      const body = bytes.subarray(start, start + size);
      let data: Uint8Array;
      if (method === 0) {
        // A stored entry is copied as is, so a directory that declares a size other than the
        // bytes it holds would slip past the size budget above.
        if (size !== unpacked) throw new Error(`The ZIP entry ${name} is damaged (its stored size does not match its declared size)`);
        data = body.slice();
      } else if (method === 8) {
        // The stream's own errors are TypeErrors with little or no message; say what is wrong.
        try {
          data = await inflateCapped(body, unpacked);
        } catch (e) {
          if (e instanceof TypeError) throw new Error(`The ZIP entry ${name} is damaged (its compressed data does not unpack)`, { cause: e });
          throw e;
        }
      } else return undefined;
      if ((await crc32Yielding(data)) !== expectedCrc) throw new Error(`The ZIP entry ${name} is damaged (CRC-32 mismatch)`);
      return data;
    };
    out.push({ name, size: unpacked, supported: method === 0 || method === 8, read });
  }
  if (p !== eocd) throw new DirectoryError('Damaged ZIP directory size');
  return out;
}

export async function readZip(bytes: Uint8Array, limits: ZipLimits = DEFAULT_ZIP_LIMITS): Promise<ZipEntry[]> {
  const out: ZipEntry[] = [];
  for (const e of listZip(bytes, limits)) {
    const data = await e.read();
    if (data) out.push({ name: e.name, data });
  }
  return out;
}

export function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06));
}
