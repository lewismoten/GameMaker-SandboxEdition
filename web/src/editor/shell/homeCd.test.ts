// The CD tab (Gameware, then Shareware): its games, the old Gameware/Shareware addresses and deep links
// landing on it, and an imported shareware zip still matching its catalog entry (so its walkthrough
// and demo, found by the entry's id, are still offered).
import { describe, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../../project/files';
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
const gam = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
const entry = (id: string, kind: 'gameware' | 'shareware', extra: Partial<CatalogEntry> = {}): CatalogEntry =>
  ({ id, title: id.toUpperCase(), kind, path: id, gam: `${id}.gam`, files: [], ...extra }) as CatalogEntry;
const catalog = [entry('free1', 'gameware'), entry('share1', 'shareware', { gamCrc: crc32(gam) }), entry('share2', 'shareware', { gamCrc: 12345 })];

vi.mock('../../project/files', async (orig) => ({ ...(await orig<typeof import('../../project/files')>()), loadCatalog: async () => catalog }));

const { sharewareMatch } = await import('./homeImport');
const { homeLibrary, categoryOf } = await import('./homeLibrary');
const { CATEGORIES, oldCategory } = await import('./homeCategories');

describe('the CD tab', () => {
  it('replaces the Gameware and Shareware tabs', () => {
    expect(CATEGORIES.map((c) => c.id)).toContain('cd');
    expect(CATEGORIES.map((c) => c.id)).not.toContain('gameware');
    expect(CATEGORIES.map((c) => c.id)).not.toContain('shareware');
  });

  it('takes old tab addresses', () => {
    expect(oldCategory('gameware')).toBe('cd');
    expect(oldCategory('shareware')).toBe('cd');
    expect(oldCategory('sandbox')).toBe('sandbox');
    expect(oldCategory(undefined)).toBeUndefined();
  });

  it('lists Gameware then Shareware, and a game link (cd:<id>) finds each one on it', () => {
    const lib = homeLibrary();
    lib.catalog = catalog;
    expect(lib.gamesOf('cd').map((g) => g.kind)).toEqual(['gameware', 'shareware', 'shareware']);
    for (const e of catalog) {
      const g = lib.findGame(`cd:${e.id}`);
      expect(g?.entry).toBe(e);
      expect(categoryOf(g!)).toBe('cd');
    }
  });
});

describe('importing a CD shareware game', () => {
  const files = (bytes: Uint8Array) => ({ byExtension: () => ['SHARE1.GAM'], get: () => bytes }) as never;

  it('still matches its catalog entry, which is what its walkthrough and demo are found by', async () => {
    const hit = await sharewareMatch(files(gam));
    expect(hit?.id).toBe('share1');
  });

  it('matches nothing for other files', async () => {
    expect(await sharewareMatch(files(new Uint8Array([9, 9])))).toBeUndefined();
  });
});
