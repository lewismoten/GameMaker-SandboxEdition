// A game "directory": DOS file names are case-insensitive, so names are stored lower case.

export class GameFiles {
  private files = new Map<string, Uint8Array>();
  /** Notified after any change. */
  onChange?: (name: string) => void;

  constructor(entries?: Iterable<[string, Uint8Array]>) {
    if (entries) for (const [n, b] of entries) this.files.set(normalize(n), b);
  }

  get(name: string | undefined): Uint8Array | undefined {
    return name ? this.files.get(normalize(name)) : undefined;
  }

  has(name: string | undefined): boolean {
    return !!name && this.files.has(normalize(name));
  }

  set(name: string, bytes: Uint8Array): void {
    const n = normalize(name);
    this.files.set(n, bytes);
    this.onChange?.(n);
  }

  delete(name: string): void {
    const n = normalize(name);
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
  return dot < 0 ? base.slice(0, 8) : `${base.slice(0, Math.min(dot, 8))}.${base.slice(dot + 1, dot + 4)}`;
}

/** Files only meaningful to DOS. */
export const IGNORED_FILE = /\.(exe|com|bat|drv|ico|bak|obj|map\.bak)$/i;

import type { OriginalExtras } from '../../scripts/cdGames';

export interface CatalogEntry {
  id: string;
  title: string;
  /** gameware: free samples that came with Game-Maker; shareware: play only. */
  kind: 'gameware' | 'shareware';
  /** Folder of the game's files, relative to the site root. */
  path: string;
  /** Shareware: the author's notice and registration details. */
  notice?: string;
  /** Shareware: CRC-32 of the .gam file. */
  gamCrc?: number;
  /** Total size of the game's files. */
  bytes?: number;
  /** Shareware: its DOS program name, e.g. ORB.EXE (shown, never served). */
  exe?: string;
  /** A few lines from the game's story or instructions. */
  blurb?: string;
  /** Credits, from the game's own screens or Wikipedia. */
  author?: string;
  company?: string;
  year?: number;
  /** Registration price as its author stated it ("Freeware" for free games). */
  price?: string;
  gam: string | null;
  files: string[];
  /** Size of each file in `files`, in bytes (missing from older catalogs). */
  sizes?: number[];
  /** Original games made for this project: label, box art, manual, sound card. */
  original?: OriginalExtras;
}

export async function loadCatalog(base = './games/'): Promise<CatalogEntry[]> {
  const res = await fetch(`${base}index.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function loadHostedGame(entry: CatalogEntry, base = './', onProgress?: (done: number, total: number) => void): Promise<GameFiles> {
  const files = new GameFiles();
  let done = 0;
  await Promise.all(
    entry.files.map(async (name) => {
      const res = await fetch(`${base}${entry.path}${name}`);
      if (res.ok) files.set(name, new Uint8Array(await res.arrayBuffer()));
      onProgress?.(++done, entry.files.length);
    }),
  );
  return files;
}

/** Loads files picked with <input type=file multiple> or webkitdirectory, or dropped. */
export async function loadFileList(list: Iterable<File>): Promise<GameFiles> {
  const files = new GameFiles();
  for (const f of list) {
    if (IGNORED_FILE.test(f.name)) continue;
    files.set(f.name, new Uint8Array(await f.arrayBuffer()));
  }
  return files;
}

/** "Eric-Jon Waugh · A-J Games · 1993" */
export function creditLine(g: Pick<CatalogEntry, 'author' | 'company' | 'year'>): string {
  return [g.author, g.company, g.year].filter(Boolean).join(' · ');
}
