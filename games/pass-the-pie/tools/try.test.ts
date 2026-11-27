// Exercise the partial-run CLI with the same environment variables it reads in the shell.
import { expect, it, vi } from 'vitest';
import { play, SEED } from './play';
import { LEVELS } from './route';

it('rejects a nonnumeric UPTO before playing any levels', async () => {
  vi.stubEnv('FROM', '0');
  vi.stubEnv('UPTO', 'all');
  try {
    await expect(import('./try')).rejects.toThrow('FROM and UPTO must be integers');
  } finally {
    vi.unstubAllEnvs();
  }
});

it.each([
  [-1, 1],
  [0, LEVELS.length + 1],
  [0.5, 1],
  [0, 1.5],
  [1, 1],
  [2, 1],
])('rejects the range [%s, %s)', async (from, upTo) => {
  await expect(play(SEED, upTo, from)).rejects.toThrow(RangeError);
});
