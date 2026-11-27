// An empty replay must report every missing shot, even when the output directory already exists.
import { expect, it, vi } from 'vitest';

vi.mock('../../kit/walkthrough', () => ({ replay: vi.fn() }));

it('names every missing capture when replay produces no frames', async () => {
  const argv = process.argv;
  process.argv = ['node', 'lightShots.ts', '.'];
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('unexpected successful exit');
  });
  try {
    const names = [1, 2].flatMap((level) => ['000', '010', '020', '030', '045', '070'].map((offset) => `L${level}-drop+${offset}.png`));
    await expect(import('./lightShots')).rejects.toThrow(names.join(', '));
  } finally {
    exit.mockRestore();
    process.argv = argv;
  }
});
