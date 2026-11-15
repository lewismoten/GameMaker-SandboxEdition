// Public offline preparation must acquire one archive, not the manifest's individual files.
import { afterEach, expect, it, vi } from 'vitest';
import { makeOffline, offlineStatus, type OfflineStatus } from '../src/offline/offlineCopy';
import { installArchive, offlineLock, readOfflineCopy } from '../src/offline/archiveStore';
vi.mock('../src/offline/archiveStore', () => ({
  installArchive: vi.fn(),
  readOfflineCopy: vi.fn(),
  offlineLock: vi.fn((_base: string, run: () => Promise<unknown>) => run()),
}));
vi.mock('../src/project/files', () => ({ loadCatalogList: async () => [] }));
vi.mock('../src/achievements', () => ({ unlockAchievement: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it('passes the archive to transactional extraction instead of fetching missing URLs', async () => {
  vi.stubGlobal('location', { href: 'https://example.test/repo/' });
  vi.stubGlobal('navigator', { storage: {} });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const status: OfflineStatus = {
    supported: true,
    shell: [],
    files: [{ path: 'index.html', wire: 10, stored: 10 }],
    missing: [{ path: 'index.html', wire: 10, stored: 10 }],
    wireTotal: 100,
    wireMissing: 100,
    storedMissing: 10,
    ready: false,
    copy: 'none',
    version: 'v1',
    archive: { path: 'offline.hash.zip', bytes: 100, sha256: 'hash' },
  };
  expect(await makeOffline(status, vi.fn(), new AbortController().signal)).toEqual({ ok: true });
  expect(offlineLock).toHaveBeenCalledTimes(1);
  expect(installArchive).toHaveBeenCalledTimes(1);
  expect(fetcher).not.toHaveBeenCalled();
});

it('reports readiness only for the current committed version with every required entry', async () => {
  const base = 'https://example.test/repo/';
  vi.stubGlobal('location', { href: base });
  vi.stubGlobal('navigator', { serviceWorker: {}, locks: {}, storage: {} });
  vi.stubGlobal('localStorage', { getItem: () => 'v1' });
  vi.stubGlobal(
    'fetch',
    async () =>
      new Response(
        JSON.stringify({ version: 'v2', shell: ['./'], files: [['index.html', 10, 10]], archive: { path: 'offline.hash.zip', bytes: 100, sha256: 'hash' } }),
        { headers: { 'content-type': 'application/json' } },
      ),
  );
  let keys = [new Request(base + 'index.html')];
  vi.stubGlobal('caches', { open: async () => ({ keys: async () => keys }) });
  vi.mocked(readOfflineCopy).mockResolvedValue({ version: 'v1', cache: 'old-copy' });
  expect((await offlineStatus()).ready).toBe(false);
  expect((await offlineStatus()).copy).toBe('outdated');
  vi.mocked(readOfflineCopy).mockResolvedValue({ version: 'v2', cache: 'current-copy' });
  expect((await offlineStatus()).ready).toBe(true);
  keys = [];
  expect((await offlineStatus()).ready).toBe(false);
});
