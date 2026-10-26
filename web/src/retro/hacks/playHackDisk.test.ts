// PLAYHACK's "Disk in A:" line: what choosing it does for each kind of disk.
import { describe, expect, it } from 'vitest';
import { diskChoice, diskLine, earlierCopy } from './playHackDisk';

describe('diskChoice', () => {
  it('patches a disk of yours as it is', () => {
    expect(diskChoice({ kind: 'project', gam: 'my.gam', writeProtected: false, projectId: 'p1' })).toBe('mine');
  });
  it('patches a copy on C: for an original game disk', () => {
    expect(diskChoice({ kind: 'original', gam: 'snow.gam', writeProtected: true })).toBe('protected');
    expect(diskChoice({ kind: 'rsd', gam: 'peach.gam', writeProtected: true })).toBe('protected');
  });
  it('has nothing to patch on a blank disk or one with no game', () => {
    expect(diskChoice({ kind: 'blank', writeProtected: false })).toBe('empty');
    expect(diskChoice({ kind: 'gameware', writeProtected: true })).toBe('empty');
  });
});

describe('diskLine', () => {
  it('names the game, or says the disk is blank', () => {
    expect(diskLine({ kind: 'original', title: '  Snowbound  ' })).toBe('Disk in A: Snowbound');
    expect(diskLine({ kind: 'blank', title: 'Blank disk' })).toBe('Disk in A: blank disk');
  });
});

describe('earlierCopy', () => {
  const origins: Record<string, string> = { a: 'snowbound', b: 'teddy', 'hd-snowbound': 'snowbound' };
  const origin = (id: string) => origins[id];
  it('finds your copy of the disk’s game', () => {
    expect(earlierCopy([{ id: 'b' }, { id: 'a' }], 'snowbound', origin)?.id).toBe('a');
  });
  it('skips installed folders and finds nothing without a catalog game', () => {
    expect(earlierCopy([{ id: 'hd-snowbound' }], 'snowbound', origin)).toBeUndefined();
    expect(earlierCopy([{ id: 'a' }], undefined, origin)).toBeUndefined();
  });
});
