// fetchGameZip joins a split game's ZIP from its .zpart file and shared data, and fails like a missing ZIP when a piece is wrong.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { encodePart, zipDataRanges } from './zipParts';
import { fetchGameZip, SHARED_DIR } from './sharedZip';

const noise = (n: number, seed: number) => Uint8Array.from({ length: n }, (_, i) => (i * 31 + seed * 17) % 253);

async function site(tamper = false) {
  const zip = await createZip(
    [
      { name: 'A.EXE', data: noise(4000, 1) },
      { name: 'B.GAM', data: noise(2000, 2) },
    ],
    new Date(2000, 0, 1),
  );
  const [o, l] = zipDataRanges(zip)[0];
  const blob = zip.slice(o, o + l);
  const name = createHash('sha256').update(blob).digest('hex').slice(0, 24);
  const served = new Map<string, Uint8Array>([
    ['./games/originals/a/a.zpart', encodePart(zip, [[o, l, name]])],
    [`./${SHARED_DIR}${name}.bin`, tamper ? blob.map((b) => b ^ 1) : blob],
  ]);
  const fetch = vi.fn(async (url: string) => {
    const b = served.get(url);
    return b ? new Response(b as Uint8Array<ArrayBuffer>) : new Response(null, { status: 404 });
  });
  vi.stubGlobal('fetch', fetch);
  return { zip, fetch };
}

describe('fetchGameZip', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('joins a split ZIP into the same bytes', async () => {
    const { zip } = await site();
    const res = await fetchGameZip({ path: 'games/originals/a/', pack: 'a.zip', parts: 'a.zpart' });
    expect(res.ok).toBe(true);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(zip);
  });

  it.each([0, 1])('keeps the other ZIP open when caller %i cancels a pending read', async (cancelled) => {
    vi.resetModules();
    const { fetchGameZip: open } = await import('./sharedZip');
    const { zip, fetch: serve } = await site();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('.bin')) {
        await pending;
        init?.signal?.throwIfAborted();
      }
      return serve(url);
    });
    vi.stubGlobal('fetch', fetch);
    const controllers = [new AbortController(), new AbortController()];
    const entry = { path: 'games/originals/a/', parts: 'a.zpart' };
    const reads = controllers.map(({ signal }) => open(entry, './', { signal }));
    await vi.waitFor(() => expect(fetch.mock.calls.some(([url]) => url.endsWith('.bin'))).toBe(true));
    controllers[cancelled].abort();
    await expect(reads[cancelled]).rejects.toMatchObject({ name: 'AbortError' });
    release();
    expect(new Uint8Array(await (await reads[1 - cancelled]).arrayBuffer())).toEqual(zip);
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('.bin'))).toHaveLength(1);
    fetch.mockClear();
    expect((await open(entry)).ok).toBe(true);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['./games/originals/a/a.zpart']);
  });

  it('fetches a whole ZIP as it is', async () => {
    const { fetch } = await site();
    const res = await fetchGameZip({ path: 'games/originals/a/', pack: 'a.zip' });
    expect(res.status).toBe(404);
    expect(fetch).toHaveBeenCalledWith('./games/originals/a/a.zip', undefined);
  });

  it('fails when shared data does not match its name', async () => {
    await site(true);
    // a fresh module, so the good copy the first test fetched is not reused
    vi.resetModules();
    const fresh = await import('./sharedZip');
    const res = await fresh.fetchGameZip({ path: 'games/originals/a/', pack: 'a.zip', parts: 'a.zpart' });
    expect(res.ok).toBe(false);
  });
});
