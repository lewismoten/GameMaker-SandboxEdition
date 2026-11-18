// Explicit offline tier selection, storage estimates and resumable installation for both interfaces.
import { loadCatalogList } from '../project/files';
import { unlockAchievement } from '../achievements';
import {
  installFiles,
  offlineLock,
  offlineNames,
  readOfflineCopy,
  findVerified,
  reusableStores,
  fourWorkers,
  verified,
  stageName,
  contentHash,
} from './archiveStore';
import { gameTier, migrateTiers, selectedFiles, type OfflineFile, type OfflineManifest, type OfflineTier } from './tiers';

/** localStorage: the copy was asked for: "started", or the version (offline.json) it was finished for. */
const WANTED_KEY = 'gm-offline';
const SELECTION_KEY = 'gm-offline-tiers';

function savedTiers(): OfflineTier[] | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SELECTION_KEY) ?? 'null');
    if (Array.isArray(value)) return migrateTiers(value);
    if (value && typeof value === 'object' && 'version' in value && value.version === 2 && 'tiers' in value && Array.isArray(value.tiers))
      return migrateTiers(value.tiers, 2);
    return undefined;
  } catch {
    return undefined;
  }
}

export interface OfflineStatus {
  /** False where an offline copy cannot be made (no service worker or Cache Storage, or no list: the development server). */
  supported: boolean;
  /** Why not, when it is not. */
  reason?: string;
  files: OfflineFile[];
  /** offline.json's version. */
  version?: string;
  manifest?: OfflineManifest;
  tiers: OfflineTier[];
  tierFiles: OfflineFile[];
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
  /** A staged or committed copy exists and can be removed. */
  removable?: boolean;
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
    return m;
  } catch {
    return undefined;
  }
}

