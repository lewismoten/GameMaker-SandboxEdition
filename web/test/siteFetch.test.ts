// Fetching hosted files: the catalog once, retries, shared requests and the gzip copies.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGameFile, loadCatalog, loadCatalogList, loadHostedGame, withDetails } from '../src/project/files';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: (url: string) => Uint8Array<ArrayBuffer> | string | null) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calls.push(url);
      const b = body(url);
      return new Response(b === null ? 'nf' : b, { status: b === null ? 404 : 200 });
    }),
  );
  return calls;
}

describe('hosted file fetching', () => {
  it('fetches the catalog once for everyone who asks', async () => {
    const calls = stubFetch(() => '[{"id":"x"}]');
    const [a, b] = await Promise.all([loadCatalog('./t1/'), loadCatalog('./t1/')]);
    expect(await loadCatalog('./t1/')).toBe(a);
    expect(b).toBe(a);
    expect(calls).toEqual(['./t1/index.json']);
  });

  it('retries the catalog after a failure', async () => {
    let fail = true;
    vi.stubGlobal('fetch', async () => {
      if (fail) throw new Error('offline');
      return new Response('[]');
    });
    await expect(loadCatalog('./t2/')).rejects.toThrow('offline');
    fail = false;
    expect(await loadCatalog('./t2/')).toEqual([]);
  });

  it('shares one request per file and finds CD names', async () => {
    const calls = stubFetch((u) => (u.endsWith('a_j.bkd') || u.endsWith('g.gam') ? new Uint8Array([1, 2, 3]) : null));
    const entry = { id: 'g', title: 'G', kind: 'gameware' as const, path: 'games/t3/', gam: 'g.gam', files: ['a_j.bkd', 'g.gam'] };
    const [x, y] = await Promise.all([fetchGameFile(entry, 'A-J.BKD'), fetchGameFile(entry, 'a_j.bkd')]);
    expect([...x!]).toEqual([1, 2, 3]);
    expect(y).toBe(x);
    expect(await fetchGameFile(entry, 'none.pal')).toBeUndefined();
    const files = await loadHostedGame(entry);
    expect(files.names()).toEqual(['a_j.bkd', 'g.gam']);
    expect(files.get('a_j.bkd')).not.toBe(x); // a copy the caller may edit
    expect(calls.filter((c) => c.endsWith('a_j.bkd'))).toHaveLength(1);
  });

  it('fetches the gzip copy of a game file and unpacks it, else the file itself', async () => {
    const { gzipSync } = await import('node:zlib');
    const bytes = new Uint8Array(4000).map((_, i) => i % 7);
    const packed = new Uint8Array(gzipSync(bytes));
    const calls = stubFetch((u) => (u.endsWith('b.bbl.gz') ? packed : u.endsWith('.bbl') || u.endsWith('t.gif') ? new Uint8Array([9]) : null));
    const entry = { path: 'games/t4/', files: ['b.bbl', 'c.bbl', 't.gif'], gz: true };
    expect([...(await fetchGameFile(entry, 'b.bbl'))!]).toEqual([...bytes]);
    // no copy there (or a broken one): the file itself
    expect([...(await fetchGameFile(entry, 'c.bbl'))!]).toEqual([9]);
    // GIFs are compressed already, so they have no copy
    expect([...(await fetchGameFile(entry, 't.gif'))!]).toEqual([9]);
    expect(calls).toEqual(['./games/t4/b.bbl.gz', './games/t4/c.bbl.gz', './games/t4/c.bbl', './games/t4/t.gif']);
  });

  it('fetches the plain file for catalogs without gzip copies', async () => {
    const calls = stubFetch(() => new Uint8Array([5]));
    expect([...(await fetchGameFile({ path: 'games/t5/', files: ['m.map'] }, 'm.map'))!]).toEqual([5]);
    expect(calls).toEqual(['./games/t5/m.map']);
  });

  it('reads the short catalog, and a game’s details on their own', async () => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      if (url === './t6/catalog.json')
        return json([
          { id: 's', kind: 'shareware', details: true, original: { sound: 'sb' } },
          { id: 'g', kind: 'gameware' },
        ]);
      if (url === './t6/details/s.json') return json({ notice: 'Register!', original: { manual: { title: 'M', pages: [] } } });
      return new Response('nf', { status: 404 });
    });
    const [s, g] = await loadCatalogList('./t6/');
    expect(await withDetails(g, './t6/')).toBe(g); // nothing left out
    const full = await withDetails(s, './t6/');
    expect(full.notice).toBe('Register!');
    expect(full.original).toEqual({ sound: 'sb', manual: { title: 'M', pages: [] } });
    expect(calls).toEqual(['./t6/catalog.json', './t6/details/s.json']);
  });

  it('uses the full catalog where there is no short one', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      url.endsWith('index.json')
        ? new Response('[{"id":"x","notice":"N"}]', { headers: { 'content-type': 'application/json' } })
        : new Response('<html>', { headers: { 'content-type': 'text/html' } }),
    );
    expect(await loadCatalogList('./t7/')).toEqual([{ id: 'x', notice: 'N' }]);
  });
});
