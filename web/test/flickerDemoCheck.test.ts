// Exercise the demo checker's verdict independently of the recorded keys.
import { expect, it, vi } from 'vitest';
import { replay } from '../../games/kit/walkthrough';

vi.mock('../../games/kit/walkthrough', () => ({ replay: vi.fn() }));

it.each([
  { scenes: [2, 3, 4], error: undefined, message: 'expected scenes 2 3' },
  { scenes: [2, 3], error: new Error('replay failed'), message: 'replay failed' },
])('rejects scenes $scenes with error $error', async ({ scenes, error, message }) => {
  vi.resetModules();
  vi.mocked(replay).mockResolvedValue({ scenes, error, keysLeft: 0 } as Awaited<ReturnType<typeof replay>>);
  await expect(import('../../games/flicker/tools/demoCheck')).rejects.toThrow(message);
});
