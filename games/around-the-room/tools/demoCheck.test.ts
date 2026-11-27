// Exercise the title demo checker with replay outcomes independent of the recorded keys.
import { expect, it, vi } from 'vitest';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

it.each([
  { name: 'replay error', scenes: [2, 3, 4, 5], error: new Error('timeout') },
  { name: 'repeated final lesson', scenes: [2, 3, 4, 5, 5], error: undefined },
])('rejects a $name with every key played', async ({ scenes, error }) => {
  vi.resetModules();
  replay.mockResolvedValue({ scenes, keysLeft: 0, error });
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit 1');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('exit 1');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
