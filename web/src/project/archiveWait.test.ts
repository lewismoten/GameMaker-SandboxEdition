// archiveWait: a 202 is retried with backoff and announced politely; other answers pass through.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveLabel, fetchArchive, retryDelayMs } from './archiveWait';

const region = {
  textContent: '',
  hidden: true,
  style: {} as Record<string, string>,
  attrs: {} as Record<string, string>,
  setAttribute(k: string, v: string) {
    this.attrs[k] = v;
  },
};
beforeEach(() => vi.stubGlobal('document', { createElement: () => region, body: { append: () => undefined } }));
afterEach(() => vi.unstubAllGlobals());

describe('archiveWait', () => {
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
