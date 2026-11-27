// Exercise the title demo validator with replay outcomes independent of the recording.
import { afterEach, expect, it, vi } from 'vitest';

const { replay } = vi.hoisted(() => ({ replay: vi.fn() }));
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each([
  { scenes: [2, 3], keysLeft: 0, error: 'fixture replay failure' },
  { scenes: [2, 3, 2], keysLeft: 0 },
])('rejects an invalid replay $scenes $error', async (result) => {
  replay.mockResolvedValue(result);
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`exit ${code}`);
  });
  await expect(import('./demoCheck')).rejects.toThrow('exit 1');
});
