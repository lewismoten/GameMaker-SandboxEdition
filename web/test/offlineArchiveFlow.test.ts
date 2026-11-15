// The shared web/desk controller passes the selection to transactional file acquisition.
import { afterEach, expect, it, vi } from 'vitest';
import { makeOffline, type OfflineStatus } from '../src/offline/offlineCopy';
import { installFiles, offlineLock } from '../src/offline/archiveStore';
vi.mock('../src/offline/archiveStore', () => ({ installFiles: vi.fn(), offlineLock: vi.fn((_base: string, run: () => Promise<unknown>) => run()) }));
vi.mock('../src/project/files', () => ({ loadCatalogList: async () => [] }));
vi.mock('../src/achievements', () => ({ unlockAchievement: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it('passes selected tiers and per-file hashes without fetching an archive', async () => {
  vi.stubGlobal('location', { href: 'https://example.test/repo/' });
  vi.stubGlobal('navigator', { storage: {} });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const file = { path: 'index.html', wire: 10, stored: 10, sha256: 'a'.repeat(64), tier: 'core' as const };
  const status: OfflineStatus = {
    supported: true,
    shell: [],
    files: [file],
    missing: [file],
    wireTotal: 10,
    wireMissing: 10,
    storedMissing: 10,
    ready: false,
    copy: 'none',
    version: 'v1',
    tiers: ['core', 'speech'],
    tierFiles: [file],
    manifest: { version: 'v1', shell: [], files: [file] },
  };
  expect(await makeOffline(status, vi.fn(), new AbortController().signal)).toEqual({ ok: true });
  expect(offlineLock).toHaveBeenCalledTimes(1);
  expect(vi.mocked(installFiles).mock.calls[0]?.slice(1, 4)).toEqual([status.manifest, [], ['core', 'speech']]);
  expect(fetcher).not.toHaveBeenCalled();
});
