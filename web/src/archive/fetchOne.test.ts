// The archive must not count a pending response as a saved file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOne } from './fetchOne';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchOne', () => {
  it('waits for a completed response instead of accepting a 202', async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('pending', { status: 202 }))
      .mockResolvedValueOnce(new Response('ready'));
    vi.stubGlobal('fetch', fetch);
    const result = fetchOne('/file');
    await vi.advanceTimersByTimeAsync(2000);
    expect(await result).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reports failure after five pending retries', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response('pending', { status: 202 })));
    vi.stubGlobal('fetch', fetch);
    const result = fetchOne('/file');
    await vi.runAllTimersAsync();
    expect(await result).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(6);
  });
});
