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

export function normalize(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() ?? name;
  return base.trim().toLowerCase();
}

/** Files only meaningful to DOS. */
export const IGNORED_FILE = /\.(exe|com|bat|drv|ico|bak|obj|map\.bak)$/i;

export interface CatalogEntry {
  id: string;
  title: string;
  gam: string | null;
  files: string[];
}

export async function loadCatalog(base = './games/'): Promise<CatalogEntry[]> {
  const res = await fetch(`${base}index.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function loadHostedGame(entry: CatalogEntry, base = './games/', onProgress?: (done: number, total: number) => void): Promise<GameFiles> {
  const files = new GameFiles();
  let done = 0;
  await Promise.all(
    entry.files.map(async (name) => {
      const res = await fetch(`${base}${entry.id}/${name}`);
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
