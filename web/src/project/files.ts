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

import type { OriginalExtras } from '../../scripts/cdGames';
import { withSecretGames } from './secretGames';
import { PackReader } from './gamePack';
import type { Issue } from './health';

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
  /** Original games: a series of their own ("bizarre": The Bard of Bizarre's, see bizarre.ts). */
  series?: string;
  /** Built sites: every file but the .gif pictures has a gzip copy beside it (<file>.gz, see packedUrl). */
  gz?: boolean;
  /** Built sites: all its files in one gzipped file in its folder (project/gamePack.ts, openPack), named with a hash of its content. */
  pack?: string;
  /** Built sites: what the quick check (project/health.ts) finds in it, so no file need be fetched to know. */
  health?: Issue[];
  /** From games/catalog.json: its notice, manual and printables are in games/details/<id>.json (withDetails). */
  details?: boolean;  /** Original games: the site path of its walkthrough (src/walkthrough), when it has one. */
  walkthrough?: string;
  /** Built sites: its pictures are drawn already (games/shots/, gfx/levelPicture.ts builtShotPath). */
  shots?: boolean;
  /** …and its hero (games/shots/<id>-hero.png, gfx/levelPicture.ts builtHeroPath). */
  heroShot?: boolean;
}

/** The publisher of the games made for this project (games/<id>/about.json "company"). */
export const SANDBOX_COMPANY = 'Sandbox Software';

/**
 * A Sandbox Software game: one of ours, with its box, disk and manual. Other games built in
 * ../games under another publisher's name (a BBS download such as The Bard of Bizarre's)
 * are listed with the shareware instead.
 */
export function isSandboxGame(g: Pick<CatalogEntry, 'original' | 'company'>): boolean {
  return !!g.original && (g.company ?? SANDBOX_COMPANY) === SANDBOX_COMPANY;
}

const catalogs = new Map<string, Promise<CatalogEntry[]>>();

/** Forgets the fetched catalogs, so the next load lists what is current (a secret game revealed). */
export function forgetCatalog(): void {
  catalogs.clear();
}
// EGG.EXE adding or breaking an egg can reveal (or hide again) a secret game.
if (typeof window !== 'undefined') window.addEventListener('gm-eggs-changed', forgetCatalog);

/**
 * The games catalog (games/index.json, about 300 kB). Many parts of the page ask for it;
 * it is fetched once and shared. A failed fetch is forgotten so a later call retries.
 */
export function loadCatalog(base = './games/'): Promise<CatalogEntry[]> {
  let p = catalogs.get(base);
  if (!p) {
    p = fetch(`${base}index.json`)
      .then((res) => (res.ok ? (res.json() as Promise<CatalogEntry[]>) : []))
      .then((list) => withSecretGames(list, base));
    p.catch(() => catalogs.delete(base));
    catalogs.set(base, p);
  }
  return p;
}

/** A JSON file, or undefined when it isn't there (a dev server answers a missing file with index.html). */
async function fetchJson<T>(url: string): Promise<T | undefined> {
  const res = await fetch(url);
  return res.ok && res.headers.get('content-type')?.includes('json') ? ((await res.json()) as T) : undefined;
}

/**
 * The games without their shareware notices, manuals and printables (games/catalog.json,
 * an eighth of index.json): for a page that only needs the list, such as the play page.
 * The full catalog when it is loaded already, or there is no short one.
 */
export function loadCatalogList(base = './games/'): Promise<CatalogEntry[]> {
  const full = catalogs.get(base);
  if (full) return full;
  const key = `${base}catalog.json`;
  let p = catalogs.get(key);
  if (!p) {
    p = fetchJson<CatalogEntry[]>(key).then((list) => (list ? withSecretGames(list, base) : loadCatalog(base)));
    p.catch(() => catalogs.delete(key));
    catalogs.set(key, p);
  }
  return p;
}

/**
 * The list the home page, the shelf and the disk box draw from: games/catalog.json (a quarter
 * of index.json; manuals hold only their title until withDetails). The development server
 * hands out the full catalog instead: it serves catalog.json from whatever scripts/cdGames.ts
 * it was started with, which may be older than this page.
 */
export function loadGameList(base = './games/'): Promise<CatalogEntry[]> {
  return import.meta.env?.DEV ? loadCatalog(base) : loadCatalogList(base);
}

/** An entry with its shareware notice, manual and printables (games/details/<id>.json), for one from loadCatalogList. */
export async function withDetails(entry: CatalogEntry, base = './games/'): Promise<CatalogEntry> {
  if (!entry.details) return entry; // nothing left out, or a full entry
  const details = await fetchJson<Pick<CatalogEntry, 'notice' | 'original'>>(`${base}details/${entry.id}.json`).catch(() => undefined);
  if (!details) return (await loadCatalog(base)).find((g) => g.id === entry.id) ?? entry;
  return { ...entry, notice: details.notice, original: entry.original || details.original ? { ...entry.original, ...details.original } : undefined };
}

