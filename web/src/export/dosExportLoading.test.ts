// Loading the DOS writer must not evaluate installation support until an export is requested.
import { expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';

const state = vi.hoisted(() => ({ loaded: false }));
vi.mock('./dosInstall', () => {
  state.loaded = true;
  throw new Error('installer chunk unavailable');
});

it('defers installer evaluation to export and propagates a failed chunk load', async () => {
  const { exportDos } = await import('./exportDos');
  expect(state.loaded).toBe(false);
  await expect(
    exportDos(new GameFiles([['test.gam', Uint8Array.of(1)]]), {
      title: 'Test',
      gam: 'test.gam',
      runtime: { player: Uint8Array.of(1), driver: Uint8Array.of(2) },
    }),
  ).rejects.toMatchObject({ cause: { message: 'installer chunk unavailable' } });
  expect(state.loaded).toBe(true);
});
