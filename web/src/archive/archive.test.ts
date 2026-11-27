// Exercise the archive page with a one-part manifest and a stale or invalid link.
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it.each(['2', '1.5', '0', '-1', '', 'abc'])('shows the available parts before fetching files for ?part=%s', async (part) => {
  const nodes = new Map(['status', 'counts', 'bar', 'done', 'part'].map((id) => [id, { textContent: '' }]));
  vi.stubGlobal('document', { getElementById: (id: string) => nodes.get(id) });
  vi.stubGlobal('location', new URL('https://localhost/archive.html?part=' + part));
  const fetch = vi.fn(() => Promise.resolve(Response.json({ shell: [], files: [] })));
  vi.stubGlobal('fetch', fetch);

  await import('./archive');
  await vi.dynamicImportSettled();

  expect(nodes.get('counts')?.textContent).toBe('Only archive part 1 is available.');
  expect(nodes.get('status')?.textContent).toBe(nodes.get('counts')?.textContent);
  expect(fetch).toHaveBeenCalledTimes(1);
});
