// A failed game leaves the remaining batch and its summary intact.
import { expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { importWithProgress } from './importChooser';

it.each([null, undefined])('continues the batch when a game rejects with %s', async (reason) => {
  vi.stubGlobal('document', new FakeDoc());
  const games = ['A', 'B'].map((name) => ({ name, from: '', gamCrcs: [], fileCount: 1, zips: [], inner: [], paths: [] }));
  const save = vi.fn().mockRejectedValueOnce(reason).mockResolvedValueOnce(undefined);
  try {
    const result = await importWithProgress(games, save);
    expect(save.mock.calls).toEqual([[games[0]], [games[1]]]);
    expect(result).toEqual({ done: 1, failed: ['A (Something went wrong while importing the game.)'] });
  } finally {
    vi.unstubAllGlobals();
  }
});
