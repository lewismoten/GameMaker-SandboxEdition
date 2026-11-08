// Portable DOS disk output: callers own destination, metadata, and version-stamping policy.
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeIdenticalPalettes } from './palMerge';
export class Disk {
  readonly files = new Map<string, Uint8Array>();
  constructor(readonly dir: string) {}
  /** Adds a file (8.3 name, lower case on disk). */
  put(name: string, bytes: Uint8Array | string): void {
    if (!/^[a-z0-9_$~!#%&-]{1,8}\.[a-z0-9]{1,3}$/i.test(name)) throw new Error(`${name} is not a DOS 8.3 file name`);
    this.files.set(name.toLowerCase(), typeof bytes === 'string' ? dosText(bytes) : bytes);
  }

  /**
   * Replace the selected output directory's contents with the collected native files. Each file
   * is written beside its place and renamed over it, and leftovers go last, so a server reading
   * the folder during a rebuild never finds a file missing or half written.
   */
  write(dir = this.dir): number {
    mergeIdenticalPalettes(this.files);
    mkdirSync(dir, { recursive: true });
    let total = 0;
    for (const [name, bytes] of this.files) {
      const part = join(dir, `.${name}.${process.pid}.part`);
      writeFileSync(part, bytes);
      renameSync(part, join(dir, name));
      total += bytes.length;
    }
    for (const name of readdirSync(dir)) if (!this.files.has(name)) rmSync(join(dir, name), { recursive: true, force: true });
    return total;
  }
}
/** Legacy eight-bit text with CR LF line endings; out-of-range characters become question marks. */
export function dosText(s: string): Uint8Array {
  const t = s.replace(/\r?\n/g, '\r\n');
  return Uint8Array.from([...t].map((c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)));
}
