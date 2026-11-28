// The site's service worker: how it groups and versions files, and that its source parses.
import { runInNewContext } from 'node:vm';
import { serviceWorkerSource } from '../src/export/serviceWorker';
import { offlineNames } from '../src/offline/archiveStore';
import { describe, expect, it } from 'vitest';
import { groupKey, groupOf, siteWorkerSource, WORKER_GROUP_OF } from '../src/siteWorker';

import { base, harness } from './siteWorkerHarness';

const PATHS = [
  'assets/desk-CtzsCBvT.js',
  'index.html',
  'play.html',
  'play-teddy.html',
  'manifest.webmanifest',
  'games/catalog.json',
  'games/details/teddy.json',
  'games/originals/teddy/teddy.gam',
  'games/originals/teddy/teddy.gam.gz',
  'games/gameware/nebula/nebula.gam',
  'desk/moten-snow-to-software-256.avif',
  'extras/demos/glub.rec',
  'gm/index.json',
];

describe('site service worker', () => {
  it('versions a game by its folder, a folder of pictures as one, and pages and catalogs on their own', () => {
    expect(groupOf('assets/desk-CtzsCBvT.js')).toBeUndefined();
    expect(groupOf('games/originals/teddy/teddy.gam')).toBe('games/originals/teddy/');
    expect(groupOf('games/originals/teddy/teddy.gam.gz')).toBe('games/originals/teddy/');
    expect(groupOf('games/catalog.json')).toBe('games/catalog.json');
    expect(groupOf('games/details/teddy.json')).toBe('games/details/teddy.json');
    expect(groupOf('play-teddy.html')).toBe('play-teddy.html');
    expect(groupOf('desk/moten-snow-to-software-256.avif')).toBe('desk/');
    expect(groupOf('extras/demos/glub.rec')).toBe('extras/');
  });

  it('runs the same grouping in the worker', () => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- runs the worker's generated source, as the browser would
    const [worker, key] = new Function(`${WORKER_GROUP_OF}; return [groupOf, groupKey];`)() as [(p: string) => string | undefined, (g: string) => string];
    for (const p of PATHS) expect(worker(p)).toBe(groupOf(p));
    for (const p of PATHS) expect(key(p)).toBe(groupKey(p));
    expect(groupKey('games/originals/teddy/')).not.toContain('teddy'); // names nothing
  });

  it('writes a worker that parses, with the shell, groups and hashed files in it', () => {
    const src = siteWorkerSource({
      version: 'v1',
      precache: ['./', 'index.html', 'assets/main-abc.js'],
      groups: { 'index.html': 'h1' },
      assets: ['assets/main-abc.js'],
    });
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- only parses the generated worker
    expect(() => new Function(src)).not.toThrow();
    expect(src).toContain('const PRECACHE = ["","index.html","assets/main-abc.js"]');
    expect(src).toContain('"index.html":"h1"');
  });
});

