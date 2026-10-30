// Portable DOS disk output: callers own destination, metadata, and version-stamping policy.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export class Disk {
  readonly files = new Map<string, Uint8Array>();
  constructor(readonly dir: string) {}
  /** Adds a file (8.3 name, lower case on disk). */
  put(name: string, bytes: Uint8Array | string): void {
    if (!/^[a-z0-9_$~!#%&-]{1,8}\.[a-z0-9]{1,3}$/i.test(name)) throw new Error(`${name} is not a DOS 8.3 file name`);
    this.files.set(name.toLowerCase(), typeof bytes === 'string' ? dosText(bytes) : bytes);
  }

  /** Replace the selected output directory with the collected native files. */
  write(dir = this.dir): number {
    if (existsSync(dir)) rmSync(dir, { recursive: true });
    mkdirSync(dir, { recursive: true });
    let total = 0;
    for (const [name, bytes] of this.files) {
      writeFileSync(join(dir, name), bytes);
      total += bytes.length;
    }
    return total;
  }
}
/** Legacy eight-bit text with CR LF line endings; out-of-range characters become question marks. */
export function dosText(s: string): Uint8Array {
  const t = s.replace(/\r?\n/g, '\r\n');
  return Uint8Array.from([...t].map((c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)));
}