// Hosted game files fetched this session, shared by everything that asks for the same
// file at once (box art, thumbnails, health checks, the player). Settled files are kept
// up to a budget, then the oldest are dropped (the browser's HTTP cache still has them).
const fileCache = new Map<string, { p: Promise<Uint8Array | undefined>; size: number }>();
const FILE_CACHE_BYTES = 24 << 20;
let cachedBytes = 0;

function trimFileCache(): void {
  for (const [url, e] of fileCache) {
    if (cachedBytes <= FILE_CACHE_BYTES) return;
    if (!e.size) continue; // still loading
    fileCache.delete(url);
    cachedBytes -= e.size;
  }
}

/**
 * GitHub Pages compresses text but sends game files (.bbl, .map, .fli…) as they are, and
 * they shrink 3 to 20 times; so the build keeps a gzip copy of each beside it. The copy to
 * fetch for a file, or undefined when there is none (GIFs are compressed already) or this
 * browser cannot unpack it.
 */
export function packedUrl(url: string, gz: boolean | undefined): string | undefined {
  return gz && !/\.gif$/i.test(url) && typeof DecompressionStream !== 'undefined' ? `${url}.gz` : undefined;
}

/** A file's bytes, from its gzip copy when there is one (else, or if that fails, the file itself). */
async function fetchBytes(url: string, gz: boolean | undefined): Promise<Uint8Array | undefined> {
  const packed = packedUrl(url, gz);
  if (packed) {
    try {
      const res = await fetch(packed);
      if (res.ok && res.body) return new Uint8Array(await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    } catch {
      /* fall back to the file itself */
    }
  }
  const res = await fetch(url);
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : undefined;
}

/**
 * Bytes of one file at a site-relative URL (e.g. games/gameware/sample/sample.gam), fetched once. Shared: do not modify them.
 * `gz`: the file has a gzip copy beside it (a catalog entry's `gz`).
 */
export function fetchSiteFile(url: string, gz?: boolean): Promise<Uint8Array | undefined> {
  const hit = fileCache.get(url);
  if (hit) {
    // most recently used last
    fileCache.delete(url);
    fileCache.set(url, hit);
    return hit.p;
  }
  const entry = { p: Promise.resolve<Uint8Array | undefined>(undefined), size: 0 };
  entry.p = fetchBytes(url, gz).then(
    (bytes) => {
      if (!bytes) fileCache.delete(url);
      else if (fileCache.get(url) === entry) {
        entry.size = bytes.length || 1;
        cachedBytes += entry.size;
        trimFileCache();
      }
      return bytes;
    },
    () => {
      fileCache.delete(url);
      return undefined;
    },
  );
  fileCache.set(url, entry);
  return entry.p;
}

// ---- a game in one file (project/gamePack.ts) ------------------------------------------

interface Pack {
  /** Files in so far. */
  files: Map<string, Uint8Array>;
  listeners: Set<(name: string, bytes: Uint8Array) => void>;
  /** true once every file is in; false when it failed or was stopped. */
  done: Promise<boolean>;
  complete: boolean;
  /** Readers that may still stop it (openPack): the download stops when the last one does. */
  holders: number;
  abort: AbortController;
  size: number;
}

// Packs read this session, shared like fileCache: the oldest whole ones are dropped past the budget.
const packs = new Map<string, Pack>();

function trimPacks(): void {
  let total = [...packs.values()].reduce((a, p) => a + p.size, 0);
  for (const [url, p] of packs) {
    if (total <= FILE_CACHE_BYTES) return;
    if (!p.complete) continue;
    packs.delete(url);
    total -= p.size;
  }
}

/** Where a hosted game's pack is, or undefined when it has none (or this browser cannot unpack it). */
export function packUrl(entry: Pick<CatalogEntry, 'path' | 'pack'>, base = './'): string | undefined {
  return entry.pack && typeof DecompressionStream !== 'undefined' ? `${base}${entry.path}${entry.pack}` : undefined;
}

function startPack(url: string): Pack {
  const pack: Pack = { files: new Map(), listeners: new Set(), done: Promise.resolve(false), complete: false, holders: 0, abort: new AbortController(), size: 0 };
  pack.done = (async () => {
    try {
      const res = await fetch(url, { signal: pack.abort.signal });
      if (!res.ok || !res.body) return false;
      const reader = res.body.pipeThrough(new DecompressionStream('gzip')).getReader();
      const r = new PackReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const [name, bytes] of r.push(value)) {
          pack.files.set(name, bytes);
          pack.size += bytes.length;
          for (const l of pack.listeners) l(name, bytes);
        }
      }
      pack.complete = r.done;
      return r.done;
    } catch {
      return false;
    } finally {
      pack.listeners.clear();
      if (!pack.complete) {
        if (packs.get(url) === pack) packs.delete(url);
      } else trimPacks();
    }
  })();
  return pack;
}

