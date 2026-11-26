// Exercise archive.html's entry point with a manifest and a count-only display.
import { afterEach, expect, it, vi } from 'vitest';

function page(search = '') {
  const elements = Object.fromEntries(['status', 'part', 'bar', 'counts', 'done'].map((id) => [id, { textContent: '', hidden: true }]));
  vi.stubGlobal('document', { getElementById: (id: string) => elements[id] });
  vi.stubGlobal('location', { search, href: 'https://example.org/archive.html' });
  return elements;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('retries stalled headers and bodies, drains the queue and reports exhausted attempts', async () => {
  vi.useFakeTimers();
  const elements = page();
  const calls: string[] = [];
  const shell = ['a', 'b', 'c', 'd', 'e'];
  vi.stubGlobal('fetch', (url: string, options: RequestInit) => {
    if (url === './archive.json') return Response.json({ shell, files: [] });
    const path = new URL(url).pathname;
    calls.push(path);
    const stall = () => new Promise((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(new Error('timeout'))));
    if (path === '/a') return stall();
    if (['/b', '/c', '/d'].includes(path)) return { ok: true, arrayBuffer: stall };
    return new Response();
  });
  await import('./archive');
  await vi.runAllTimersAsync();
  expect(calls.filter((p) => p === '/a')).toHaveLength(2);
  expect(calls.filter((p) => p === '/b')).toHaveLength(2);
  expect(calls).toContain('/e');
  expect(elements.done.textContent).toBe('Done. 4 of 8 files could not be fetched.');
});
