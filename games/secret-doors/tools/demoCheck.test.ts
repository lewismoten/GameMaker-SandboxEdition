// Exercise the title demo checker with engine results independent of the recorded keys.
import { expect, it, vi } from 'vitest';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

it.each([
  { name: 'replay error', scenes: [2, 3], keysLeft: 0, error: new Error('timeout') },
  { name: 'extra scene', scenes: [2, 3, 4], keysLeft: 0 },
  { name: 'unplayed key', scenes: [2, 3], keysLeft: 1 },
])('rejects a replay with a $name', async (result) => {
  vi.resetModules();
  replay.mockResolvedValue(result);
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
