import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGameFile, loadCatalog, loadHostedGame } from '../src/project/files';

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
});