it('cleans up only its own cache versions when workers share Cache Storage', async () => {
  const names = new Set(['gm-export123']);
  const caches = {
    keys: async () => [...names],
    has: async (name: string) => names.has(name),
    delete: async (name: string) => names.delete(name),
    open: async (name: string) => {
      names.add(name);
      return { match: async () => undefined, keys: async () => [], put: async () => {}, addAll: async () => {} };
    },
  };
  function worker(source: string, scope: string) {
    const handlers = new Map<string, (event: { waitUntil: (work: Promise<void>) => void }) => void>();
    runInNewContext(source, {
      self: {
        registration: { scope },
        location: new URL('sw.js', scope),
        skipWaiting: async () => {},
        clients: { claim: async () => {} },
        addEventListener: (type: string, handler: (event: { waitUntil: (work: Promise<void>) => void }) => void) => handlers.set(type, handler),
      },
      caches,
      URL,
      Response,
    });
    return (type: string) => new Promise<void>((resolve, reject) => handlers.get(type)!({ waitUntil: (work) => work.then(resolve, reject) }));
  }
  const scope = 'https://example.test/';
  const site = worker(siteWorkerSource({ version: 'one', precache: [], groups: {}, assets: [] }), scope);
  const game = (version: string, path: string) => worker(serviceWorkerSource(version, []), scope + path);
  async function installGame(version: string, path: string) {
    const before = new Set(names);
    const lifecycle = game(version, path);
    await lifecycle('install');
    const added = [...names].filter((name) => !before.has(name));
    expect(added).toHaveLength(1);
    return { lifecycle, name: added[0] };
  }
  await site('install');
  const siteCache = offlineNames(scope).browsing;
  expect(names.has(siteCache)).toBe(true);
  const stage = [...names].find((name) => name !== siteCache && name !== 'gm-export123')!;
  const old = await installGame('old', 'games/');
  const sibling = await installGame('old', 'games/sub/');
  const current = await installGame('new', 'games/');
  await current.lifecycle('activate');
  expect(names.has(old.name)).toBe(false);
  expect(names.has(stage)).toBe(true);
  expect(names.has(siteCache)).toBe(true);
  await site('activate');
  expect(names.has(stage)).toBe(false);
  for (const name of [siteCache, current.name, sibling.name, 'gm-export123']) expect(names.has(name)).toBe(true);
});

it('keeps unchanged legacy browsing entries offline and refreshes a changed group on demand', async () => {
  const lazy = 'assets/editor-abc.js';
  const catalog = 'games/catalog.json';
  const picture = 'desk/picture.png';
  const sibling = new URL('../sibling/' + lazy, base).href;
  const groups = { [groupKey(catalog)]: 'old', [groupKey('desk/')]: 'same' };
  const h = harness('two', { assets: [lazy], groups: { ...groups, [groupKey(catalog)]: 'new' }, precache: [] });
  const legacy = await h.caches.open('gm-site-v2');
  await legacy.put('__gm-version.json', new Response(JSON.stringify({ groups, assets: [lazy, 'assets/removed.js'] })));
  for (const path of [lazy, catalog, picture, sibling, 'assets/removed.js']) await legacy.put(path, new Response(path));

  await h.lifecycle('install');
  await h.lifecycle('activate');
  const browsing = await h.caches.open(offlineNames(base).browsing);
  expect(await (await h.request(lazy)).text()).toBe(lazy);
  expect(await (await h.request(picture)).text()).toBe(picture);
  expect(h.fetcher).not.toHaveBeenCalled();
  expect(await browsing.match(catalog)).toBeUndefined();
  expect(await browsing.match('assets/removed.js')).toBeUndefined();
  expect(await browsing.match(sibling)).toBeUndefined();
  expect(await (await legacy.match(sibling))?.text()).toBe(sibling);
  h.fetcher.mockResolvedValueOnce(new Response('updated catalog'));
  expect(await (await h.request(catalog)).text()).toBe('updated catalog');
});

const migrationGroups = { [groupKey('desk/')]: 'same', [groupKey('index.html')]: 'home' };
async function seedLegacy(h: ReturnType<typeof harness>, paths: string[]) {
  const legacy = await h.caches.open('gm-site-v2');
  await legacy.put('__gm-version.json', Response.json({ groups: migrationGroups }));
  for (const path of paths) await legacy.put(path, new Response(path));
}

it('repairs an intermediate scoped cache while preserving newer scoped responses', async () => {
  const h = harness('two', { groups: migrationGroups, precache: [] });
  const cache = await h.caches.open(offlineNames(base).browsing);
  await cache.put('__gm-version.json', Response.json({ groups: migrationGroups }));
  await cache.put('desk/new.png', new Response('scoped'));
  await seedLegacy(h, ['desk/new.png', 'desk/missing.png']);
  await h.lifecycle('install');
  await h.lifecycle('activate');
  expect(await (await h.request('desk/missing.png')).text()).toBe('desk/missing.png');
  expect(await (await h.request('desk/new.png')).text()).toBe('scoped');
});

