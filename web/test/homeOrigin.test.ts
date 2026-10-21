import { describe, expect, it } from 'vitest';
import { findOriginal, splitInherited } from '../src/editor/shell/homeOrigin';
import type { Issue } from '../src/project/health';
import type { CatalogEntry } from '../src/project/files';

const issue = (message: string, kind: Issue['kind'] = 'missing'): Issue => ({ severity: 'error', kind, message });

describe('splitInherited', () => {
  it('leaves out what the original already had, once per time it had it', () => {
    const original = [issue('NEBULA.CMF is missing'), issue('X.BKD is missing')];
    const mine = [issue('nebula.cmf is missing'), issue('MINE.MON is missing'), issue('X.BKD is missing'), issue('X.BKD is missing')];
    const { own, inherited } = splitInherited(mine, original);
    expect(inherited.map((i) => i.message)).toEqual(['nebula.cmf is missing', 'X.BKD is missing']);
    expect(own.map((i) => i.message)).toEqual(['MINE.MON is missing', 'X.BKD is missing']);
  });

  it('tells kinds apart', () => {
    expect(splitInherited([issue('a', 'link')], [issue('a', 'missing')]).own).toHaveLength(1);
  });
});

describe('findOriginal', () => {
  const entry = (id: string, gam: string | null, kind?: string) => ({ id, gam, kind, title: id, files: [] }) as unknown as CatalogEntry;
  const catalog = [entry('nebula', 'NEBULA.GAM'), entry('other', 'GAME.GAM'), entry('again', 'GAME.GAM'), entry('sw', 'SW.GAM', 'shareware')];

  it('matches a copy by its .gam name when that name is the only one', () => {
    expect(findOriginal({ id: 'p1', gam: 'nebula.gam' }, catalog)?.id).toBe('nebula');
    expect(findOriginal({ id: 'p2', gam: 'GAME.GAM' }, catalog)).toBeUndefined();
    expect(findOriginal({ id: 'p3', gam: 'SW.GAM' }, catalog)).toBeUndefined();
  });
});

describe('copyName', async () => {
  const { copyName } = await import('../src/editor/shell/homeProjectActions');
  it('names a duplicate that no game has yet', () => {
    expect(copyName('Nebula', ['Nebula'])).toBe('Nebula copy');
    expect(copyName('Nebula', ['Nebula', 'nebula copy'])).toBe('Nebula copy 2');
    expect(copyName('Nebula copy 2', ['Nebula', 'Nebula copy', 'Nebula copy 2'])).toBe('Nebula copy 3');
  });
});