/** A game's pack being read: its files so far, and each one as it comes (see openPack). */
export interface PackHandle {
  files: ReadonlyMap<string, Uint8Array>;
  /** true once every file is in; false when the pack failed (or was stopped): fetch what is missing on its own. */
  done: Promise<boolean>;
  /** No longer needed: stops the download when nobody else is reading it. */
  stop(): void;
}

/**
 * Starts reading a hosted game's pack (or joins the reading of it already going on), or
 * undefined when it has none. `onFile` hears of each file in it: those in already at once,
 * then the rest as they arrive, in pack order (play order, streamGame.ts packOrder). Shared:
 * do not modify the files.
 */
export function openPack(entry: Pick<CatalogEntry, 'path' | 'pack'>, base = './', onFile?: (name: string, bytes: Uint8Array) => void): PackHandle | undefined {
  const url = packUrl(entry, base);
  if (!url) return undefined;
  let pack = packs.get(url);
  if (pack) packs.delete(url); // most recently used last
  else pack = startPack(url);
  packs.set(url, pack);
  const p = pack;
  p.holders++;
  if (onFile) {
    for (const [n, b] of p.files) onFile(n, b);
    if (!p.complete) p.listeners.add(onFile);
  }
  let stopped = false;
  return {
    files: p.files,
    done: p.done,
    stop() {
      if (stopped) return;
      stopped = true;
      if (onFile) p.listeners.delete(onFile);
      if (--p.holders <= 0 && !p.complete) {
        p.abort.abort();
        if (packs.get(url) === p) packs.delete(url);
      }
    },
  };
}

/** One file from a pack being read: once it arrives, or undefined if the pack ends (or fails) without it. */
function fromPack(entry: Pick<CatalogEntry, 'path' | 'pack'>, name: string, base: string): Promise<Uint8Array | undefined> | undefined {
  let resolve!: (b: Uint8Array | undefined) => void;
  const got = new Promise<Uint8Array | undefined>((r) => (resolve = r));
  const h = openPack(entry, base, (n, b) => n === name && resolve(b));
  if (!h) return undefined;
  void h.done.then(() => resolve(h.files.get(name)));
  return got.then((b) => (h.stop(), b));
}

/** Whether a game's pack is here already: read this session, or kept by the service worker (offline). */
async function packAtHand(entry: Pick<CatalogEntry, 'path' | 'pack'>, base: string): Promise<boolean> {
  const url = packUrl(entry, base);
  if (!url) return false;
  if (packs.has(url)) return true;
  try {
    return typeof caches !== 'undefined' && !!(await caches.match(new URL(url, location.href).href));
  } catch {
    return false;
  }
}

/**
 * One file of a hosted game, by the name a game uses for it (A-J.BKD finds the CD's
 * a_j.bkd); undefined when the game has no such file or it could not be fetched. From the
 * game's pack when that is here already (played, opened, or kept offline), else on its own.
 */
export async function fetchGameFile(entry: Pick<CatalogEntry, 'path' | 'files' | 'gz' | 'pack'>, name: string, base = './'): Promise<Uint8Array | undefined> {
  const n = [name.toLowerCase(), cdName(name)].find((x) => entry.files.includes(x));
  if (!n) return undefined;
  if (await packAtHand(entry, base)) {
    const bytes = await fromPack(entry, n, base);
    if (bytes) return bytes;
  }
  return fetchSiteFile(`${base}${entry.path}${n}`, entry.gz);
}

/**
 * Every file of a hosted game (copies, to change freely): its pack, in one request, when it
 * has one; files the pack did not bring (an older site, a failed download) one by one.
 */
export async function loadHostedGame(entry: CatalogEntry, base = './', onProgress?: (done: number, total: number) => void): Promise<GameFiles> {
  const files = new GameFiles();
  const total = entry.files.length;
  let done = 0;
  const wanted = new Set(entry.files);
  const h = openPack(entry, base, (name, bytes) => {
    if (!wanted.has(name) || files.has(name)) return;
    files.set(name, bytes.slice());
    onProgress?.(++done, total);
  });
  if (h) await h.done;
  await Promise.all(
    entry.files
      .filter((name) => !files.has(name))
      .map(async (name) => {
        const bytes = await fetchSiteFile(`${base}${entry.path}${name}`, entry.gz);
        // a copy: callers may edit their files
        if (bytes) files.set(name, bytes.slice());
        onProgress?.(++done, total);
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
  // an author who is also the publisher (The Bard of Bizarre) is named once
  const company = g.company && g.company.toLowerCase() !== g.author?.toLowerCase() ? g.company : undefined;
  return [g.author, company, g.year].filter(Boolean).join(' · ');
}