it('stages the unchanged legacy shell while offline', async () => {
  const h = harness('two', { groups: migrationGroups, precache: ['index.html'] });
  await seedLegacy(h, ['index.html']);
  await h.lifecycle('install');
  const cache = await h.caches.open(offlineNames(base).browsing);
  expect(await cache.match('index.html')).toBeUndefined();
  await h.lifecycle('activate');
  expect(await (await h.request('index.html')).text()).toBe('index.html');
  expect(h.fetcher).not.toHaveBeenCalled();
});

it('skips a browsing entry that exceeds quota and finishes activation', async () => {
  const h = harness('two', { groups: migrationGroups, precache: ['index.html'] });
  await seedLegacy(h, ['desk/full.png', 'desk/next.png']);
  h.fetcher.mockResolvedValueOnce(new Response('new shell'));
  await h.lifecycle('install');
  const browsing = offlineNames(base).browsing;
  h.beforePut.mockImplementation((name, url) => {
    if (name === browsing && url === base + 'desk/full.png') throw new DOMException('full', 'QuotaExceededError');
  });
  await h.lifecycle('activate');
  expect(h.claim).toHaveBeenCalledOnce();
  expect(await (await h.caches.open(browsing)).match('desk/full.png')).toBeUndefined();
  expect(await (await h.request('desk/next.png')).text()).toBe('desk/next.png');
  expect(await (await h.request('index.html')).text()).toBe('new shell');
});

it('downloads and activates the shell on a fresh install', async () => {
  const h = harness('one', { precache: ['index.html'] });
  h.registration.active = false;
  h.fetcher.mockResolvedValueOnce(new Response('first shell'));
  await h.lifecycle('install');
  await h.lifecycle('activate');
  expect(await (await h.request('index.html')).text()).toBe('first shell');
  expect(h.fetcher).toHaveBeenCalledTimes(1);
  expect(h.claim).toHaveBeenCalledOnce();
  expect(h.skipWaiting).toHaveBeenCalledOnce();
  expect(await h.caches.has('gm-site-v2')).toBe(false);
});

it('answers a media range request from the cache as 206 with that slice', async () => {
  const h = harness('one', { precache: ['index.html'] });
  h.registration.active = false;
  h.fetcher.mockResolvedValueOnce(new Response('first shell'));
  await h.lifecycle('install');
  await h.lifecycle('activate');
  const browsing = await h.caches.open(offlineNames(base).browsing);
  await browsing.put(base + 'tour/voice/home/home-hello.ogg', new Response('0123456789', { headers: { 'Content-Type': 'audio/ogg' } }));
  const whole = await h.request('tour/voice/home/home-hello.ogg', 'no-cors', 'default', { Range: 'bytes=0-' });
  expect(whole.status).toBe(206);
  expect(whole.headers.get('Content-Range')).toBe('bytes 0-9/10');
  expect(whole.headers.get('Content-Type')).toBe('audio/ogg');
  expect(await whole.text()).toBe('0123456789');
  const tail = await h.request('tour/voice/home/home-hello.ogg', 'no-cors', 'default', { Range: 'bytes=-3' });
  expect([tail.status, tail.headers.get('Content-Range'), await tail.text()]).toEqual([206, 'bytes 7-9/10', '789']);
  const middle = await h.request('tour/voice/home/home-hello.ogg', 'no-cors', 'default', { Range: 'bytes=2-4' });
  expect([middle.headers.get('Content-Length'), await middle.text()]).toEqual(['3', '234']);
  expect((await h.request('tour/voice/home/home-hello.ogg', 'no-cors', 'default', { Range: 'bytes=20-' })).status).toBe(416);
  const plain = await h.request('tour/voice/home/home-hello.ogg');
  expect([plain.status, await plain.text()]).toEqual([200, '0123456789']);
});
