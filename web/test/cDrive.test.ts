// Tests: the retro PC's C: remembers downloads, deletions and folders across page loads,
// with when each happened (retro/host.ts Downloads, retro/dos/cDriveStore.ts), and the
// PC's 1994-95 clock (retro/dos/vfs.ts deskDate).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Downloads } from '../src/retro/host';
import { migrateOld, type CDriveState, type CDriveStore } from '../src/retro/dos/cDriveStore';
import { deskDate, dirLine, DOS_DATE, file } from '../src/retro/dos/vfs';

/** A store kept in memory, standing in for IndexedDB. */
function memoryStore(start?: CDriveState): CDriveStore & { state?: CDriveState } {
  const m: CDriveStore & { state?: CDriveState } = {
    state: start,
    load: async () => (m.state ? structuredClone(m.state) : undefined),
    save: async (s) => void (m.state = structuredClone(s)),
  };
  return m;
}

const at = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

describe('deskDate', () => {
  it('keeps the month, day and time in the year after the install', () => {
    const d = deskDate(new Date(2026, 9, 21, 21, 53));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([1994, 9, 21, 21, 53]);
    expect(deskDate(new Date(2026, 0, 5, 8, 0)).getFullYear()).toBe(1995);
    expect(deskDate(new Date(2026, 9, 20, 11, 41)).getFullYear()).toBe(1995); // a minute before the install
    expect(deskDate(new Date(2026, 9, 20, 11, 42)).getTime()).toBe(DOS_DATE.getTime());
  });

  it('is what DIR shows', () => {
    expect(dirLine(file('TEDDY.GIF', 37869, { date: deskDate(at(2026, 10, 21, 21, 53)) }))).toBe('TEDDY    GIF        37,869 10-21-94   9:53p');
  });
});

describe('Downloads', () => {
  it('remembers downloads and when they arrived across reloads', async () => {
    const store = memoryStore();
    let now = at(2026, 10, 21, 21, 53);
    const a = new Downloads(store, () => now);
    await a.ready;
    a.setDir('IMAGES', true);
    a.add('TEDDY.GIF');
    now = at(2026, 10, 22, 9, 5);
    a.setDir('IMAGES', true); // already made: keeps its date
    a.add('GWINN.JPG');
    await a.saved();

    const b = new Downloads(store);
    expect(b.has('TEDDY.GIF')).toBe(false); // not loaded yet
    await b.ready;
    expect(b.list()).toEqual(['TEDDY.GIF', 'GWINN.JPG']);
    expect(b.date('TEDDY.GIF')).toEqual(deskDate(at(2026, 10, 21, 21, 53)));
    expect(b.date('GWINN.JPG')).toEqual(deskDate(at(2026, 10, 22, 9, 5)));
    expect(b.dirDate('IMAGES')).toEqual(deskDate(at(2026, 10, 21, 21, 53)));
  });

  it('remembers DEL and RD across reloads', async () => {
    const store = memoryStore({
      ids: [
        ['TEDDY.GIF', 1],
        ['blaster', 2],
      ],
      deleted: [],
      dirs: [['IMAGES', 1]],
    });
    const a = new Downloads(store);
    await a.ready;
    a.remove('TEDDY.GIF');
    a.deleteFile('blaster', 'BLASTER.GAM');
    a.setDir('IMAGES', false);
    await a.saved();

    const b = new Downloads(store);
    await b.ready;
    expect(b.has('TEDDY.GIF')).toBe(false);
    expect(b.isDeleted('blaster', 'BLASTER.GAM')).toBe(true);
    expect(b.hasDir('IMAGES')).toBe(false);
    // downloading again brings the files back, dated anew
    b.add('blaster');
    await b.saved();
    const c = new Downloads(store);
    await c.ready;
    expect(c.isDeleted('blaster', 'BLASTER.GAM')).toBe(false);
  });

  it('keeps a download made before the stored lists arrived', async () => {
    const store = memoryStore({ ids: [['TEDDY.GIF', 1]], deleted: [], dirs: [] });
    const a = new Downloads(store, () => 5);
    a.add('GWINN.JPG');
    await a.saved();
    expect(store.state?.ids).toEqual([
      ['GWINN.JPG', 5],
      ['TEDDY.GIF', 1],
    ]);
  });

  it('works for this visit without storage', async () => {
    const a = new Downloads({ load: () => Promise.reject(new Error('no IndexedDB')), save: () => Promise.reject(new Error('no IndexedDB')) });
    await a.ready;
    a.add('TEDDY.GIF');
    await a.saved();
    expect(a.has('TEDDY.GIF')).toBe(true);
  });
});

describe('migrateOld', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('moves the localStorage lists of earlier versions over, dated now', () => {
    const items: Record<string, string> = { 'gm-bbs-downloads': '["TEDDY.GIF"]', 'gm-dos-dirs': '["IMAGES"]' };
    vi.stubGlobal('localStorage', { getItem: (k: string) => items[k] ?? null });
    expect(migrateOld(7)).toEqual({ ids: [['TEDDY.GIF', 7]], deleted: [], dirs: [['IMAGES', 7]] });
    vi.stubGlobal('localStorage', { getItem: () => null });
    expect(migrateOld(7)).toBeUndefined();
  });
});
