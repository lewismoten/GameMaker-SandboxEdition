// Cache/fetch boundary regressions for resumable atomic per-file copies.
import { afterEach, expect, it, vi } from 'vitest';
import { contentHash, installFiles, readOfflineCopy } from './archiveStore';
import type { OfflineManifest, OfflineTier } from './tiers';
const revealed = vi.hoisted(() => ({ entries: [] as { path: string; pack: string }[] }));
vi.mock('../project/files', () => ({ loadCatalogList: async () => revealed.entries }));
vi.mock('../achievements', () => ({ unlockAchievement: vi.fn() }));
const base = 'https://example.test/nested/site/';
class MemoryCache {
  entries = new Map<string, Response>();
  async match(key: string | Request) {
    return this.entries.get(new URL(typeof key === 'string' ? key : key.url, base).href)?.clone();
  }
  async put(key: string | Request, response: Response) {
    this.entries.set(new URL(typeof key === 'string' ? key : key.url, base).href, response.clone());
  }
  async keys() {
    return [...this.entries.keys()].map((k) => new Request(k));
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
async function fixture(version = 'one', count = 6) {
  const bodies = new Map(Array.from({ length: count }, (_, i) => [i ? `assets/File-${i}.js` : 'index.html', i ? `unchanged ${i}` : `<html>${version}</html>`]));
  const m: OfflineManifest = { version, shell: ['./'], files: [] };
  for (const [path, body] of bodies)
    m.files.push({
      path,
      wire: body.length,
      stored: body.length,
      sha256: await contentHash(new TextEncoder().encode(body).buffer),
      tier: path === 'assets/File-5.js' ? 'games' : 'core',
    });
  const fetcher = vi.fn(
    async (url: string) =>
      new Response(bodies.get(url.slice(base.length)), { headers: { 'content-type': url.endsWith('.js') ? 'text/javascript' : 'text/html' } }),
  );
  vi.stubGlobal('fetch', fetcher);
  return { m, fetcher };
}
const install = (m: OfflineManifest, tiers: OfflineTier[] = ['core', 'games'], signal = new AbortController().signal) =>
  installFiles(base, m, [], tiers, vi.fn(), signal);
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  revealed.entries = [];
});
it('selects tiers, always keeps Core, and publishes exact-case files and the root alias', async () => {
  setup();
  const { m, fetcher } = await fixture();
  await install(m, []);
  expect(fetcher).toHaveBeenCalledTimes(5);
  const copy = await readOfflineCopy(base);
  const cache = await caches.open(copy!.cache);
  expect(await (await cache.match(base))?.text()).toBe('<html>one</html>');
  expect(await (await cache.match(base + 'assets/File-1.js'))?.text()).toBe('unchanged 1');
  expect(await cache.match(base + 'assets/File-5.js')).toBeUndefined();
  await install(m);
  expect(fetcher).toHaveBeenCalledTimes(6);
  await install(m, ['core']);
  expect(await (await caches.open((await readOfflineCopy(base))!.cache)).match(base + 'assets/File-5.js')).toBeUndefined();
});
it('only fetches changed files on update', async () => {
  setup();
  await install((await fixture()).m);
  const { m, fetcher } = await fixture('two');
  await install(m);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([base + 'index.html']);
});
it.each(['network', 'checksum', 'short', 'quota', 'canceled'])('keeps the previous complete copy on %s failure', async (failure) => {
  setup();
  await install((await fixture()).m);
  const before = await readOfflineCopy(base);
  const { m, fetcher } = await fixture('two');
  const stop = new AbortController();
  fetcher.mockImplementation(async () => {
    if (failure === 'network') throw new Error('offline');
    if (failure === 'canceled') stop.abort();
    return new Response(failure === 'checksum' ? '<html>bad</html>' : failure === 'short' ? 'x' : '<html>two</html>');
  });
  if (failure === 'quota') {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- applied to its cache instance below
    const originalPut = MemoryCache.prototype.put;
    vi.spyOn(MemoryCache.prototype, 'put').mockImplementation(async function (this: MemoryCache, key, value) {
      if ((typeof key === 'string' ? key : key.url).endsWith('index.html')) throw new DOMException('full', 'QuotaExceededError');
      return originalPut.call(this, key, value);
    });
  }
  await expect(install(m, ['core', 'games'], stop.signal)).rejects.toThrow();
  expect(await readOfflineCopy(base)).toEqual(before);
  expect(await (await (await caches.open(before!.cache)).match(base))?.text()).toBe('<html>one</html>');
});
it('resumes verified files after interruption, including after a new installer invocation', async () => {
  setup();
  const { m, fetcher } = await fixture();
  const original = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (url) => {
    if (url.endsWith('File-5.js')) throw new Error('interrupted');
    return original(url);
  });
  await expect(install(m)).rejects.toThrow();
  expect(await readOfflineCopy(base)).toBeUndefined();
  fetcher.mockClear().mockImplementation(original);
  await install(m);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([base + 'assets/File-5.js']);
});
it('never exceeds four concurrent downloads', async () => {
  setup();
  const { m, fetcher } = await fixture('one', 12);
  let active = 0;
  let maximum = 0;
  const original = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (url) => {
    maximum = Math.max(maximum, ++active);
    await new Promise<void>((r) => queueMicrotask(r));
    const response = await original(url);
    active--;
    return response;
  });
  await install(m);
  expect(maximum).toBe(4);
});
it('detects evicted or damaged cached files and downloads them again', async () => {
  setup();
  const { m, fetcher } = await fixture();
  await install(m);
  const copy = await readOfflineCopy(base);
  const cache = await caches.open(copy!.cache);
  await cache.put(base + 'assets/File-1.js', new Response('bad'));
  fetcher.mockClear();
  await install(m);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([base + 'assets/File-1.js']);
});

