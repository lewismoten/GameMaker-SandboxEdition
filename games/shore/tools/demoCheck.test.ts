// A failed replay can still report both scenes and consume every key.
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
vi.mock('../../kit/walkthrough', () => ({ replay: () => ({ scenes: [2, 3], keysLeft: 0, error: 'replay failed' }) }));

it('exits with a failure when the demo replay reports an error', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('command exited');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('command exited');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
