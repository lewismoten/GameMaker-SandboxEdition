// A replay can fail on its last frame after visiting every expected scene and consuming every key.
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array(4) }));

vi.mock('../../kit/walkthrough', () => ({
  replay: () => ({ scenes: [2, 4, 5], keysLeft: 0, error: 'last frame failed' }),
}));

it('fails the demo check with the replay error', async () => {
  await expect(import('./demoCheck')).rejects.toBe('last frame failed');
});
