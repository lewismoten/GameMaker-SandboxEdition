// Actual cache bodies, rather than an old completion flag, determine absent content labels.
import { afterEach, expect, it, vi } from 'vitest';
import { availableOffline, requireOfflineFile } from './availability';
vi.mock('./archiveStore', () => ({ readOfflineCopy: async () => ({ cache: 'complete' }) }));
afterEach(() => vi.unstubAllGlobals());
it('allows online downloads and checks both committed and browsing entries offline', async () => {
  vi.stubGlobal('location', { href: 'https://example.test/' });
  const nav = { onLine: true };
  vi.stubGlobal('navigator', nav);
  const stored = new Set(['https://example.test/kept.zip']);
  vi.stubGlobal('caches', {
    has: async () => true,
    open: async () => ({ match: async (url: string) => (stored.has(url) ? new Response('kept') : undefined) }),
  });
  expect(await availableOffline('./missing.zip')).toBe(true);
  nav.onLine = false;
  expect(await availableOffline('./kept.zip')).toBe(true);
  expect(await availableOffline('./missing.zip')).toBe(false);
  await expect(requireOfflineFile('./missing.zip')).rejects.toThrow('Not in your offline copy');
  stored.clear();
  expect(await availableOffline('./kept.zip')).toBe(false);
});
