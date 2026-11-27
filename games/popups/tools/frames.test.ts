// Run the frame command on the built Score Popups disk, omitting PNG compression.
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { play } from './play';

vi.mock('./play', { spy: true });
vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', () => ({ writePng: vi.fn() }));

async function runFrames() {
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'frames.ts', fileURLToPath(new URL('../../../.tmp/', import.meta.url))]);
  await import('./frames');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

it('writes a strip for each pickup in both levels', async () => {
  await runFrames();
  expect(vi.mocked(writePng).mock.calls.map(([file]) => basename(file))).toEqual([
    'l1-1-score10.png',
    'l1-2-score20.png',
    'l1-3-score120.png',
    'l1-4-score220.png',
    'l1-5-score320.png',
    'l2-1-score520.png',
    'l2-2-score1020.png',
    'l2-3-score1120.png',
    'l2-4-score1220.png',
  ]);
});

it('propagates a failed route to level two', async () => {
  vi.mocked(play).mockRejectedValueOnce(new Error('route failed'));
  await expect(runFrames()).rejects.toThrow('route failed');
});

it('rejects a level that ends before every expected score change', async () => {
  vi.mocked(play).mockImplementationOnce(async () => {
    const level = await vi.importActual<typeof import('./play')>('./play');
    const result = await level.play(1, 1);
    vi.spyOn(result.sim, 'pos', 'get').mockReturnValue({ ...result.sim.pos, x: 45 });
    return result;
  });
  await expect(runFrames()).rejects.toThrow('l2: captured 0 of 4 score changes');
});
