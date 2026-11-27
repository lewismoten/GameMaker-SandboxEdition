// Check that the Wired Room demo rejects a second fall through the hatch.
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));
vi.mock('../../kit/walkthrough', () => ({ replay: async () => ({ scenes: [2, 2, 3, 3, 3], keysLeft: 0 }) }));

it('rejects an extra restart of the second lesson after every key played', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
