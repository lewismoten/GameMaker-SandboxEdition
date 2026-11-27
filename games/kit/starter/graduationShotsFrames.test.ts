// Exercise the capture commands with a stationary camera and no disk writes.
import { afterEach, expect, it, vi } from 'vitest';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';

vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  mkdirSync: vi.fn(),
  readFileSync: (path: URL) => {
    if (path.pathname.endsWith('.fli')) throw new Error('missing optional animation');
    return path.pathname.endsWith('.json') ? '{}' : new Uint8Array();
  },
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/gif', () => ({
  decodeGif: () => ({ width: 1, height: 1, pixels: [0], palette: [] }),
}));
vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', () => ({ writePng: vi.fn() }));
vi.mock('../walkthrough', () => ({
  replay: (
    _id: string,
    _walk: unknown,
    hooks: { onWorld: (world: { mx: number }, scene: number) => void; onFrame: (screen: { pixels: number[] }, scene: number) => void },
  ) => {
    hooks.onWorld({ mx: 5 }, 2);
    for (let i = 0; i < 4; i++) hooks.onFrame({ pixels: [] }, 2);
  },
}));

const originalArgv = process.argv;
afterEach(() => {
  vi.restoreAllMocks();
  process.argv = originalArgv;
  vi.clearAllMocks();
  vi.resetModules();
});

it('keeps both sampled frames in the same camera column', async () => {
  process.argv = ['node', 'shots', 'graduation-basics', 'out', '', '2'];
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('finished');
  });
  await expect(import('./graduationShots')).rejects.toThrow('finished');
  const paths = vi
    .mocked(writePng)
    .mock.calls.map(([path]) => path)
    .filter((path) => path.includes('-walk-'));
  expect(paths).toHaveLength(2);
  expect(new Set(paths).size).toBe(2);
});
