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

  it('retries a stalled header and a stalled body, then reports failure', async () => {
    vi.useFakeTimers();
    const stall = (options: RequestInit) =>
      new Promise<never>((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(new Error('timeout'))));
    const fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => stall(options));
    vi.stubGlobal('fetch', fetch);
    const result = fetchOne('/file');
    await vi.runAllTimersAsync();
    expect(await result).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);

    const body = vi.fn().mockImplementation((_url: string, options: RequestInit) => ({ ok: true, status: 200, arrayBuffer: () => stall(options) }));
    vi.stubGlobal('fetch', body);
    const second = fetchOne('/file');
    await vi.runAllTimersAsync();
    expect(await second).toBe(false);
    expect(body).toHaveBeenCalledTimes(2);
  });
});