/** The list, with the pack of a secret game revealed in this browser (the full catalog has it then; the list never does). */
async function wantedFiles(m: OfflineManifest, tiers: OfflineTier[]): Promise<OfflineFile[]> {
  const files = selectedFiles(m.files, tiers);
  if (!tiers.some((tier) => ['starters', 'sandbox', 'specials', 'bizarre', 'cd'].includes(tier))) return files;
  const listed = new Set(m.files.map((f) => f.path));
  const catalog = await loadCatalogList().catch(() => []);
  for (const g of catalog) {
    const tier = gameTier(g);
    if (!tiers.includes(tier) || !g.pack || listed.has(`${g.path}${g.parts ?? g.pack}`)) continue;
    // This descriptor is never linked by the public inventory; only revealed entries reach it.
    const res = await fetch(urlOf(`${g.path}offline.json`), { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not read the revealed game inventory.');
    const descriptor = await res.arrayBuffer();
    const extra = JSON.parse(new TextDecoder().decode(descriptor)) as OfflineFile[];
    files.push({
      path: `${g.path}offline.json`,
      wire: descriptor.byteLength,
      stored: descriptor.byteLength,
      sha256: await contentHash(descriptor),
      tier,
    });
    for (const f of extra) if (!files.some((old) => old.path === f.path)) files.push(f);
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
    if (state === false) {
      localStorage.removeItem(WANTED_KEY);
      localStorage.removeItem(SELECTION_KEY);
    } else localStorage.setItem(WANTED_KEY, state === true ? 'started' : state);
  } catch {
    /* private mode: only the wording changes */
  }
}

async function storageEstimate(): Promise<{ usage?: number; quota?: number; persisted?: boolean }> {
  const s = navigator.storage;
  const [est, persisted] = await Promise.all([s?.estimate?.().catch(() => undefined), s?.persisted?.().catch(() => undefined)]);
  return { usage: est?.usage, quota: est?.quota, persisted };
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
  tiers: ['core'],
  tierFiles: [],
});

/** What a copy would cost, and how much of it is here already. */
export async function offlineStatus(selection?: OfflineTier[]): Promise<OfflineStatus> {
  if (typeof caches === 'undefined' || !('serviceWorker' in navigator) || !navigator.locks) return empty('This browser cannot keep the site for offline use.');
  const m = await loadManifest();
  if (!m || !m.files.every((f) => typeof f.path === 'string' && typeof f.sha256 === 'string'))
    return empty(navigator.onLine === false ? 'You are offline: connect to update the offline inventory.' : 'Offline copies are made on the published site.');
  const base = siteBase().href;
  const copy = await readOfflineCopy(base);
  const tiers = selection ? migrateTiers(selection, 2) : (savedTiers() ?? migrateTiers(copy?.tiers ?? ['core'], copy?.tierVersion));
  const [files, stores, est] = await Promise.all([wantedFiles(m, tiers), reusableStores(base), storageEstimate()]);
  const have = new Set<string>();
  const committed = new Set<string>();
  const pending = new Set<string>();
  const current = copy ? await caches.open(copy.cache) : undefined;
  const target = await stageName(base, m.version, files);
  const staged = (await caches.keys()).filter((k) => k === target);
  const stages = await Promise.all(staged.map((k) => caches.open(k)));
  await fourWorkers(files, async (file) => {
    if (await findVerified(base, file, stores)) have.add(file.path);
    if (current && (await verified(await current.match(urlOf(file.path)), file))) committed.add(file.path);
    if (await findVerified(base, file, stages)) pending.add(file.path);
  });
  const missing = files.filter((f) => !have.has(f.path));
  const sum = (list: OfflineFile[], k: 'wire' | 'stored') => list.reduce((n, f) => n + f[k], 0);
  const sameSelection = copy?.tiers && tiers.length === copy.tiers.length && tiers.every((t) => copy.tiers!.includes(t));
  const ready = copy?.version === m.version && committed.size === files.length && !!sameSelection;
  return {
    supported: true,
    files,
    manifest: m,
    tiers,
    tierFiles: m.files,
    shell: m.shell,
    missing,
    wireTotal: sum(files, 'wire'),
    wireMissing: sum(missing, 'wire'),
    // Cache API snapshots duplicate reused bodies while the old complete copy is protected.
    storedMissing: ready
      ? 0
      : sum(
          files.filter((f) => !pending.has(f.path)),
          'stored',
        ),
    ready,
    version: m.version,
    copy: copyBefore(m.version),
    removable: !!copy || (await caches.keys()).some((name) => name.startsWith(offlineNames(base).prefix)),
    ...est,
  };
}

export interface OfflineProgress {
  phase?: 'download';
  done: number;
  total: number;
  bytes: number;
  totalBytes: number;
}

type OfflineResult = { ok: true } | { ok: false; reason: 'canceled' | 'quota' | 'network' | 'space'; message: string };

/** How many games the copy holds: each is one pack (.zip, or a split one's .zpart; .gmpak for older builds) under games/. */
export function gameCount(status: { files: { path: string }[] }): number {
  return status.files.filter((f) => /^games\/.*\.(zip|zpart|gmpak)$/.test(f.path)).length;
}

/** Room for this many more bytes, as far as the browser tells (true when it does not say). */
export function hasRoom(status: Pick<OfflineStatus, 'usage' | 'quota'>, bytes: number): boolean {
  return status.quota === undefined || status.usage === undefined || status.quota - status.usage > bytes * 1.1;
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/** Downloads selected files and atomically replaces the prepared copy. */
export async function makeOffline(status: OfflineStatus, onProgress: (p: OfflineProgress) => void, signal: AbortSignal): Promise<OfflineResult> {
  if (!hasRoom(status, status.storedMissing)) return { ok: false, reason: 'space', message: 'There is not enough storage space for this browser to keep it.' };
  if (!status.manifest || !status.version) return { ok: false, reason: 'network', message: 'Reload the published site before making an offline copy.' };
  await navigator.storage?.persist?.().catch(() => false);
  if (status.copy !== 'outdated') rememberCopy(true);
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify({ version: 2, tiers: status.tiers }));
  } catch {
    /* storage may be disabled */
  }
  // A revealed game may need a public blob whose owning tier was not selected.
  const listed = new Set(selectedFiles(status.manifest.files, status.tiers).map((f) => f.path));
  const extras = status.files.filter((f) => !listed.has(f.path));
  try {
    await offlineLock(siteBase().href, () => installFiles(siteBase().href, status.manifest!, extras, status.tiers, onProgress, signal));
    rememberCopy(status.version);
    unlockAchievement('offline-copy');
    return { ok: true };
  } catch (e) {
    console.warn('Offline copy stopped:', e);
    const kept = 'Any previous complete offline copy is still kept.';
    if (signal.aborted) return { ok: false, reason: 'canceled', message: `Stopped. ${kept} Try again to resume the verified files.` };
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
  if (bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
