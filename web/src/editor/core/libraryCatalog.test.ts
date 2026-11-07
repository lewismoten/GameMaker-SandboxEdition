// Asset sources stay separate, and hidden games never enter the picker.
import { describe, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../../project/files';
vi.mock('../../project/secretGames', () => ({ isOldSecret: (id: string) => id === 'hidden' }));
import { selectLibraryItems } from './libraryCatalog';
const game = (id: string, extra: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id,
  title: id,
  kind: 'gameware',
  path: id,
  gam: null,
  files: ['hero.cbl'],
  ...extra,
});
const catalog = [game('sample'), game('sandbox', { original: {} }), game('lesson', { original: {}, series: 'starter' }), game('hidden', { original: {} })];
describe('asset library sources', () => {
  it('keeps Starters out of the CD and retail sources', () => {
    expect(selectLibraryItems(catalog, 'cbl', 'cd').map((x) => x.game.id)).toEqual(['sample']);
    expect(selectLibraryItems(catalog, 'cbl', 'originals').map((x) => x.game.id)).toEqual(['sandbox']);
    expect(selectLibraryItems(catalog, 'cbl', 'starters').map((x) => x.game.id)).toEqual(['lesson']);
  });
  it('retains per-game copies when a game filter needs every source', () => {
    const shared = [game('sample'), game('second')];
    shared.forEach((g) => {
      g.files = ['same.pal'];
      g.fileFacts = { 'same.pal': { paletteHash: 'identical' } };
    });
    expect(selectLibraryItems(shared, 'pal', 'cd')).toHaveLength(1);
    expect(selectLibraryItems(shared, 'pal', 'cd', false).map((item) => item.game.id)).toEqual(['sample', 'second']);
  });
  it('never lists a secret Starter either', () => {
    expect(selectLibraryItems([game('hidden', { original: {}, series: 'starter' })], 'cbl', 'starters')).toEqual([]);
  });
});
