// A .tar.gz writer (and a reader, for tests): POSIX ustar archives, which keep each file's
// Unix mode, so the Linux download's programs and scripts unpack executable. Used by
// linuxApp.ts. Names longer than 100 bytes are split into the header's prefix field.

export interface TarEntry {
  /** A/B/c, with "/" between folders; a folder ends with "/". */
  path: string;
  data?: Uint8Array;
  /** Unix permission bits (0o755 for a program, 0o644 for a file). */
  mode?: number;
}

const enc = new TextEncoder();

function field(h: Uint8Array, at: number, len: number, value: string | Uint8Array): void {
  const bytes = typeof value === 'string' ? enc.encode(value) : value;
  if (bytes.length > len) throw new Error(`Tar field too long: ${typeof value === 'string' ? value : bytes.length}`);
  h.set(bytes, at);
}

const octal = (n: number, len: number) => n.toString(8).padStart(len - 1, '0');

/** Splits a path into the ustar name (≤ 100 bytes) and prefix (≤ 155 bytes). */
function splitPath(path: string): [name: string, prefix: string] {
  if (enc.encode(path).length <= 100) return [path, ''];
  for (let i = path.lastIndexOf('/', path.length - 2); i > 0; i = path.lastIndexOf('/', i - 1)) {
    const [prefix, name] = [path.slice(0, i), path.slice(i + 1)];
    if (enc.encode(name).length <= 100 && enc.encode(prefix).length <= 155) return [name, prefix];
  }
  throw new Error(`Path too long for a tar archive: ${path}`);
}

function header(e: TarEntry, mtime: number): Uint8Array {
  const h = new Uint8Array(512);
  const dir = e.path.endsWith('/');
  const [name, prefix] = splitPath(e.path);
  field(h, 0, 100, name);
  field(h, 100, 8, octal(e.mode ?? (dir ? 0o755 : 0o644), 8));
  field(h, 108, 8, octal(0, 8));
  field(h, 116, 8, octal(0, 8));
  field(h, 124, 12, octal(dir ? 0 : e.data?.length ?? 0, 12));
  field(h, 136, 12, octal(mtime, 12));
  h.fill(0x20, 148, 156); // the checksum counts its own field as spaces
  h[156] = dir ? 0x35 : 0x30; // '5' folder, '0' file
  field(h, 257, 6, 'ustar\0');
  field(h, 263, 2, '00');
  field(h, 265, 32, 'gamemaker');
  field(h, 297, 32, 'gamemaker');
  field(h, 345, 155, prefix);
  const sum = h.reduce((n, b) => n + b, 0);
  field(h, 148, 8, `${octal(sum, 7)}\0`);
  return h;
}

/** An uncompressed tar archive. */
export function createTar(entries: TarEntry[], date = new Date()): Uint8Array {
  const mtime = Math.floor(date.getTime() / 1000);
  const parts: Uint8Array[] = [];
  for (const e of entries) {
    parts.push(header(e, mtime));
    if (e.data && !e.path.endsWith('/')) {
      parts.push(e.data);
      if (e.data.length % 512) parts.push(new Uint8Array(512 - (e.data.length % 512)));
    }
  }
  parts.push(new Uint8Array(1024)); // two empty blocks end it
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

/** A .tar.gz archive. */
export async function createTarGz(entries: TarEntry[], date?: Date): Promise<Uint8Array> {
  return pipe(createTar(entries, date), new CompressionStream('gzip'));
}

/** Reads a tar (or .tar.gz) archive's entries: path, mode and data. */
export async function readTar(bytes: Uint8Array): Promise<Required<TarEntry>[]> {
  const tar = bytes[0] === 0x1f && bytes[1] === 0x8b ? await pipe(bytes, new DecompressionStream('gzip')) : bytes;
  const dec = new TextDecoder();
  const text = (at: number, len: number) => dec.decode(tar.subarray(at, at + len)).replace(/\0.*$/s, '');
  const out: Required<TarEntry>[] = [];
  for (let at = 0; at + 512 <= tar.length; ) {
    if (tar.subarray(at, at + 512).every((b) => b === 0)) break;
    const sum = parseInt(text(at + 148, 8).trim(), 8);
    const check = tar.subarray(at, at + 512).reduce((n, b, i) => n + (i >= 148 && i < 156 ? 0x20 : b), 0);
    if (sum !== check) throw new Error('Bad tar header checksum.');
    const prefix = text(at + 345, 155);
    const path = (prefix ? `${prefix}/` : '') + text(at, 100);
    const size = parseInt(text(at + 124, 12), 8);
    out.push({ path, mode: parseInt(text(at + 100, 8), 8), data: tar.slice(at + 512, at + 512 + size) });
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}
