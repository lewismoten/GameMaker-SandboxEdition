// Exercise the title demo checker with replay outcomes independent of the recorded route.
import { afterEach, expect, it, vi } from 'vitest';

const { replay } = vi.hoisted(() => ({ replay: vi.fn() }));
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array(0) }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each([
  { scenes: [2, 3, 3, 3], keysLeft: 0 },
  { scenes: [2, 3, 3], keysLeft: 0, error: new Error('replay failed') },
])('rejects an invalid replay result', async (result) => {
  replay.mockResolvedValue(result);
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('checker exited');
  });
  await expect(import('./demoCheck')).rejects.toThrow('checker exited');
  expect(process.exit).toHaveBeenCalledWith(1);
});
