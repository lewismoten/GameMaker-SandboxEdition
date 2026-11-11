// Cancellation uses finite fetch/reader doubles, with no real network or stalled stream.
import { afterEach, expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fetchGame } from './fetchGame';

afterEach(() => vi.unstubAllGlobals());
it('passes cancellation to fetch and cancels and releases its body reader', async () => {
  const abort = new AbortController();
  const reader = {
    read: vi.fn(async () => {
      abort.abort();
      return { done: false, value: new Uint8Array([1]) };
    }),
    cancel: vi.fn(async () => undefined),
    releaseLock: vi.fn(),
  };
  const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
    expect(init.signal).toBe(abort.signal);
    return { ok: true, headers: new Headers(), body: { getReader: () => reader } };
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(fetchGame('https://example.invalid/game.zip', undefined, abort.signal)).rejects.toMatchObject({ reason: 'declined' });
  expect(reader.read).toHaveBeenCalledOnce();
  expect(reader.cancel).toHaveBeenCalled();
  expect(reader.releaseLock).toHaveBeenCalledOnce();
});

it('stops starting referenced-file downloads after cancellation', async () => {
  const abort = new AbortController();
  const game = newGame('Test');
  game.scenes[0].files[0] = 'a.pal';
  game.scenes[0].files[1] = 'a.map';
  const fetcher = vi.fn(async (url: string) => {
    if (url.endsWith('game.gam')) return new Response(serializeGame(game) as BodyInit);
    abort.abort();
    return new Response(new Uint8Array([1]));
  });
  vi.stubGlobal('fetch', fetcher);
  await expect(fetchGame('https://example.invalid/game.gam', undefined, abort.signal)).rejects.toMatchObject({ reason: 'declined' });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('reports aborted body reads as cancellation even when reader cleanup also rejects', async () => {
  const abort = new AbortController();
  const reader = {
    read: async () => {
      abort.abort();
      throw new DOMException('aborted', 'AbortError');
    },
    cancel: vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    }),
    releaseLock: vi.fn(),
  };
  vi.stubGlobal('fetch', async () => ({ ok: true, headers: new Headers(), body: { getReader: () => reader } }));
  await expect(fetchGame('https://example.invalid/game.zip', undefined, abort.signal)).rejects.toMatchObject({ reason: 'declined' });
  expect(reader.releaseLock).toHaveBeenCalledOnce();
});
