// Resumable per-file acquisition: stage separately, verify content, publish its pointer last.
import type { OfflineProgress } from './offlineCopy';
import { selectedFiles, type OfflineFile, type OfflineManifest, type OfflineTier } from './tiers';
interface Copy {
  version: string;
  cache: string;
  tiers?: OfflineTier[];
  tierVersion?: number;
}
// Also embedded in siteWorker.ts; its lifecycle tests exercise the generated worker.
export const offlineNames = (base: string) => ({
  browsing: `gamemaker-site:${encodeURIComponent(base)}:browse`,
  control: `gm-offline-control:${base}`,
  prefix: `gm-offline-copy:${base}:`,
  pointer: `${base}__gm-offline.json`,
});
export async function readOfflineCopy(base: string): Promise<Copy | undefined> {
  const names = offlineNames(base);
  const res = await (await caches.open(names.control)).match(names.pointer);
  const copy = res ? ((await res.json()) as Copy) : undefined;
  return copy && (copy.cache === 'gm-site' || copy.cache.startsWith(names.prefix)) && (await caches.has(copy.cache)) ? copy : undefined;
}
/** Serializes publication/removal across tabs. */
export async function offlineLock<T>(base: string, run: () => Promise<T>): Promise<T> {
  if (!navigator.locks) throw new Error('This browser needs Web Locks to safely replace an offline copy.');
  return navigator.locks.request(`gm-offline:${base}`, run);
}
const siteUrl = (base: string, path: string) => {
  const url = new URL(path, base);
  if (!path || url.href !== base + path || /[?#\\]|(^|\/)\.\.?($|\/)/.test(path)) throw new Error('Invalid offline path');
  return url.href;
};
export async function contentHash(bytes: ArrayBuffer): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function verified(response: Response | undefined, file: OfflineFile): Promise<boolean> {
  if (!response?.ok || !/^[a-f0-9]{64}$/.test(file.sha256)) return false;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength === file.stored && (await contentHash(bytes)) === file.sha256;
}
/** Bounded work, also used for checking cached bodies without allocating the whole site at once. */
export async function fourWorkers<T>(items: T[], run: (item: T) => Promise<void>, concurrency = 4): Promise<void> {
  let cursor = 0;
  let failure: unknown;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length && !failure) {
        const item = items[cursor++];
        try {
          await run(item);
        } catch (e) {
          failure = e;
        }
      }
    }),
  );
  if (failure) throw failure instanceof Error ? failure : new Error('Offline operation failed', { cause: failure });
}
export async function reusableStores(base: string): Promise<Cache[]> {
  const names = offlineNames(base);
  const keys = await caches.keys();
  return Promise.all(
    keys.filter((k) => k.startsWith(names.prefix) || k === 'gm-site' || k === names.browsing || k === 'gm-site-v2').map((k) => caches.open(k)),
  );
}
export async function findVerified(base: string, file: OfflineFile, stores: Cache[]): Promise<Response | undefined> {
  const url = siteUrl(base, file.path);
  for (const store of stores) {
    const response = await store.match(url, { ignoreSearch: true, ignoreVary: true });
    if (response && (await verified(response.clone(), file))) return response;
  }
  return undefined;
}
/** One metadata/body snapshot per store; verification results live only for this status check. */
export async function verificationStores(base: string) {
  const names = offlineNames(base);
  const keys = await caches.keys();
  const stores = await Promise.all(
    keys
      .filter((key) => key.startsWith(names.prefix) || key === 'gm-site' || key === names.browsing || key === 'gm-site-v2')
      .map(async (name) => {
        const cache = await caches.open(name);
        const [requests, responses] = await Promise.all([cache.keys(), cache.matchAll()]);
        const exact = new Map<string, Response>();
        const reusable = new Map<string, Response>();
        requests.forEach((request, i) => {
          const response = responses[i];
          if (!response) return;
          if (!exact.has(request.url)) exact.set(request.url, response);
          const url = new URL(request.url);
          url.search = '';
          if (!reusable.has(url.href)) reusable.set(url.href, response);
        });
        return { name, cache, exact, reusable };
      }),
  );
  return {
    removable: keys.some((key) => key.startsWith(names.prefix)),
    async check(file: OfflineFile, committedName: string | undefined, target: string) {
      const url = siteUrl(base, file.path);
      const results = new Map<Response, Promise<boolean>>();
      const check = (response: Response | undefined) => {
        if (!response) return Promise.resolve(false);
        let result = results.get(response);
        if (!result) {
          result = verified(response, file);
          results.set(response, result);
        }
        return result;
      };
      // A default Cache.match honors Vary and the query; reuse deliberately ignores both.
      const current = stores.find((store) => store.name === committedName);
      const exact = current?.exact.get(url);
      const committed = await check(exact?.headers.has('vary') ? await current!.cache.match(url) : exact);
      const pending = await check(stores.find((store) => store.name === target)?.reusable.get(url));
      let have = false;
      for (const store of stores) {
        if (have) break;
        have = await check(store.reusable.get(url));
      }
      return { have, committed, pending };
    },
  };
}
export async function stageName(base: string, version: string, wanted: OfflineFile[]): Promise<string> {
  return offlineNames(base).prefix + (await contentHash(new TextEncoder().encode(JSON.stringify([version, wanted])).buffer));
}
/** Caller holds offlineLock. Failed stages remain resumable but invisible to the worker. */
export async function installFiles(
  base: string,
  m: OfflineManifest,
  extras: OfflineFile[],
  tiers: OfflineTier[],
  progress: (p: OfflineProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  const names = offlineNames(base);
  const previous = await readOfflineCopy(base);
  const wanted = [...selectedFiles(m.files, tiers), ...extras];
  if (new Set(wanted.map((f) => f.path)).size !== wanted.length) throw new Error('Duplicate offline path');
  for (const file of wanted) {
    siteUrl(base, file.path);
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || file.stored < 0) throw new Error('Invalid offline integrity metadata');
  }
  const name = await stageName(base, m.version, wanted);
  const stores = await reusableStores(base);
  const stage = await caches.open(name);
  const p: OfflineProgress = { done: 0, total: wanted.length, bytes: 0, totalBytes: wanted.reduce((n, f) => n + f.wire, 0) };
  progress({ ...p });
  // no-store acquisition bypasses snapshot/browsing caches in the worker, including an old
  // unversioned response. Every reused response is checked against the NEW manifest hash.
  await fourWorkers(wanted, async (file) => {
    signal.throwIfAborted();
    const url = siteUrl(base, file.path);
    let response = await findVerified(base, file, stores);
    if (!response) {
      response = await fetch(url, { cache: 'no-store', signal });
      if (!(await verified(response.clone(), file))) throw new Error(`Offline file checksum or size mismatch: ${file.path} (HTTP ${response.status})`);
    }
    signal.throwIfAborted();
    await stage.put(url, response.clone());
    if (file.path === 'index.html') await stage.put(base, response);
    p.done++;
    p.bytes += file.wire;
    progress({ ...p });
  });
  // Save the complete public inventory for offline tier selection, not private game names.
  await stage.put(base + 'offline.json', new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } }));
  signal.throwIfAborted();
  await (
    await caches.open(names.control)
  ).put(names.pointer, new Response(JSON.stringify({ version: m.version, cache: name, tierVersion: 2, tiers: [...new Set(['core', ...tiers])] })));
  // Cleanup after the commit point cannot turn a successful publication into a failed result.
  for (const key of await caches.keys().catch(() => [])) {
    if ((key.startsWith(names.prefix) || key === previous?.cache) && key !== name) await caches.delete(key).catch(() => false);
  }
}
