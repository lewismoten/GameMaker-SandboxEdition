// Exercise selector validation through the picture exporter's command-line entry point.
import { expect, it, vi } from 'vitest';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';

vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', () => ({ writePng: vi.fn() }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), mkdirSync: vi.fn() }));

it('reports every unknown selector before exporting a valid level', async () => {
  const argv = vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'levelShots.ts', 'pictures', 'bakery', 'BAKERY', 'typo']);
  try {
    await expect(import('./levelShots')).rejects.toThrow('Unknown level selectors: BAKERY, typo');
    expect(writePng).not.toHaveBeenCalled();
  } finally {
    argv.mockRestore();
  }
});
