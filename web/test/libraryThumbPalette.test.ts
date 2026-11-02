// The CD Library uses its DEFAULT.PAL for sprite thumbnails, rather than the first alphabetic palette.
import { expect, it, vi } from 'vitest';
const load = vi.hoisted(() => vi.fn());
vi.mock('../src/achievements', () => ({ unlockAchievement: vi.fn(), editedFile: vi.fn() }));
vi.mock('../src/project/files', async (original) => ({ ...(await original<typeof import('../src/project/files')>()), loadHostedGame: load }));
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { libraryThumbSource } from '../src/editor/core/library';
import type { CatalogEntry } from '../src/project/files';

it('uses the Library default even when another palette sorts first', async () => {
  const expected = new Uint8Array(768).fill(3);
  const files = new GameFiles([
    ['b_w.pal', new Uint8Array(768)],
    ['default.pal', expected],
  ]);
  load.mockResolvedValue(files);
  const game: CatalogEntry = { id: 'library', title: 'Library', path: 'library/', kind: 'gameware', gam: null, files: files.names() };
  const source = await libraryThumbSource({ game, name: 'heroine.chr', size: 0 });
  expect(source.palette).toEqual(expected);
});
