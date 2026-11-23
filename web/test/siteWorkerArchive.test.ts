// Execute generated worker code, including activation and offline-snapshot serving.
import { base, harness } from './siteWorkerHarness';
import { expect, it } from 'vitest';
import { offlineNames } from '../src/offline/archiveStore';
async function seed(h: ReturnType<typeof harness>, version: string) {
  const names = offlineNames(base);
  const cacheName = names.prefix + version;
  const cache = await h.caches.open(cacheName);
  await cache.put(base, new Response('snapshot home'));
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
  await (await h.caches.open(offlineNames(base).browsing)).put(base, new Response('new shell'));
  expect(await (await h.request('', 'navigate')).text()).toBe('snapshot home');
  expect(await (await h.request('assets/old.js')).text()).toBe('old code');
});

it('bypasses both the committed copy and browsing cache for verified update acquisition', async () => {
  const h = harness('one');
  await seed(h, 'one');
  await (await h.caches.open(offlineNames(base).browsing)).put(base + 'assets/old.js', new Response('stale browsing'));
  h.fetcher.mockImplementation(async () => new Response('changed deployment'));
  expect(await (await h.request('assets/old.js', 'cors', 'no-store')).text()).toBe('changed deployment');
  expect(h.fetcher).toHaveBeenCalledTimes(1);
  expect(await (await h.request('assets/old.js')).text()).toBe('old code');
});

it.each([
  { source: 'browsing cache', version: null, browsingHome: 'home', expectedHome: 'home' },
  { source: 'older saved copy', version: 'one', browsingHome: null, expectedHome: 'snapshot home' },
  { source: 'current saved copy', version: 'two', browsingHome: null, expectedHome: 'snapshot home' },
  { source: 'current saved copy and browsing cache', version: 'two', browsingHome: 'stale browsing', expectedHome: 'snapshot home' },
])('opens the offline home from nested pages with the $source', async ({ version, browsingHome, expectedHome }) => {
  const h = harness('two');
  const browsing = await h.caches.open(offlineNames(base).browsing);
  if (browsingHome) await browsing.put(base, new Response(browsingHome));
  if (version) await seed(h, version);

  const nested = await h.request('player/index.html', 'navigate');
  expect(nested.status).toBe(302);
  expect(nested.headers.get('location')).toBe(base);
  expect(await (await h.request('', 'navigate')).text()).toBe(expectedHome);
  expect(await (await h.request('missing.html', 'navigate')).text()).toBe(expectedHome);
});

it('serves the saved home offline for an unvisited path containing a literal percent sign', async () => {
  const h = harness('one');
  await seed(h, 'one');
  expect(await (await h.request('50%.html', 'navigate')).text()).toBe('snapshot home');
});
