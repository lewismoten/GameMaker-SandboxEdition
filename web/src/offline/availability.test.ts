// Actual cache bodies, rather than an old completion flag, determine absent content labels.
import { afterEach, expect, it, vi } from 'vitest';
import { availableOffline, requireOfflineFile, markOfflineAction } from './availability';
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

it('restores an unavailable action and its labels on reconnect', async () => {
  const events = new EventTarget();
  vi.stubGlobal('window', events);
  const nav = { onLine: false };
  vi.stubGlobal('navigator', nav);
  vi.stubGlobal('location', { href: 'https://example.test/' });
  vi.stubGlobal('caches', { has: async () => false });
  const attrs = new Map([
    ['aria-label', 'Open game'],
    ['title', 'Original title'],
  ]);
  const control = Object.assign(new EventTarget(), {
    textContent: 'Open',
    title: 'Original title',
    getAttribute: (key: string) => attrs.get(key) ?? null,
    setAttribute: (key: string, value: string) => attrs.set(key, value),
    removeAttribute: (key: string) => attrs.delete(key),
    append: vi.fn(),
  });
  const label = { remove: vi.fn() };
  vi.stubGlobal('document', { createTextNode: () => label });
  markOfflineAction(control as unknown as HTMLElement, './missing.zip');
  await vi.waitFor(() => expect(attrs.get('aria-disabled')).toBe('true'));
  const blocked = new Event('click', { cancelable: true });
  control.dispatchEvent(blocked);
  expect(blocked.defaultPrevented).toBe(true);
  nav.onLine = true;
  events.dispatchEvent(new Event('online'));
  await Promise.resolve();
  const allowed = new Event('click', { cancelable: true });
  control.dispatchEvent(allowed);
  expect(allowed.defaultPrevented).toBe(false);
  expect(attrs.has('aria-disabled')).toBe(false);
  expect(attrs.get('aria-label')).toBe('Open game');
  expect(control.title).toBe('Original title');
  expect(label.remove).toHaveBeenCalledOnce();
});
