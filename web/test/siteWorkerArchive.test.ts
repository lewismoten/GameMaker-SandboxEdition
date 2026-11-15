// Execute generated worker code, including activation and offline-snapshot serving.
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
import { siteWorkerSource } from '../src/siteWorker';
import { offlineNames } from '../src/offline/archiveStore';
const base = 'https://example.test/project/';
function harness(version: string) {
  const stores = new Map<string, Map<string, Response>>();
  const key = (u: string | Request) => new URL(typeof u === 'string' ? u : u.url, base).href.split('?')[0];
  const caches = {
    has: async (n: string) => stores.has(n),
    keys: async () => [...stores.keys()],
    delete: async (n: string) => stores.delete(n),
    open: async (n: string) => {
      if (!stores.has(n)) stores.set(n, new Map());
      const store = stores.get(n)!;
      return {
        match: async (u: string | Request) => store.get(key(u))?.clone(),
        put: async (u: string | Request, r: Response) => {
          store.set(key(u), r.clone());
        },
        keys: async () => [...store.keys()].map((u) => new Request(u)),
        delete: async (u: string | Request) => store.delete(key(u)),
      };
    },
  };
  const handlers = new Map<string, (event: unknown) => void>();
  const fetcher = vi.fn(async (_request: Request): Promise<Response> => {
    throw new Error('offline');
  });
  runInNewContext(siteWorkerSource({ version, precache: ['./', 'assets/main.js'], groups: {}, assets: ['assets/main.js'] }), {
    self: {
      location: { href: base + 'sw.js' },
      registration: { active: true },
      addEventListener: (type: string, h: (event: unknown) => void) => handlers.set(type, h),
      clients: { claim: async () => {} },
    },
    caches,
    fetch: fetcher,
    URL,
    Request,
    Response,
    Set,
  });
  const lifecycle = (type: string) => new Promise<void>((resolve, reject) => handlers.get(type)!({ waitUntil: (p: Promise<void>) => p.then(resolve, reject) }));
  const request = (path: string, mode = 'cors') =>
    new Promise<Response>((resolve, reject) =>
      handlers.get('fetch')!({
        request: { url: base + path, method: 'GET', mode, headers: new Headers() },
        respondWith: (p: Promise<Response>) => p.then(resolve, reject),
      }),
    );
  return { caches, handlers, fetcher, lifecycle, request };
}
async function seed(h: ReturnType<typeof harness>, version: string) {
  const names = offlineNames(base);
  const cacheName = names.prefix + version;
  const cache = await h.caches.open(cacheName);
  await cache.put(base, new Response('old home'));
  await cache.put(base + 'assets/old.js', new Response('old code'));
  await (await h.caches.open(names.control)).put(names.pointer, new Response(JSON.stringify({ version, cache: cacheName })));
  return cacheName;
}
it('installs only the supplied shell, never the archive or the whole offline file list', async () => {
  const h = harness('one');
  h.fetcher.mockImplementation(async () => new Response('shell'));
  await h.lifecycle('install');
  expect(h.fetcher.mock.calls.map(([r]) => r.url).sort()).toEqual([base, base + 'assets/main.js']);
});

it('adopts a complete legacy per-file copy without copying or fetching its entries', async () => {
  const h = harness('two');
  const legacy = await h.caches.open('gm-site');
  await legacy.put(base, new Response('legacy home'));
  await legacy.put(base + 'games/catalog.json', new Response('legacy catalog'));
  await legacy.put(base + 'offline.json', new Response(JSON.stringify({ version: 'one', shell: ['./'], files: [['games/catalog.json', 1, 1]] })));
  await h.lifecycle('activate');
  expect(await h.caches.has('gm-site')).toBe(true);
  expect(await (await h.request('', 'navigate')).text()).toBe('legacy home');
  expect(await (await h.request('games/catalog.json')).text()).toBe('legacy catalog');
});

it('never marks an incomplete legacy browsing cache as a complete copy', async () => {
  const h = harness('two');
  const legacy = await h.caches.open('gm-site');
  await legacy.put(base + 'offline.json', new Response(JSON.stringify({ version: 'one', shell: ['./'], files: [['missing.js', 1, 1]] })));
  await h.lifecycle('activate');
  const names = offlineNames(base);
  expect(await (await h.caches.open(names.control)).match(names.pointer)).toBeUndefined();
});

it('serves the committed snapshot and preserves it through activation', async () => {
  const h = harness('one');
  const name = await seed(h, 'one');
  await h.lifecycle('activate');
  expect(await h.caches.has(name)).toBe(true);
  expect(await (await h.request('assets/old.js')).text()).toBe('old code');
  expect(h.fetcher).not.toHaveBeenCalled();
});
it('falls back to the old complete snapshot after a deployment when offline', async () => {
  const h = harness('two');
  await seed(h, 'one');
  await (await h.caches.open('gm-site-v2')).put(base, new Response('new shell'));
  expect(await (await h.request('', 'navigate')).text()).toBe('old home');
  expect(await (await h.request('assets/old.js')).text()).toBe('old code');
});
