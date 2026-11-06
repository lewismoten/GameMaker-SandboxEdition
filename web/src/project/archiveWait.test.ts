// archiveWait: a 202 is retried with backoff and announced politely; other answers pass through.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveLabel, fetchArchive, retryDelayMs } from './archiveWait';

const writes: string[] = [];
let text = '';
const region = {
  get textContent() {
    return text;
  },
  set textContent(value: string) {
    text = value;
    writes.push(value);
  },
  hidden: true,
  style: {} as Record<string, string>,
  attrs: {} as Record<string, string>,
  setAttribute(k: string, v: string) {
    this.attrs[k] = v;
  },
};
beforeEach(() => {
  writes.length = 0;
  vi.stubGlobal('document', { createElement: () => region, body: { append: () => undefined } });
});
afterEach(() => vi.unstubAllGlobals());

describe('archiveWait', () => {
  it('does not rewrite identical pending text on every retry', async () => {
    let count = 0;
    vi.stubGlobal('fetch', async () => new Response(null, { status: ++count <= 3 ? 202 : 200 }));
    await fetchArchive('./games/x/y/y.zip', undefined, async () => {});
    expect(writes.filter((t) => t.startsWith('Preparing'))).toEqual(['Preparing y… (still building)']);
  });
  it('restores the still-pending request label when another settles, and clears after rejection', async () => {
    const release = new Map<string, () => void>();
    const counts = new Map<string, number>();
    vi.stubGlobal('fetch', async (url: string) => {
      const n = (counts.get(url) ?? 0) + 1;
      counts.set(url, n);
      if (n > 1 && url.includes('/a/')) throw new Error('Controlled archive refusal');
      return new Response(null, { status: n === 1 ? 202 : 200 });
    });
    const wait = (key: string) => async () => new Promise<void>((resolve) => release.set(key, resolve));
    const a = fetchArchive('./games/x/a/a.zip', undefined, wait('a'));
    const failed = expect(a).rejects.toThrow('Controlled archive refusal');
    const b = fetchArchive('./games/x/b/b.zip', undefined, wait('b'));
    await vi.waitFor(() => expect(release.size).toBe(2));
    expect(region.textContent).toBe('Preparing b… (still building)');
    release.get('b')!();
    await b;
    const pending = { text: region.textContent, hidden: region.hidden };
    release.get('a')!();
    await failed;
    expect(pending.text).toBe('Preparing a… (still building)');
    expect(pending.hidden).toBe(false);
    expect(region.hidden).toBe(true);
  });
  it('backs off from 2 s to at most 30 s, honoring Retry-After', () => {
    expect([0, 1, 2, 3, 4, 9].map((n) => retryDelayMs(n))).toEqual([2000, 4000, 8000, 16000, 30000, 30000]);
    expect(retryDelayMs(0, 5)).toBe(5000);
  });
  it('names the game from its URL', () => expect(archiveLabel('./games/gameware/sample/sample.zip')).toBe('sample'));
  it('retries a 202, then returns the ready response', async () => {
    const replies = [new Response(null, { status: 202 }), new Response(null, { status: 202 }), new Response('zip')];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => replies.shift()!),
    );
    const waits: number[] = [];
    const res = await fetchArchive('./games/x/y/y.zip', undefined, async (ms) => void waits.push(ms));
    expect(await res.text()).toBe('zip');
    expect(waits).toEqual([2000, 4000]);
    expect(region.hidden).toBe(true);
    expect(region.attrs['aria-live']).toBe('polite');
  });
  it('shows "Preparing" while waiting', async () => {
    const replies = [new Response(null, { status: 202 }), new Response('ok')];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => replies.shift()!),
    );
    let seen = '';
    await fetchArchive('./games/x/y/y.zip', undefined, async () => void (seen = region.textContent));
    expect(seen).toBe('Preparing y… (still building)');
  });
});
