// "Make available offline": the whole site in the service worker's cache at once, for a
// visitor who asks (the web's Offline dialog, offlineDialog.ts; OFFLINE.EXE on the desk PC).
// Otherwise everything is cached the first time it is used (siteWorker.ts).
//
// The build lists the files (offline.json, vite.config.ts offlineFiles): the code for every
// part of the site, every listed game as its one-file pack, the boxes', manuals' and desk's
// data and pictures. A secret game is in no list: once it is revealed in this browser its pack
// is added from the catalog, and nothing here ever names it.
import { loadCatalogList } from '../project/files';

/** The cache the site's service worker serves from (siteWorker.ts CACHE). */
const CACHE = 'gm-site';
/** localStorage: the copy was asked for: "started", or the version (offline.json) it was finished for. */
const WANTED_KEY = 'gm-offline';

export interface OfflineManifest {
  version: string;
  /** Installed by the service worker anyway: never removed by removeOffline. */
  shell: string[];
  /** [path, bytes on the wire, bytes stored]. */
  files: [string, number, number][];
}

export interface OfflineFile {
  path: string;
  wire: number;
  stored: number;
}

export interface OfflineStatus {
  /** False where an offline copy cannot be made (no service worker or Cache Storage, or no list: the development server). */
  supported: boolean;
  /** Why not, when it is not. */
  reason?: string;
  files: OfflineFile[];
  /** offline.json's version. */
  version?: string;
  /** The app shell (offline.json shell): kept when the copy is removed. */
  shell: string[];
  /** Files not in the cache yet, and what they cost. */
  missing: OfflineFile[];
  wireTotal: number;
  wireMissing: number;
  storedMissing: number;
  /** Every file is in. */
  ready: boolean;
  /** A copy was asked for here: 'unfinished' (stopped partway), or 'outdated' (finished for an older version of the site), else 'none'. */
  copy: 'none' | 'unfinished' | 'outdated';
  /** navigator.storage.estimate(), when the browser tells. */
  usage?: number;
  quota?: number;
  persisted?: boolean;
}

const siteBase = () => new URL('./', location.href);
const urlOf = (path: string) => new URL(path, siteBase()).href;

export async function loadManifest(): Promise<OfflineManifest | undefined> {
  try {
    const res = await fetch(urlOf('offline.json'), { cache: 'no-cache' });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
    return (await res.json()) as OfflineManifest;
  } catch {
    return undefined;
  }
}

/** The list, with the pack of a secret game revealed in this browser (the full catalog has it then; the list never does). */
async function wantedFiles(m: OfflineManifest): Promise<OfflineFile[]> {
  const files = m.files.map(([path, wire, stored]) => ({ path, wire, stored }));
  const listed = new Set(files.map((f) => f.path));
  const catalog = await loadCatalogList().catch(() => []);
  for (const g of catalog) {
    if (!g.pack) continue;
    const path = `${g.path}${g.pack}`;
    if (!listed.has(path)) files.push({ path, wire: g.packBytes ?? g.bytes ?? 0, stored: g.packBytes ?? g.bytes ?? 0 });
    const walk = g.walkthrough && `${g.walkthrough}.gz`;
    if (walk && !listed.has(walk)) files.push({ path: walk, wire: 0, stored: 0 });
  }
  return files;
}

function copyBefore(version: string): OfflineStatus['copy'] {
  try {
    const v = localStorage.getItem(WANTED_KEY);
    return v === null ? 'none' : v === 'started' || v === version ? 'unfinished' : 'outdated';
  } catch {
    return 'none';
  }
}

/** `version`: the copy is finished for it; true: started; false: removed. */
function rememberCopy(state: string | boolean): void {
  try {
    if (state === false) localStorage.removeItem(WANTED_KEY);
    else localStorage.setItem(WANTED_KEY, state === true ? 'started' : state);
  } catch {
    /* private mode: only the wording changes */
  }
}

async function storageEstimate(): Promise<{ usage?: number; quota?: number; persisted?: boolean }> {
  const s = navigator.storage;
  const [est, persisted] = await Promise.all([s?.estimate?.().catch(() => undefined), s?.persisted?.().catch(() => undefined)]);
  return { usage: est?.usage, quota: est?.quota, persisted };
}

/** Paths in the site's cache now. */
async function cachedPaths(): Promise<Set<string>> {
  const cache = await caches.open(CACHE);
  const base = siteBase().href;
  return new Set((await cache.keys()).map((r) => r.url.split('?')[0]).filter((u) => u.startsWith(base)).map((u) => decodeURIComponent(u.slice(base.length))));
}

