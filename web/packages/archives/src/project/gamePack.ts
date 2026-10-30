// A hosted game in one file (games/<kind>/<id>/<id>.<hash>.gmpak, written by scripts/cdGames.ts):
// its files one after another, in the order play first needs them (project/streamGame.ts,
// packOrder), the whole gzipped. One request instead of a hundred, and smaller too: gzip
// finds what the files have in common. Read as it arrives, so a game can start once its
// .gam is in while the rest keeps coming.
//
//   "GMPK" u8 version (1)
//   per file: u8 name length (1-255), name (ASCII), u32 size (little-endian), bytes
//   u8 0: the end
//
// The original files stay on the site as they are (links, exports); this is only how the
// site fetches them.

const MAGIC = [0x47, 0x4d, 0x50, 0x4b]; // GMPK
const VERSION = 1;

/** The container of these files (not compressed). */
export function encodePack(entries: Iterable<[string, Uint8Array]>): Uint8Array {
  const parts: Uint8Array[] = [new Uint8Array([...MAGIC, VERSION])];
  for (const [name, bytes] of entries) {
    const n = new TextEncoder().encode(name);
    if (!n.length || n.length > 255) throw new Error(`gamePack: bad file name ${JSON.stringify(name)}`);
    const head = new Uint8Array(1 + n.length + 4);
    head[0] = n.length;
    head.set(n, 1);
    new DataView(head.buffer).setUint32(1 + n.length, bytes.length, true);
    parts.push(head, bytes);
  }
  parts.push(new Uint8Array([0]));
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/**
 * Reads a pack as its bytes come in: push() each chunk (already unzipped) and get the files
 * it completed. `done` once the end mark is read.
 */
export class PackReader {
  private chunks: Uint8Array[] = [];
  private total = 0;
  /** Bytes the next step needs (it waits until that many are in, so a big file is joined once). */
  private want = 5;
  private started = false;
  done = false;

  push(chunk: Uint8Array): [string, Uint8Array][] {
    const out: [string, Uint8Array][] = [];
    if (this.done || !chunk.length) return out;
    this.chunks.push(chunk);
    this.total += chunk.length;
    if (this.total < this.want) return out;
    const b = this.chunks.length === 1 ? this.chunks[0] : join(this.chunks, this.total);
    let at = 0;
    if (!this.started) {
      if (MAGIC.some((m, i) => b[i] !== m) || b[4] !== VERSION) throw new Error('gamePack: not a game pack');
      this.started = true;
      at = 5;
    }
    this.want = 1;
    while (at < b.length) {
      const len = b[at];
      if (len === 0) {
        this.done = true;
        at++;
        break;
      }
      if (at + 1 + len + 4 > b.length) {
        this.want = 1 + len + 4;
        break;
      }
      const size = new DataView(b.buffer, b.byteOffset + at + 1 + len, 4).getUint32(0, true);
      const start = at + 1 + len + 4;
      if (start + size > b.length) {
        this.want = 1 + len + 4 + size;
        break;
      }
      out.push([String.fromCharCode(...b.subarray(at + 1, at + 1 + len)), b.slice(start, start + size)]);
      at = start + size;
    }
    const rest = b.subarray(at);
    this.chunks = rest.length ? [rest] : [];
    this.total = rest.length;
    return out;
  }
}

function join(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** Every file of a whole pack (not compressed). */
export function decodePack(bytes: Uint8Array): [string, Uint8Array][] {
  const r = new PackReader();
  const files = r.push(bytes);
  if (!r.done) throw new Error('gamePack: the pack is cut short');
  return files;
}
