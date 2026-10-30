// Source order and palette identity must not depend on the order the catalog happens to arrive.
import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/achievements', () => ({ unlockAchievement: vi.fn(), editedFile: vi.fn() }));
import { selectLibraryItems } from '../src/editor/core/libraryCatalog';
import type { CatalogEntry } from '../src/project/files';
import { RSD_COMPANY } from '../src/export/downloadable';
const game = (id: string, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id,
  title: id,
  path: `${id}/`,
  gam: null,
  kind: 'gameware',
  files: ['one.pal'],
  sizes: [768],
  ...extra,
});
const palette = (id: string, hash: string, extra: Partial<CatalogEntry> = {}) => game(id, { fileFacts: { 'one.pal': { paletteHash: hash } }, ...extra });

describe('library catalog selection', () => {
  it('puts DEFAULT.PAL first, then Library, Sample, RSD, Gameware and Shareware', () => {
    const catalog = [
      game('a-shareware', { kind: 'shareware' }),
      game('b-gameware'),
      game('c-rsd', { company: RSD_COMPANY }),
      game('sample'),
      game('library', { files: ['z.pal', 'default.pal'], sizes: [768, 768] }),
    ];
    expect(selectLibraryItems(catalog, 'pal', 'cd').map((i) => `${i.game.id}/${i.name}`)).toEqual([
      'library/default.pal',
      'library/z.pal',
      'sample/one.pal',
      'c-rsd/one.pal',
      'b-gameware/one.pal',
      'a-shareware/one.pal',
    ]);
  });

  it('consolidates identical palettes, preferring a Library source and then Gameware', () => {
    const catalog = [
      palette('other', 'same', { kind: 'shareware' }),
      palette('sample', 'same'),
      palette('library', 'same'),
      palette('rsd-shareware', 'second', { kind: 'shareware', company: RSD_COMPANY }),
      palette('b-gameware', 'second'),
      palette('a-gameware', 'second'),
    ];
    expect(selectLibraryItems(catalog, 'pal', 'cd').map((i) => i.game.id)).toEqual(['library', 'a-gameware']);
  });

  it('keeps original-game assets separate and exposes precomputed sound groups', () => {
    const original = {} as NonNullable<CatalogEntry['original']>;
    const catalog = [
      game('cd', { files: ['click.voc'] }),
      game('own', { original, files: ['voice.voc'], fileFacts: { 'voice.voc': { soundGroup: 'voice' } } }),
    ];
    expect(selectLibraryItems(catalog, 'voc', 'cd').map((i) => i.game.id)).toEqual(['cd']);
    expect(selectLibraryItems(catalog, 'voc', 'originals').map((i) => [i.game.id, i.group])).toEqual([['own', 'voice']]);
  });
});
