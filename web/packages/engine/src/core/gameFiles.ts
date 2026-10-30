// A game "directory": DOS file names are case-insensitive, so names are stored lower case.

/** Files of a game still on their way from the site (project/streamGame.ts). */
export interface FileStream {
  /** Resolves once these files are in, or known not to come; undefined when none is still coming. */
  need(names: string[]): Promise<void> | undefined;
  /** Fetches these next, without waiting for them. */
  want(names: string[]): void;
}

export class GameFiles {
  private files = new Map<string, Uint8Array>();
  /** Notified after any change. */
  onChange?: (name: string) => void;
  /** Set while files are still arriving: the game waits for one it needs (engine/machine.ts, need). */
  stream?: FileStream;
  /** Asked before set or delete changes a file; throws to refuse (a game opened to look inside, editor/core/readOnly.ts). */
  guard?: (name: string) => void;

  constructor(entries?: Iterable<[string, Uint8Array]>) {
    if (entries) for (const [n, b] of entries) this.files.set(normalize(n), b);
  }

  get(name: string | undefined): Uint8Array | undefined {
    return name ? (this.files.get(normalize(name)) ?? this.files.get(cdName(name))) : undefined;
  }

  has(name: string | undefined): boolean {
    return !!name && (this.files.has(normalize(name)) || this.files.has(cdName(name)));
  }

  /** The stored name a reference opens (see cdName), or undefined when there is none. */
  resolve(name: string | undefined): string | undefined {
    if (!name) return undefined;
    const n = normalize(name);
    if (this.files.has(n)) return n;
    const c = cdName(name);
    return this.files.has(c) ? c : undefined;
  }

  set(name: string, bytes: Uint8Array): void {
    const n = normalize(name);
    this.guard?.(n);
    this.files.set(n, bytes);
    this.onChange?.(n);
  }

  /**
   * A copy of these files to change freely. While files are still arriving here, the copy
   * gets them too as it needs them (its own changes stay).
   */
  copy(): GameFiles {
    const copy = new GameFiles(this.entries());
    if (!this.stream) return copy;
    const fill = (names: string[]) => {
      for (const n of names) {
        const at = this.resolve(n);
        if (at && !copy.has(at)) copy.put(at, this.get(at)!);
      }
    };
    copy.stream = {
      need: (names) => {
        fill(names);
        return this.stream?.need(names)?.then(() => fill(names));
      },
      want: (names) => this.stream?.want(names),
    };
    return copy;
  }

  /** Adds a file that arrived (not one the game wrote): onChange is not told, and a file already here stays. */
  put(name: string, bytes: Uint8Array): void {
    const n = normalize(name);
    if (!this.files.has(n)) this.files.set(n, bytes);
  }

  delete(name: string): void {
    const n = normalize(name);
    this.guard?.(n);
    this.files.delete(n);
    this.onChange?.(n);
  }

  names(): string[] {
    return [...this.files.keys()].sort();
  }

  entries(): [string, Uint8Array][] {
    return this.names().map((n) => [n, this.files.get(n)!]);
  }

  byExtension(ext: string): string[] {
    const e = ext.startsWith('.') ? ext : `.${ext}`;
    return this.names().filter((n) => n.endsWith(e));
  }

  get size(): number {
    return this.files.size;
  }

  /** The .gam file to play: the one named like the folder, else the first. */
  mainGame(preferred?: string): string | undefined {
    const gams = this.byExtension('gam');
    if (preferred && gams.includes(normalize(preferred))) return normalize(preferred);
    return gams[0];
  }
}

/**
 * File names as DOS saw them: lower case, without folders, and cut to 8.3. DOS dropped the
 * extra letters silently, so games could name "nejillian.gif" and open NEJILLIA.GIF.
 */
export function normalize(name: string): string {
  const base = (name.replace(/\\/g, '/').split('/').pop() ?? name).trim().toLowerCase();
  const dot = base.indexOf('.');
  // DOS reads "NAME." (an empty extension, as a player with its extensions blanked asks for) as "NAME"
  const ext = dot < 0 ? '' : base.slice(dot + 1, dot + 4).trim();
  return ext ? `${base.slice(0, Math.min(dot, 8))}.${ext}` : base.slice(0, dot < 0 ? 8 : Math.min(dot, 8));
}

/**
 * The name a file got on the Game-Maker CD. Its ISO 9660 copy allowed only A-Z, 0-9 and _,
 * so A-J.BKD, PARSEC-W.GIF and CAN'T.GIF are a_j.bkd, parsec_w.gif and can_t.gif there,
 * while the games still name them the DOS way. A name not found as is is looked up this way.
 */
export function cdName(name: string): string {
  return normalize(name).replace(/[^a-z0-9_.]/g, '_');
}

/** Files only meaningful to DOS. */
export const IGNORED_FILE = /\.(exe|com|bat|drv|ico|bak|obj|map\.bak)$/i;