const empty = (reason: string): OfflineStatus => ({ supported: false, reason, files: [], missing: [], wireTotal: 0, wireMissing: 0, storedMissing: 0, ready: false, copy: 'none', shell: [] });

/** What a copy would cost, and how much of it is here already. */
export async function offlineStatus(): Promise<OfflineStatus> {
  if (typeof caches === 'undefined' || !('serviceWorker' in navigator)) return empty('This browser cannot keep the site for offline use.');
  const m = await loadManifest();
  if (!m) return empty(navigator.onLine === false ? 'You are offline: connect to make an offline copy.' : 'Offline copies are made on the published site.');
  const [files, have, est] = await Promise.all([wantedFiles(m), cachedPaths(), storageEstimate()]);
  const missing = files.filter((f) => !have.has(f.path));
  const sum = (list: OfflineFile[], k: 'wire' | 'stored') => list.reduce((a, f) => a + f[k], 0);
  return {
    supported: true,
    files,
    shell: m.shell.map((f) => (f === './' ? '' : f.replace(/^\.\//, ''))),
    missing,
    wireTotal: sum(files, 'wire'),
    wireMissing: sum(missing, 'wire'),
    storedMissing: sum(missing, 'stored'),
    ready: missing.length === 0,
    version: m.version,
    copy: copyBefore(m.version),
    ...est,
  };
}

export interface OfflineProgress {
  done: number;
  total: number;
  bytes: number;
  totalBytes: number;
}

export type OfflineResult = { ok: true } | { ok: false; reason: 'cancelled' | 'quota' | 'network' | 'space'; message: string };

/** Room for this many more bytes, as far as the browser tells (true when it does not say). */
export function hasRoom(status: Pick<OfflineStatus, 'usage' | 'quota'>, bytes: number): boolean {
  return status.quota === undefined || status.usage === undefined || status.quota - status.usage > bytes * 1.1;
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/**
 * Downloads every missing file into the cache, a few at a time. Stops at `signal`, at the
 * first quota error, or when the network fails; what came in stays (a later run picks up
 * where it stopped).
 */
export async function makeOffline(status: OfflineStatus, onProgress: (p: OfflineProgress) => void, signal: AbortSignal): Promise<OfflineResult> {
  if (!hasRoom(status, status.storedMissing)) return { ok: false, reason: 'space', message: 'There is not enough storage space for this browser to keep it.' };
  // ask the browser not to clear it when space runs low (it may say no; it still works)
  await navigator.storage?.persist?.().catch(() => false);
  if (status.copy !== 'outdated') rememberCopy(true);
  const cache = await caches.open(CACHE);
  const queue = [...status.missing];
  const p: OfflineProgress = { done: 0, total: queue.length, bytes: 0, totalBytes: status.wireMissing };
  onProgress({ ...p });
  let failure: OfflineResult | undefined;
  const worker = async () => {
    while (!failure && queue.length) {
      if (signal.aborted) {
        failure = { ok: false, reason: 'cancelled', message: 'Stopped. What came in so far is kept.' };
        return;
      }
      const f = queue.shift()!;
      try {
        const res = await fetch(urlOf(f.path), { cache: 'no-cache', signal });
        if (!res.ok) throw new Error(`${res.status}`);
        await cache.put(urlOf(f.path), res);
      } catch (e) {
        if (signal.aborted) failure ??= { ok: false, reason: 'cancelled', message: 'Stopped. What came in so far is kept.' };
        else if (isQuota(e)) failure ??= { ok: false, reason: 'quota', message: 'The browser ran out of room to keep it. What came in so far is kept.' };
        else failure ??= { ok: false, reason: 'network', message: 'A download failed (are you still online?). Try again to finish.' };
        return;
      }
      p.done++;
      p.bytes += f.wire;
      onProgress({ ...p });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (!failure && status.version) rememberCopy(status.version);
  return failure ?? { ok: true };
}

/** Takes the offline copy out of the cache (not the app shell, which the site keeps anyway). Parts used later are cached again as they are used. */
export async function removeOffline(status: OfflineStatus): Promise<void> {
  rememberCopy(false);
  const cache = await caches.open(CACHE);
  const keep = new Set(status.shell);
  await Promise.all(status.files.filter((f) => !keep.has(f.path)).map((f) => cache.delete(urlOf(f.path), { ignoreSearch: true })));
}

/** "31.2 MB" */
export function sizeText(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
