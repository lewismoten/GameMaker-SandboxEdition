// Exercise the screenshot CLI without replaying the disk or writing images.
import { afterEach, expect, it, vi } from 'vitest';

const { replay, writePng } = vi.hoisted(() => ({ replay: vi.fn(), writePng: vi.fn() }));
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', () => ({ writePng }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), mkdirSync: vi.fn() }));

const argv = process.argv;
afterEach(() => {
  process.argv = argv;
  vi.resetModules();
  vi.resetAllMocks();
});

it.each(['0', '-1', '1.5', 'typo', 'Infinity'])('rejects interval %s before replay', async (interval) => {
  process.argv = [...argv.slice(0, 2), 'shots', interval];
  replay.mockRejectedValue(new Error('started replay'));
  await expect(import('./fallShots')).rejects.toThrow(/positive integer/);
  expect(replay).not.toHaveBeenCalled();
});

it('samples only The Falls using the recording frame number', async () => {
  process.argv = [...argv.slice(0, 2), 'shots', '2'];
  replay.mockImplementation((_id, _walk, { onWorld, onFrame }) => {
    for (const scene of [2, 2, 3, 3, 3, 4]) {
      onWorld({ mx: 1, my: 2 }, scene);
      onFrame({ pixels: new Uint8Array(), palette: new Uint8Array() }, scene);
    }
    throw new Error('replay finished');
  });
  await expect(import('./fallShots')).rejects.toThrow('replay finished');
  expect(writePng.mock.calls.map(([name]) => name)).toEqual(['shots/s3-f00004-mx1-my2.png']);
});
