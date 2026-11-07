// The disk box's dividers: grouping, order, empty groups left out, secret games never counted.
import { describe, expect, it, beforeEach } from 'vitest';
import type { Disk } from '../../retro/dos/disks';
import type { CatalogEntry } from '../../project/files';
import { DISK_GROUPS, diskGroupOf, foldedGroups, groupDisks, saveFolded } from './diskGroups';

const disk = (id: string, kind: Disk['kind'], catalog?: Partial<CatalogEntry>, projectId?: string): Disk =>
  ({
    id,
    kind,
    title: id,
    label: id,
    color: '#000',
    stripe: '#000',
    density: 'HD',
    bytes: 0,
    writeProtected: false,
    catalog,
    projectId,
    load: () => Promise.reject(new Error('unused')),
  }) as Disk;

const imported = new Set(['p2', 'p3']);
const isImported = (id: string) => imported.has(id);

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;
});

describe('disk box dividers', () => {
  it('files each kind of disk under the home page’s collection names', () => {
    expect(diskGroupOf(disk('a', 'project', undefined, 'p1'), isImported)).toBe('mine');
    expect(diskGroupOf(disk('b', 'project', undefined, 'p2'), isImported)).toBe('imported');
    expect(diskGroupOf(disk('blank', 'blank'), isImported)).toBe('mine');
    expect(diskGroupOf(disk('s', 'sample'), isImported)).toBe('starter');
    expect(diskGroupOf(disk('o', 'original', { original: {} }), isImported)).toBe('sandbox');
    expect(diskGroupOf(disk('z', 'original', { original: {}, series: 'bizarre' }), isImported)).toBe('bizarre');
    expect(diskGroupOf(disk('x', 'original', { original: {}, series: 'special' }), isImported)).toBe('special');
    expect(diskGroupOf(disk('r', 'rsd', { kind: 'gameware' }), isImported)).toBe('gameware');
    expect(diskGroupOf(disk('g', 'gameware', { kind: 'gameware' }), isImported)).toBe('gameware');
    expect(diskGroupOf(disk('w', 'gameware', { kind: 'shareware' }), isImported)).toBe('shareware');
  });

  it('puts My games first and Imported in your case, and leaves out groups with no disks', () => {
    const disks = [
      disk('s', 'sample'),
      disk('o', 'original', { original: {} }),
      disk('g', 'gameware', { kind: 'gameware' }),
      disk('b', 'project', undefined, 'p2'),
      disk('c', 'project', undefined, 'p3'),
      disk('a', 'project', undefined, 'p1'),
      disk('blank', 'blank'),
    ];
    const groups = groupDisks(disks, isImported);
    expect(groups.map((g) => g.id)).toEqual(['mine', 'imported', 'sandbox', 'starter', 'gameware']);
    expect(groups[0].indexes).toEqual([5, 6]);
    expect(groups[1].indexes).toEqual([3, 4]);
    expect(DISK_GROUPS[0].id).toBe('mine');
    expect(DISK_GROUPS.find((g) => g.id === 'imported')?.side).toBe('mine');
  });

  it('counts only the disks it is given, so a secret game left off the shelf is never counted or named', () => {
    // loadDisks only lists what the catalog shows (a secret game only once revealed)
    const groups = groupDisks([disk('o', 'original', { original: {} })], isImported);
    expect(groups).toEqual([{ id: 'sandbox', indexes: [0] }]);
    expect(groupDisks([], isImported)).toEqual([]);
  });

  it('remembers folded groups per browser and ignores unknown ones', () => {
    expect(foldedGroups().size).toBe(0);
    saveFolded(new Set(['imported', 'gameware']));
    expect([...foldedGroups()].sort()).toEqual(['gameware', 'imported']);
    localStorage.setItem('gm-disk-box-folded', '["imported","nope"]');
    expect([...foldedGroups()]).toEqual(['imported']);
    saveFolded(new Set());
    expect(localStorage.getItem('gm-disk-box-folded')).toBeNull();
  });
});
