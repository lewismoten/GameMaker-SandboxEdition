// Hosted loose files, shared archive sessions and ZIP peeks with bounded caches.
import { requireOfflineFile } from '../offline/availability';
import { GameFiles, cdName } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { PackReader } from '@lewismoten/gamemaker-sandbox-archives/pack';
import { fetchArchive } from './archiveWait';
import { withFiles, type CatalogEntry } from './catalogFiles';

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
function packedUrl(url: string, gz: boolean | undefined): string | undefined {
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

/** A hosted game's ZIP or legacy GMPK URL, when its required decompressor is available. */
function packUrl(entry: Pick<CatalogEntry, 'path' | 'pack'>, base = './'): string | undefined {
  return entry.pack && (/\.zip$/i.test(entry.pack) || typeof DecompressionStream !== 'undefined') ? `${base}${entry.path}${entry.pack}` : undefined;
}

/** A game's ZIP (or legacy pack) at `url`: a split one is joined (sharedZip.ts, loaded only for those). */
const fetchPack = async (entry: Pick<CatalogEntry, 'path' | 'pack' | 'parts'>, url: string, base: string, init?: RequestInit): Promise<Response> => {
  await requireOfflineFile(entry.parts ? `${base}${entry.path}${entry.parts}` : url);
  return entry.parts ? (await import('./sharedZip')).fetchGameZip(entry, base, init) : fetchArchive(url, init);
};

function startPack(url: string, entry: Pick<CatalogEntry, 'path' | 'pack' | 'parts'>, base: string): Pack {
  const pack: Pack = {
    files: new Map(),
    listeners: new Set(),
    done: Promise.resolve(false),
    complete: false,
    holders: 0,
    abort: new AbortController(),
    size: 0,
  };
  pack.done = (async () => {
    try {
      const peeked = peekedZips.get(url);
      peekedZips.delete(url);
      peekedSize.delete(url);
      if (peeked && /\.zip$/i.test(url)) {
        // the bytes a peek at the .gam (peekGameFile) already fetched
        const raw = await peeked;
        if (!raw) return false;
        const { readHostedZip } = await import('./hostedZip');
        const entries = await readHostedZip(raw);
        for (const [name, bytes] of entries) {
          pack.files.set(name, bytes);
          pack.size += bytes.length;
          for (const l of pack.listeners) l(name, bytes);
        }
        pack.complete = true;
        return true;
      }
      const res = await fetchPack(entry, url, base, { signal: pack.abort.signal });
      if (!res.ok || !res.body) return false;
      if (/\.zip$/i.test(url)) {
        const { readHostedZip } = await import('./hostedZip');
        const entries = await readHostedZip(new Uint8Array(await res.arrayBuffer()));
        for (const [name, bytes] of entries) {
          pack.files.set(name, bytes);
          pack.size += bytes.length;
          for (const l of pack.listeners) l(name, bytes);
        }
        pack.complete = true;
        return true;
      }
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
  /** true once every file is in; false on failure. Only legacy catalogs have loose-file fallbacks. */
  done: Promise<boolean>;
  /** No longer needed: stops the download when nobody else is reading it. */
  stop(): void;
}

/**
 * Starts reading a hosted game's pack (or joins the reading of it already going on), or
 * undefined when it has none. `onFile` hears of each file in it: those in already at once,
 * then the rest as they arrive, in pack order (play order). Shared:
 * do not modify the files.
 */
export function openPack(
  entry: Pick<CatalogEntry, 'path' | 'pack' | 'parts'>,
  base = './',
  onFile?: (name: string, bytes: Uint8Array) => void,
): PackHandle | undefined {
  const url = packUrl(entry, base);
  if (!url) return undefined;
  let pack = packs.get(url);
  if (pack)
    packs.delete(url); // most recently used last
  else pack = startPack(url, entry, base);
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

/**
 * Starts reading a game's whole pack (when it has one), so the many files that are about to
 * be read one by one (a box's paper, a manual's pictures) come in one request instead.
 */
export function warmPack(entry: Pick<CatalogEntry, 'path' | 'pack'>, base = './'): void {
  openPack(entry, base);
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

/** What fetching a game's file needs of its entry; `id` lets a lean entry (no `files` yet) look its list up. */
type FiledEntry = Pick<CatalogEntry, 'path' | 'gz' | 'pack' | 'parts'> & { id?: string; gam?: string | null; files?: string[] };

/** The entry's file names: its own, or (a lean entry) from games/catalog-files.json. */
async function filesOf(entry: FiledEntry, base: string, asking?: string): Promise<string[]> {
  if (entry.files) return entry.files;
  // the game's own .gam is always one of its files: asking for it needs no list (the home page's preview does, at load)
  if (asking && entry.gam && [asking.toLowerCase(), cdName(asking)].includes(entry.gam.toLowerCase())) return [entry.gam.toLowerCase()];
  return entry.id ? (await withFiles(entry as FiledEntry & { id: string }, `${base}games/`)).files : [];
}

/**
 * One file of a hosted game, by the name a game uses for it (A-J.BKD finds the CD's
 * a_j.bkd); undefined when the game has no such file or it could not be fetched. From the
 * ZIP-only sites always share the archive request. Legacy catalogs can fetch loose files.
 */
export async function fetchGameFile(entry: FiledEntry, name: string, base = './'): Promise<Uint8Array | undefined> {
  const files = await filesOf(entry, base, name);
  const n = [name.toLowerCase(), cdName(name)].find((x) => files.includes(x));
  if (!n) return undefined;
  if (entry.pack?.endsWith('.zip')) return fromPack(entry, n, base);
  if (await packAtHand(entry, base)) {
    const bytes = await fromPack(entry, n, base);
    if (bytes) return bytes;
  }
  return fetchSiteFile(`${base}${entry.path}${n}`, entry.gz);
}

/**
 * Zips fetched for a peek, kept for the pack that reads the same zip next (one request), up
 * to the file budget: the oldest are dropped past it, and a later peek fetches again.
 */
const peekedZips = new Map<string, Promise<Uint8Array | undefined>>();
const peekedSize = new Map<string, number>();

function trimPeekedZips(): void {
  let total = [...peekedSize.values()].reduce((a, n) => a + n, 0);
  for (const [url, n] of peekedSize) {
    if (total <= FILE_CACHE_BYTES) return;
    peekedZips.delete(url);
    peekedSize.delete(url);
    total -= n;
  }
}

/**
 * A file of a hosted game's zip as it is stored, without reading the zip's player .exe (which
 * fetches the play page's 118 kB chunk when it is not the CD's own, hostedZip.ts): enough for
 * the home page to tell from the .gam whether a game has a demo. Falls back to fetchGameFile
 * when the zip has no such file (a game that renames its extensions, found only after reading
 * its player) or is not a zip.
 */
export async function peekGameFile(entry: FiledEntry, name: string, base = './'): Promise<Uint8Array | undefined> {
  const url = packUrl(entry, base);
  if (!url || !/\.zip$/i.test(url) || packs.has(url)) return fetchGameFile(entry, name, base);
  const files = await filesOf(entry, base, name);
  if (![name.toLowerCase(), cdName(name)].some((x) => files.includes(x))) return undefined; // as fetchGameFile: not one of its files
  let zip = peekedZips.get(url);
  if (!zip) {
    const got = (zip = fetchPack(entry, url, base).then(
      async (res) => (res.ok ? new Uint8Array(await res.arrayBuffer()) : undefined),
      () => undefined,
    ));
    peekedZips.set(url, got);
    void got.then((b) => {
      if (!b || peekedZips.get(url) !== got) return;
      peekedSize.set(url, b.length);
      trimPeekedZips();
    });
  }
  const bytes = await zip;
  if (bytes) {
    const { findZipFile } = await import('./hostedZip');
    const found = await findZipFile(bytes, [name.toLowerCase(), cdName(name)]);
    if (found) return found;
  }
  return fetchGameFile(entry, name, base);
}

/**
 * Every file of a hosted game (copies, to change freely): its pack, in one request, when it
 * has one. ZIP failures are reported; only legacy catalogs fall back to loose files.
 */
export async function loadHostedGame(entry: CatalogEntry, base = './', onProgress?: (done: number, total: number) => void): Promise<GameFiles> {
  if (entry.pack) await requireOfflineFile(`${base}${entry.path}${entry.parts ?? entry.pack}`);
  const files = new GameFiles();
  const names = (await withFiles(entry, `${base}games/`)).files;
  const total = names.length;
  let done = 0;
  const wanted = new Set(names);
  const h = openPack(entry, base, (name, bytes) => {
    if (!wanted.has(name) || files.has(name)) return;
    files.set(name, bytes.slice());
    onProgress?.(++done, total);
  });
  const complete = h ? await h.done : false;
  h?.stop();
  // ZIP-only deployments have no loose-file fallback. Report one failed archive, not many 404s.
  if (entry.pack?.endsWith('.zip')) {
    if (!complete || names.some((name) => !files.has(name))) throw new Error(`Could not load the game archive for ${entry.title}. Please try again.`);
    return files;
  }
  await Promise.all(
    names
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
