// The site's service worker: how it groups and versions files, and that its source parses.
import { runInNewContext } from 'node:vm';
import { serviceWorkerSource } from '../src/export/serviceWorker';
import { offlineNames } from '../src/offline/archiveStore';
import { describe, expect, it } from 'vitest';
import { groupKey, groupOf, siteWorkerSource, WORKER_GROUP_OF } from '../src/siteWorker';

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
