// Check Kit's full jump pose in the picture sent to the PNG writer.
import { basename } from 'node:path';
import { expect, it, vi } from 'vitest';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildStarterPalette } from '../../kit/starter/palette';

vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', () => ({ writePng: vi.fn() }));

it('shows both halves of Kit on the third-token ledge', async () => {
  const argv = vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'shots.ts', '.']);
  try {
    await import('./shots');
  } finally {
    argv.mockRestore();
  }
  const shot = vi.mocked(writePng).mock.calls.find(([file]) => basename(file) === '2-third-token.png')![1];
  const kit = heroPicture(buildHeroBlocks(buildStarterPalette()), 'cheer.top', 'jump');
  for (let y = 0; y < kit.h; y++)
    for (let x = 0; x < kit.w; x++) {
      const pixel = kit.px[y * kit.w + x];
      if (pixel !== 255) expect(shot.px[(20 + y) * shot.w + (22 - 14) * 20 + x]).toBe(pixel);
    }
});
