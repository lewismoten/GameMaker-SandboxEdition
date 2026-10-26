// PLAYHACK's kinds: imported games, copies of each catalog tab, and the rest as Mine.
import { beforeEach, describe, expect, it } from 'vitest';
import { hackGroupOf } from './playHackGroups';
import { rememberOrigin, setImported } from '../../editor/shell/homeOrigin';
import type { CatalogEntry } from '../../project/files';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;
});

const catalog = [
  { id: 'cd:peach', kind: 'gameware' },
  { id: 'cd:glub', kind: 'shareware' },
  { id: 'snowbound', kind: 'gameware', original: { manual: true } },
  { id: 'loaf', kind: 'gameware', original: { manual: true }, series: 'bizarre' },
] as unknown as CatalogEntry[];

describe('hackGroupOf', () => {
  it('sorts by where a game came from', () => {
    setImported('p1', true);
    rememberOrigin('p2', 'cd:peach');
    rememberOrigin('p3', 'cd:glub');
    rememberOrigin('p4', 'snowbound');
    rememberOrigin('p5', 'loaf');
    expect(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id) => hackGroupOf(id, catalog))).toEqual([
      'imported',
      'gameware',
      'shareware',
      'sandbox',
      'bizarre',
      'mine',
    ]);
  });
  it('counts an import as imported even when it matches a catalog game', () => {
    setImported('p1', true);
    rememberOrigin('p1', 'snowbound');
    expect(hackGroupOf('p1', catalog)).toBe('imported');
  });
});
