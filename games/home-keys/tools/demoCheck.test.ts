// Exercise the title demo check with replay results that the recorded demo cannot produce on demand.
import { beforeEach, expect, it, vi } from 'vitest';
import { replay } from '../../kit/walkthrough';

vi.mock('../../kit/walkthrough', () => ({ replay: vi.fn() }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

beforeEach(() => vi.resetModules());

it.each([
  { scenes: [2, 3, 4, 4], error: undefined, message: /2 3 4 4/ },
  { scenes: [2, 3, 4], error: 'replay failed', message: /replay failed/ },
])('rejects scenes $scenes with error $error', async ({ scenes, error, message }) => {
  vi.mocked(replay).mockResolvedValue({ scenes, keysLeft: 0, error } as Awaited<ReturnType<typeof replay>>);
  await expect(import('./demoCheck')).rejects.toThrow(message);
});