it('reports cached byte reuse but requires publication for a changed tier selection', async () => {
  setup();
  const { offlineStatus } = await import('./offlineCopy');
  const { m, fetcher } = await fixture();
  vi.stubGlobal('location', { href: base });
  vi.stubGlobal('navigator', { serviceWorker: {}, locks: {}, storage: {} });
  vi.stubGlobal('localStorage', { getItem: () => 'one' });
  await install(m, ['core']);
  const perFile = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (url) =>
    url.endsWith('offline.json') ? new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } }) : perFile(url),
  );
  expect((await offlineStatus()).ready).toBe(true);
  const add = await offlineStatus(['core', 'games']);
  expect(add.ready).toBe(false);
  expect(add.missing.map((f) => f.path)).toEqual(['assets/File-5.js']);
  expect(add.wireMissing).toBe(m.files[5].wire);
  expect(add.storedMissing).toBe(m.files.reduce((n, f) => n + f.stored, 0));
});

it('keeps a ready Core copy when adding an optional tier fails', async () => {
  setup();
  const { m, fetcher } = await fixture();
  await install(m, ['core']);
  const before = await readOfflineCopy(base);
  fetcher.mockImplementation(async () => {
    throw new Error('offline');
  });
  await expect(install(m)).rejects.toThrow();
  expect(await readOfflineCopy(base)).toEqual(before);
  expect(await (await (await caches.open(before!.cache)).match(base))?.text()).toBe('<html>one</html>');
});
it('adds only already-revealed extras, verifies their hashes and keeps their inventory private', async () => {
  setup();
  const { m, fetcher } = await fixture();
  const { offlineStatus, makeOffline } = await import('./offlineCopy');
  revealed.entries = [{ path: 'games/originals/revealed/', pack: 'game.zip' }];
  vi.stubGlobal('location', { href: base });
  vi.stubGlobal('navigator', { serviceWorker: {}, locks: { request: (_key: string, run: () => Promise<unknown>) => run() }, storage: {} });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  const bytes = new TextEncoder().encode('private');
  const extra = { path: 'games/originals/revealed/game.zip', wire: bytes.length, stored: bytes.length, sha256: await contentHash(bytes.buffer), tier: 'games' };
  const perFile = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (url) => {
    if (url === base + 'offline.json') return new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } });
    if (url.endsWith('revealed/offline.json')) return new Response(JSON.stringify([extra]));
    if (url.endsWith('revealed/game.zip')) return new Response(bytes);
    return perFile(url);
  });
  const status = await offlineStatus(['core', 'games']);
  expect(await makeOffline(status, vi.fn(), new AbortController().signal)).toEqual({ ok: true });
  const cache = await caches.open((await readOfflineCopy(base))!.cache);
  expect(await (await cache.match(base + extra.path))?.text()).toBe('private');
  expect(await cache.match(base + 'games/originals/revealed/offline.json')).toBeDefined();
  expect(await (await cache.match(base + 'offline.json'))?.text()).not.toContain('revealed');
});

it('remembers an interrupted selection when the dialog reopens and reports only remaining bytes', async () => {
  setup();
  const { m, fetcher } = await fixture();
  const { offlineStatus, makeOffline } = await import('./offlineCopy');
  const saved = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) });
  vi.stubGlobal('location', { href: base });
  vi.stubGlobal('navigator', { serviceWorker: {}, locks: { request: (_key: string, run: () => Promise<unknown>) => run() }, storage: {} });
  const perFile = fetcher.getMockImplementation()!;
  fetcher.mockImplementation(async (url) => {
    if (url === base + 'offline.json') return new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } });
    if (url.endsWith('File-5.js')) throw new Error('interrupted');
    return perFile(url);
  });
  const status = await offlineStatus(['core', 'games', 'speech']);
  expect((await makeOffline(status, vi.fn(), new AbortController().signal)).ok).toBe(false);
  const reopened = await offlineStatus();
  expect(reopened.tiers).toEqual(['core', 'games', 'speech']);
  expect(reopened.wireMissing).toBe(m.files[5].wire);
  expect(reopened.storedMissing).toBe(m.files[5].stored);
});
