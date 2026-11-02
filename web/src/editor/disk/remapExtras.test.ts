import { describe, expect, it } from 'vitest';
import { remapExtras, restoreExtras, snapshotExtras } from './remapExtras';

const store = (init: Record<string, Record<string, unknown>> = {}) => {
  const d: Record<string, Record<string, unknown>> = structuredClone(init);
  return {
    d,
    extras: <T>(f: string, s: string, fb: T) => (d[f]?.[s] as T) ?? fb,
    setExtras: (f: string, s: string, v: unknown) => {
      d[f] ??= {};
      if (v === undefined) delete d[f][s];
      else d[f][s] = v;
    },
  };
};

describe('remapExtras', () => {
  it('keeps the kept block name and drops the folded one inside a set', () => {
    const s = store({ 'a.bbl': { blockNames: { 3: 'wall', 7: 'wall copy', 9: 'door' } } });
    remapExtras(s, [
      {
        file: 'a.bbl',
        into: 'a.bbl',
        at: new Map([
          [7, 3],
          [9, 4],
        ]),
      },
    ]);
    expect(s.d['a.bbl'].blockNames).toEqual({ 3: 'wall', 4: 'door' });
  });

  it('moves names and groups of a dropped file into the kept file', () => {
    const s = store({
      'k.mbl': { blockNames: { 1: 'ghost' }, groups: [{ name: 'g', cols: 1, rows: 1, cells: [1] }] },
      'd.mbl': { blockNames: { 2: 'bat', 5: 'unused' }, groups: [{ name: 'wing', cols: 2, rows: 1, cells: [2, 3] }] },
    });
    const r = remapExtras(s, [{ file: 'd.mbl', into: 'k.mbl', at: new Map([[2, 10]]) }]);
    expect(s.d['k.mbl'].blockNames).toEqual({ 1: 'ghost', 10: 'bat' });
    expect(s.d['d.mbl'].blockNames).toBeUndefined();
    expect((s.d['k.mbl'].groups as { cells: number[] }[]).map((g) => g.cells)).toEqual([[1], [10, -1]]);
    expect(s.d['d.mbl'].groups).toBeUndefined();
    expect(r.groups).toBe(1);
  });

  it('puts them back from a snapshot', () => {
    const s = store({ 'a.bbl': { blockNames: { 7: 'x' } } });
    const snap = snapshotExtras(s, ['a.bbl']);
    remapExtras(s, [{ file: 'a.bbl', into: 'a.bbl', at: new Map([[7, 1]]) }]);
    expect(s.d['a.bbl'].blockNames).toEqual({ 1: 'x' });
    restoreExtras(s, snap);
    expect(s.d['a.bbl'].blockNames).toEqual({ 7: 'x' });
  });
});

describe('remapExtras brushes', () => {
  it('renumbers terrains, stamps and buildings, and moves a dropped set’s brushes to the kept set', () => {
    const s = store({
      'a.bbl': {
        terrains: [{ id: 't', tiles: [7, 9, -1], outside: 7 }],
        stamps: [{ id: 's', cells: [7, -1, 12] }],
        buildings: [{ id: 'b', parts: { roof: 9, wall: 2 } }],
      },
    });
    remapExtras(s, [
      {
        file: 'a.bbl',
        into: 'a.bbl',
        at: new Map([
          [7, 3],
          [9, 4],
        ]),
      },
    ]);
    expect(s.d['a.bbl'].terrains).toEqual([{ id: 't', tiles: [3, 4, -1], outside: 3 }]);
    expect(s.d['a.bbl'].stamps).toEqual([{ id: 's', cells: [3, -1, 12] }]);
    expect(s.d['a.bbl'].buildings).toEqual([{ id: 'b', parts: { roof: 4, wall: 2 } }]);
    const j = store({ 'k.bbl': { stamps: [{ id: 'x', cells: [1] }] }, 'd.bbl': { stamps: [{ id: 'y', cells: [5, 6] }] } });
    remapExtras(j, [{ file: 'd.bbl', into: 'k.bbl', at: new Map([[5, 40]]) }]);
    expect(j.d['k.bbl'].stamps).toEqual([
      { id: 'x', cells: [1] },
      { id: 'y', cells: [40, -1] },
    ]);
    expect(j.d['d.bbl'].stamps).toBeUndefined();
  });
});
