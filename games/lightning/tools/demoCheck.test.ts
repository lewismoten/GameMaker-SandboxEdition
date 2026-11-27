// A partial title demo must earn its success message from the replay.
import { afterEach, expect, it, vi } from 'vitest';
import { replay } from '../../kit/walkthrough';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND } from '../src/levels';

vi.mock('../../kit/walkthrough', () => ({ replay: vi.fn() }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
afterEach(() => vi.resetModules());

it.each([
  { scenes: [2, 3], error: 'synthetic replay failure', ditch: true, message: 'synthetic replay failure' },
  { scenes: [2, 3, 2], error: undefined, ditch: true, message: 'scenes' },
  { scenes: [2, 3], error: undefined, ditch: false, message: 'ditch' },
])('rejects an invalid demo ($message)', async ({ scenes, error, ditch, message }) => {
  vi.mocked(replay).mockImplementation(async (_id, _walk, opts) => {
    const world = { chr: { x: [ORIGIN + 15, 0], y: [ORIGIN + GROUND + 1, 0] } };
    opts?.onWorld?.(world as Parameters<NonNullable<typeof opts.onWorld>>[0], ditch ? 3 : 2, 10);
    return { scenes, error, keysLeft: 0 } as Awaited<ReturnType<typeof replay>>;
  });
  await expect(import('./demoCheck')).rejects.toThrow(message);
});
