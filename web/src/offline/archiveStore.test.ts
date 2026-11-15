// Real ZIP extraction and atomic publication, with an in-memory Cache API boundary.
import { afterEach, expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives';
import { installArchive, readOfflineCopy, type OfflineManifest } from './archiveStore';

const base = 'https://example.test/nested/site/';
class MemoryCache {
  entries = new Map<string, Response>();
  async match(key: string | Request) {
    return this.entries.get(new URL(typeof key === 'string' ? key : key.url, base).href)?.clone();
  }
  async put(key: string | Request, value: Response) {
    this.entries.set(new URL(typeof key === 'string' ? key : key.url, base).href, value.clone());
  }
  async keys() {
    return [...this.entries.keys()].map((key) => new Request(key));
  }
}
function setup() {
  const stores = new Map<string, MemoryCache>();
  vi.stubGlobal('caches', {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new MemoryCache());
      return stores.get(name)!;
    },
    has: async (name: string) => stores.has(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  });
  return stores;
}
async function fixture(version = 'one') {
  const entries = [
    { name: 'index.html', data: new TextEncoder().encode(`<html>${version}</html>`) },
    { name: 'assets/Mixed-Case.js', data: new TextEncoder().encode('export default 1') },
  ];
  const bytes = await createZip(entries);
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource))].map((n) => n.toString(16).padStart(2, '0')).join('');
  const manifest: OfflineManifest = {
    version,
    shell: ['./'],
    files: entries.map((e) => [e.name, e.data.length, e.data.length]),
    archive: { path: `offline.${sha256}.zip`, bytes: bytes.length, sha256 },
  };
  return { bytes, manifest };
}
afterEach(() => vi.unstubAllGlobals());

it('downloads one ZIP, extracts exact-case URLs under the base, and publishes only a complete copy', async () => {
  setup();
  const { bytes, manifest } = await fixture();
  const fetcher = vi.fn(async () => new Response(bytes as BodyInit));
  vi.stubGlobal('fetch', fetcher);
  const progress = vi.fn();
  await installArchive(base, manifest, [], progress, new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]).toBeDefined();
  const copy = await readOfflineCopy(base);
  expect(copy?.version).toBe('one');
  const cache = await caches.open(copy!.cache);
  expect(await (await cache.match(`${base}assets/Mixed-Case.js`))?.text()).toBe('export default 1');
  expect((await cache.match(`${base}assets/Mixed-Case.js`))?.headers.get('content-type')).toBe('text/javascript');
  expect(await (await cache.match(base))?.text()).toBe('<html>one</html>');
  expect(progress.mock.calls.at(-1)?.[0].done).toBe(manifest.files.length);
  await installArchive(base, manifest, [], progress, new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each(['network', 'short', 'checksum', 'quota', 'canceled'] as const)('keeps the committed copy when replacement fails: %s', async (failure) => {
  const stores = setup();
  const old = await fixture();
  vi.stubGlobal('fetch', async () => new Response(old.bytes as BodyInit));
  await installArchive(base, old.manifest, [], vi.fn(), new AbortController().signal);
  const before = await readOfflineCopy(base);
  const next = await fixture('two');
  const controller = new AbortController();
  vi.stubGlobal('fetch', async () => {
    if (failure === 'network') throw new Error('lost network');
    if (failure === 'short') return new Response(next.bytes.subarray(0, 20) as BodyInit);
    if (failure === 'checksum') {
      const bad = next.bytes.slice();
      bad[0] ^= 1;
      return new Response(bad as BodyInit);
    }
    return new Response(next.bytes as BodyInit);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- deliberately call with the fixture cache as this below
  const originalPut = MemoryCache.prototype.put;
  const put = vi.spyOn(MemoryCache.prototype, 'put').mockImplementation(async function (this: MemoryCache, key, value) {
    if (failure === 'quota' && (typeof key === 'string' ? key : key.url).endsWith('index.html')) throw new DOMException('full', 'QuotaExceededError');
    return originalPut.call(this, key, value);
  });
  const progress = (p: { done: number }) => {
    if (failure === 'canceled' && p.done === 1) controller.abort();
  };
  await expect(installArchive(base, next.manifest, [], progress, controller.signal)).rejects.toThrow();
  put.mockRestore();
  expect(await readOfflineCopy(base)).toEqual(before);
  expect(await (await (await caches.open(before!.cache)).match(base))?.text()).toBe('<html>one</html>');
  expect([...stores.keys()].filter((name) => name.includes('gm-offline-copy:'))).toEqual([before!.cache]);
});

it('publishes a replacement then removes the old snapshot and abandoned stages', async () => {
  setup();
  const old = await fixture();
  vi.stubGlobal('fetch', async () => new Response(old.bytes as BodyInit));
  await installArchive(base, old.manifest, [], vi.fn(), new AbortController().signal);
  const before = await readOfflineCopy(base);
  await caches.open(before!.cache + ':abandoned');
  const next = await fixture('two');
  vi.stubGlobal('fetch', async () => new Response(next.bytes as BodyInit));
  await installArchive(base, next.manifest, [], vi.fn(), new AbortController().signal);
  const after = await readOfflineCopy(base);
  expect(after?.version).toBe('two');
  expect(await caches.has(before!.cache)).toBe(false);
  expect(await caches.has(before!.cache + ':abandoned')).toBe(false);
});
