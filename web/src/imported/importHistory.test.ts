// The import history: newest first, the last 20 kept, stored in this browser.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KEEP, clearImportHistory, importHistory, recordImport, recordText, withRecord, type ImportRecord } from './importHistory';

const rec = (n: number, extra: Partial<ImportRecord> = {}): ImportRecord => ({ at: n, source: `s${n}`, added: n, skipped: 0, failed: [], ...extra });

describe('import history', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
    });
  });

  it('puts the newest first and keeps the last 20', () => {
    let list: ImportRecord[] = [];
    for (let i = 1; i <= KEEP + 5; i++) list = withRecord(list, rec(i));
    expect(list).toHaveLength(KEEP);
    expect(list[0].at).toBe(KEEP + 5);
    expect(list[KEEP - 1].at).toBe(6);
  });

  it('is kept between reads and cleared on request', () => {
    expect(importHistory()).toEqual([]);
    recordImport(rec(1));
    recordImport(rec(2, { failed: ['X.GAM: damaged'] }));
    expect(importHistory().map((r) => r.at)).toEqual([2, 1]);
    clearImportHistory();
    expect(importHistory()).toEqual([]);
  });

  it('reads damaged storage as empty', () => {
    store.set('gm-import-history', '{not json');
    expect(importHistory()).toEqual([]);
    store.set('gm-import-history', '{"a":1}');
    expect(importHistory()).toEqual([]);
  });

  it('words a record', () => {
    expect(recordText(rec(1))).toBe('Imported 1 game');
    expect(recordText(rec(3, { skipped: 2, failed: ['a'] }))).toBe('Imported 3 games, 2 already held and left out, 1 failed');
    expect(recordText(rec(0, { canceled: true }))).toBe('Canceled: imported 0 games');
  });
});
