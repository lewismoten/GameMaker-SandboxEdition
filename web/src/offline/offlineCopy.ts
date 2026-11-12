// "Make available offline": the whole site in the service worker's cache at once, for a
// visitor who asks (the web's Offline dialog, offlineDialog.ts; OFFLINE.EXE on the desk PC).
// Otherwise everything is cached the first time it is used (siteWorker.ts).
//
// The build packs the files into one ZIP (offline.json names it, vite.config.ts offlineFiles): the code for every
// part of the site, every listed game as its one-file pack, the boxes', manuals' and desk's
// data and pictures. A secret game is in no list: once it is revealed in this browser its pack
// is added from the catalog, and nothing here ever names it.
import { loadCatalogList } from '../project/files';
import { unlockAchievement } from '../achievements';
import { installArchive, offlineLock, offlineNames, readOfflineCopy, type OfflineManifest } from './archiveStore';

/** localStorage: the copy was asked for: "started", or the version (offline.json) it was finished for. */
const WANTED_KEY = 'gm-offline';

interface OfflineFile {
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
  archive?: OfflineManifest['archive'];
  /** Public manifest entries; additional files are already-revealed private games. */
  archiveFiles?: OfflineManifest['files'];
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

async function loadManifest(): Promise<OfflineManifest | undefined> {
  try {
    const res = await fetch(urlOf('offline.json'), { cache: 'no-cache' });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
    const m = (await res.json()) as OfflineManifest;
    return m.archive ? m : undefined;
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
    // a game shipped split lists its .zpart file and shared data in offline.json already (project/sharedZip.ts)
    const path = `${g.path}${g.parts ?? g.pack}`;
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
async function cachedPaths(version: string): Promise<Set<string>> {
  const base = siteBase().href;
  const copy = await readOfflineCopy(base);
  if (copy?.version !== version) return new Set();
  const cache = await caches.open(copy.cache);
  return new Set(
    (await cache.keys())
      .map((r) => r.url.split('?')[0])
      .filter((u) => u.startsWith(base))
      .map((u) => decodeURIComponent(u.slice(base.length))),
  );
}

const empty = (reason: string): OfflineStatus => ({
  supported: false,
  reason,
  files: [],
  missing: [],
  wireTotal: 0,
  wireMissing: 0,
  storedMissing: 0,
  ready: false,
  copy: 'none',
  shell: [],
});

/** What a copy would cost, and how much of it is here already. */
export async function offlineStatus(): Promise<OfflineStatus> {
  if (typeof caches === 'undefined' || !('serviceWorker' in navigator) || !navigator.locks) return empty('This browser cannot keep the site for offline use.');
  const m = await loadManifest();
  if (!m) return empty(navigator.onLine === false ? 'You are offline: connect to make an offline copy.' : 'Offline copies are made on the published site.');
  const [files, have, est] = await Promise.all([wantedFiles(m), cachedPaths(m.version), storageEstimate()]);
  const missing = files.filter((f) => !have.has(f.path));
  const sum = (list: OfflineFile[], k: 'wire' | 'stored') => list.reduce((a, f) => a + f[k], 0);
  return {
    supported: true,
    files,
    shell: m.shell.map((f) => (f === './' ? '' : f.replace(/^\.\//, ''))),
    missing,
    wireTotal:
      m.archive.bytes +
      sum(
        files.filter((f) => !m.files.some(([path]) => path === f.path)),
        'wire',
      ),
    wireMissing: missing.length
      ? m.archive.bytes +
        sum(
          files.filter((f) => !m.files.some(([path]) => path === f.path)),
          'wire',
        )
      : 0,
    storedMissing: missing.length ? sum(files, 'stored') : 0,
    archive: m.archive,
    archiveFiles: m.files,
    ready: missing.length === 0,
    version: m.version,
    copy: copyBefore(m.version),
    ...est,
  };
}

export interface OfflineProgress {
  phase?: 'download' | 'extract';
  done: number;
  total: number;
  bytes: number;
  totalBytes: number;
}

type OfflineResult = { ok: true } | { ok: false; reason: 'canceled' | 'quota' | 'network' | 'space'; message: string };

/** How many games the copy holds: each is one pack (.zip, or a split one's .zpart; .gmpak for older builds) under games/. */
export function gameCount(status: Pick<OfflineStatus, 'files'>): number {
  return status.files.filter((f) => /^games\/.*\.(zip|zpart|gmpak)$/.test(f.path)).length;
}

/** Room for this many more bytes, as far as the browser tells (true when it does not say). */
export function hasRoom(status: Pick<OfflineStatus, 'usage' | 'quota'>, bytes: number): boolean {
  return status.quota === undefined || status.usage === undefined || status.quota - status.usage > bytes * 1.1;
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/** Downloads the single public ZIP and atomically replaces the prepared copy. */
export async function makeOffline(status: OfflineStatus, onProgress: (p: OfflineProgress) => void, signal: AbortSignal): Promise<OfflineResult> {
  if (!hasRoom(status, status.storedMissing)) return { ok: false, reason: 'space', message: 'There is not enough storage space for this browser to keep it.' };
  if (!status.archive || !status.version) return { ok: false, reason: 'network', message: 'Reload the published site before making an offline copy.' };
  await navigator.storage?.persist?.().catch(() => false);
  if (status.copy !== 'outdated') rememberCopy(true);
  const files = status.archiveFiles ?? status.files.map((f): [string, number, number] => [f.path, f.wire, f.stored]);
  const listed = new Set(files.map(([path]) => path));
  const extras = status.files.filter((f) => !listed.has(f.path)).map((f): [string, number, number] => [f.path, f.wire, f.stored]);
  const manifest: OfflineManifest = { version: status.version, shell: status.shell, files, archive: status.archive };
  try {
    await offlineLock(siteBase().href, () => installArchive(siteBase().href, manifest, extras, onProgress, signal));
    rememberCopy(status.version);
    unlockAchievement('offline-copy');
    return { ok: true };
  } catch (e) {
    const kept = 'Any previous complete offline copy is still kept.';
    if (signal.aborted) return { ok: false, reason: 'canceled', message: `Stopped. ${kept} Try again to download the archive from the start.` };
    if (isQuota(e)) return { ok: false, reason: 'quota', message: `The browser ran out of room. ${kept}` };
    return { ok: false, reason: 'network', message: `The offline download could not finish. ${kept} Try again when connected.` };
  }
}

/** Removes prepared copies, not the shell or files cached through ordinary browsing. */
export async function removeOffline(_status: OfflineStatus): Promise<void> {
  const base = siteBase().href;
  await offlineLock(base, async () => {
    const names = offlineNames(base);
    const previous = await readOfflineCopy(base);
    await caches.delete(names.control);
    if (previous) await caches.delete(previous.cache);
    for (const name of await caches.keys()) if (name.startsWith(names.prefix)) await caches.delete(name);
    rememberCopy(false);
  });
}

/** "31.2 MB" */
export function sizeText(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
