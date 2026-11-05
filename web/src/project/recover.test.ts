// A damaged stored project opens with every intact file and a plain list of what is broken.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { recoverRecord } from './recover';
import { loadProject } from './storage';
import { serializeCompanion, emptyCompanion } from './companion';

const gam = serializeGame(newGame('Test'));
const good = (extra: Record<string, unknown> = {}) => ({
  id: 'a',
  name: 'Test',
  gam: 'game.gam',
  updated: 5,
  files: { 'game.gam': gam, 'x.gif': new Uint8Array([1, 2, 3]) },
  ...extra,
});

describe('recoverRecord', () => {
  it('reports nothing for an intact project', () => {
    const r = recoverRecord('a', good());
    expect(r.damage).toEqual([]);
    expect(r.files.names().sort()).toEqual(['game.gam', 'x.gif']);
  });
  it('sets aside a cut-short .gam and says so', () => {
    const r = recoverRecord('a', good({ files: { 'game.gam': gam.slice(0, 10), 'x.gif': new Uint8Array([1]) } }));
    expect(r.files.names()).toEqual(['x.gif']);
    expect(r.damage[0]).toMatchObject({ kind: 'file', file: 'game.gam' });
    expect(r.damage[0].message).toMatch(/cut short/);
  });
  it('leaves out a file stored as the wrong type and keeps the rest', () => {
    const r = recoverRecord('a', good({ files: { 'game.gam': gam, 'bad.gif': 'oops', 'n.pal': 42 } }));
    expect(r.files.names()).toEqual(['game.gam']);
    expect(r.damage.map((d) => d.file).sort()).toEqual(['bad.gif', 'n.pal']);
  });
  it('replaces a garbled companion with nothing and names it', () => {
    for (const bad of ['text', 7, { format: 'other' }, { files: [] }]) {
      const r = recoverRecord('a', good({ companion: bad }));
      expect(r.record.companion).toBeUndefined();
      expect(r.damage).toHaveLength(1);
      expect(r.damage[0].kind).toBe('companion');
    }
    const ok = recoverRecord('a', good({ companion: JSON.parse(new TextDecoder().decode(serializeCompanion(emptyCompanion()))) }));
    expect(ok.damage).toEqual([]);
  });
  it('names a missing main .gam', () => {
    const r = recoverRecord('a', good({ files: { 'x.gif': new Uint8Array([1]) } }));
    expect(r.damage[0]).toMatchObject({ kind: 'missing', file: 'game.gam' });
    expect(recoverRecord('a', 5).damage[0].kind).toBe('record');
  });
  it('opens a record with no files list as empty', () => {
    const r = recoverRecord('a', { name: 'N', gam: 'g.gam', updated: 1 });
    expect(r.files.names()).toEqual([]);
    expect(r.damage.some((d) => d.kind === 'record')).toBe(true);
  });
});

// a small stand-in for IndexedDB: one store, requests that answer on a later tick
function fakeIdb(rows: Map<string, unknown>) {
  const req = <T>(run: () => T) => {
    const r: { result?: T; onsuccess?: () => void } = {};
    setTimeout(() => ((r.result = run()), r.onsuccess?.()), 0);
    return r;
  };
  const store = {
    get: (k: string) => req(() => rows.get(k)),
    put: (v: { id: string }) => req(() => (rows.set(v.id, v), v.id)),
  };
  const db = { transaction: () => ({ objectStore: () => store }) };
  return {
    open: () => {
      const r: { result: unknown; onsuccess?: () => void } = { result: db };
      setTimeout(() => r.onsuccess?.(), 0);
      return r;
    },
  };
}

describe('loadProject with damage', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('keeps the damaged record whole under a second id and does not overwrite it', async () => {
    vi.useFakeTimers();
    const rows = new Map<string, unknown>([['a', good({ files: { 'game.gam': gam, 'bad.gif': 'oops' } })]]);
    vi.stubGlobal('indexedDB', fakeIdb(rows));
    const p = loadProject('a', { keepCopy: true });
    await vi.runAllTimersAsync();
    const r = (await p)!;
    expect(r.damage).toHaveLength(1);
    expect(r.files.names()).toEqual(['game.gam']);
    expect(rows.get('a~damaged')).toMatchObject({ id: 'a~damaged', name: 'Test (damaged copy)', files: { 'bad.gif': 'oops' } });
    const again = loadProject('a', { keepCopy: true });
    await vi.runAllTimersAsync();
    await again;
    vi.useRealTimers();
  });
});
