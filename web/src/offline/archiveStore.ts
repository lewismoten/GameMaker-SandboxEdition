// Explicit offline ZIP acquisition: stage in a separate cache, publish its pointer last.
import { listZip } from '@lewismoten/gamemaker-sandbox-archives';
import type { OfflineProgress } from './offlineCopy';

export interface OfflineManifest {
  version: string;
  shell: string[];
  files: [string, number, number][];
  archive: { path: string; bytes: number; sha256: string };
}
interface Copy {
  version: string;
  cache: string;
}
// Also embedded in siteWorker.ts; its lifecycle tests exercise the generated worker.
export const offlineNames = (base: string) => ({
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

/** Serializes publication/removal across tabs; modern service-worker browsers have Web Locks. */
export async function offlineLock<T>(base: string, run: () => Promise<T>): Promise<T> {
  if (!navigator.locks) throw new Error('This browser needs Web Locks to safely replace an offline copy.');
  return navigator.locks.request(`gm-offline:${base}`, run);
}

function mime(path: string): string {
  const ext = path.split('.').pop() ?? '';
  return (
    (
      {
        html: 'text/html',
        js: 'text/javascript',
        css: 'text/css',
        json: 'application/json',
        webmanifest: 'application/manifest+json',
        svg: 'image/svg+xml',
        png: 'image/png',
        avif: 'image/avif',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        gif: 'image/gif',
        ico: 'image/x-icon',
        ogg: 'audio/ogg',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        woff: 'font/woff',
        woff2: 'font/woff2',
        wasm: 'application/wasm',
        txt: 'text/plain',
        zip: 'application/zip',
        gz: 'application/gzip',
      } as Record<string, string>
    )[ext] ?? 'application/octet-stream'
  );
}
const siteUrl = (base: string, path: string) => {
  const url = new URL(path, base);
  if (url.href !== base + path || /[?#\\]|(^|\/)\.\.?($|\/)/.test(path)) throw new Error('Invalid offline path');
  return url.href;
};

/** Caller holds offlineLock. Only the single public archive and already-revealed extra games are fetched. */
export async function installArchive(
  base: string,
  m: OfflineManifest,
  extras: [string, number, number][],
  progress: (p: OfflineProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  const names = offlineNames(base);
  const previous = await readOfflineCopy(base);
  const wanted = [...m.files, ...extras];
  if (previous?.version === m.version) {
    const old = await caches.open(previous.cache);
    if ((await Promise.all(wanted.map(([path]) => old.match(siteUrl(base, path))))).every(Boolean)) return;
  }
  // Clear abandoned staging from a closed tab, never the last committed copy.
  for (const name of await caches.keys()) if (name.startsWith(names.prefix) && name !== previous?.cache) await caches.delete(name);
  signal.throwIfAborted();
  const name = names.prefix + m.version + ':' + crypto.randomUUID();
  let published = false;
  const p: OfflineProgress = { phase: 'download', done: 0, total: wanted.length, bytes: 0, totalBytes: m.archive.bytes + extras.reduce((n, f) => n + f[1], 0) };
  progress({ ...p });
  try {
    const res = await fetch(siteUrl(base, m.archive.path), { cache: 'no-store', signal });
    if (!res.ok || !res.body) throw new Error('Offline archive download failed');
    const reader = res.body.getReader();
    const parts: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > m.archive.bytes) {
        await reader.cancel();
        throw new Error('Offline archive is too large');
      }
      parts.push(value);
      p.bytes = length;
      progress({ ...p });
    }
    if (length !== m.archive.bytes) throw new Error('Incomplete offline archive');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hash !== m.archive.sha256) throw new Error('Offline archive checksum mismatch');
    const entries = listZip(bytes, { maxEntries: m.files.length, maxBytes: m.files.reduce((n, f) => n + f[2], 0) });
    const expected = new Map(m.files.map(([path, , stored]) => [path, stored]));
    if (entries.length !== expected.size || new Set(entries.map((e) => e.name)).size !== expected.size) throw new Error('Offline archive file list mismatch');
    p.phase = 'extract';
    const stage = await caches.open(name);
    for (const entry of entries) {
      signal.throwIfAborted();
      if (!expected.has(entry.name) || entry.size !== expected.get(entry.name)) throw new Error('Unexpected offline entry');
      const url = siteUrl(base, entry.name);
      const data = await entry.read();
      if (!data || data.length !== entry.size) throw new Error('Incomplete offline entry');
      const response = new Response(data as BodyInit, { headers: { 'content-type': mime(entry.name) } });
      await stage.put(url, response.clone());
      if (entry.name === 'index.html') await stage.put(base, response);
      p.done++;
      progress({ ...p });
    }
    // Secret games cannot be named in a public ZIP; only a browser that revealed them adds these.
    for (const [path, wire] of extras) {
      signal.throwIfAborted();
      const response = await fetch(siteUrl(base, path), { cache: 'no-store', signal });
      if (!response.ok) throw new Error('Extra game download failed');
      await stage.put(siteUrl(base, path), response);
      p.done++;
      p.bytes += wire;
      progress({ ...p });
    }
    await stage.put(base + 'offline.json', new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } }));
    signal.throwIfAborted();
    // A single Cache.put is the commit point. Failure anywhere before it leaves previous untouched.
    await (await caches.open(names.control)).put(names.pointer, new Response(JSON.stringify({ version: m.version, cache: name })));
    published = true;
    if (previous) await caches.delete(previous.cache).catch(() => false);
  } finally {
    if (!published) await caches.delete(name);
  }
}
