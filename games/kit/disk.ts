// Writing a game's files into games/<id>/disk/, the way they would be on its floppy.
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

  /**
   * Replaces disk/ with these files and reports their total size. GAME_DISK_OUT, when set,
   * names another folder to write instead (checkGames.ts builds there to compare with disk/).
   */
  write(): number {
    const dir = process.env.GAME_DISK_OUT || this.dir;
    if (existsSync(dir)) rmSync(dir, { recursive: true });
    mkdirSync(dir, { recursive: true });
    let total = 0;
    for (const [name, bytes] of this.files) {
      writeFileSync(join(dir, name), bytes);
      total += bytes.length;
    }
    console.log(`${this.files.size} files, ${total.toLocaleString()} bytes -> ${dir}`);
    return total;
  }
}

/** Text the way DOS kept it: CR LF line ends, CP437 (ASCII here), ending with ^Z. */
export function dosText(s: string): Uint8Array {
  const t = s.replace(/\r?\n/g, '\r\n');
  return Uint8Array.from([...t].map((c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)));
}
