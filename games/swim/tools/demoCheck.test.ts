// Exercise the title-demo check with replay results a healthy recording cannot produce.
import { expect, it, vi } from 'vitest';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: () => new Uint8Array(),
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

it.each([
  { name: 'a repeated final lesson', scenes: [2, 3, 4, 4], error: undefined },
  { name: 'a replay error after the final lesson', scenes: [2, 3, 4], error: new Error('replay failed') },
])('rejects $name', async ({ scenes, error }) => {
  vi.resetModules();
  replay.mockResolvedValue({ scenes, error, keysLeft: 0 });
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo check exited');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo check exited');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
