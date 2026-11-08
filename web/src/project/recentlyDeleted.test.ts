// Recently deleted: kept 7 days, restored exactly, emptied, and a secret game's copy kept out of sight.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KEEP_MS,
  bytesOf,
  daysLeft,
  discardDeleted,
  emptyDeleted,
  keepDeleted,
  listDeleted,
  restoreDeleted,
  type DeletedGame,
  type DeletedStore,
} from './recentlyDeleted';
import type { ProjectRecord } from './storage';

// the real secret ids are known only by their hashes: stand-ins for the test
vi.mock('./secretGames', () => ({ isOldSecret: (id: string) => id === 'SECRET', secretVisible: (_id: string, open: number) => (open & 1) !== 0 }));

const DAY = 86_400_000;
const rec = (id: string, size = 10): ProjectRecord => ({
  id,
  name: `Game ${id}`,
  gam: 'A.GAM',
  updated: 123,
  files: { 'A.GAM': new Uint8Array(size) },
  companion: { notes: 'keep me' } as unknown as ProjectRecord['companion'],
});

let map: Map<string, DeletedGame>;
const store: DeletedStore = {
  all: async () => [...map.values()],
  put: async (g) => void map.set(g.id, g),
  remove: async (id) => void map.delete(id),
};
beforeEach(() => (map = new Map()));

describe('recently deleted', () => {
  it('keeps a deleted game with its size and name', async () => {
    await keepDeleted(store, { id: 'a', record: rec('a', 25), imported: false }, 1000);
    const [g] = await listDeleted(store, 0, 2000);
    expect(g).toMatchObject({ id: 'a', name: 'Game a', bytes: 25, deletedAt: 1000 });
    expect(bytesOf(g.record)).toBe(25);
  });

  it('lists the newest first and counts days left', async () => {
    await keepDeleted(store, { id: 'old', record: rec('old'), imported: false }, 0);
    await keepDeleted(store, { id: 'new', record: rec('new'), imported: false }, 2 * DAY);
    const list = await listDeleted(store, 0, 3 * DAY);
    expect(list.map((g) => g.id)).toEqual(['new', 'old']);
    expect(daysLeft(list[1], 3 * DAY)).toBe(4);
    expect(daysLeft(list[0], 3 * DAY)).toBe(6);
  });

  it('lets go of a game after 7 days, on the next list or keep', async () => {
    await keepDeleted(store, { id: 'a', record: rec('a'), imported: false }, 0);
    expect(await listDeleted(store, 0, KEEP_MS - 1)).toHaveLength(1);
    expect(await listDeleted(store, 0, KEEP_MS)).toHaveLength(0);
    expect(map.size).toBe(0);
    await keepDeleted(store, { id: 'b', record: rec('b'), imported: false }, 0);
    await keepDeleted(store, { id: 'c', record: rec('c'), imported: false }, KEEP_MS + 5);
    expect([...map.keys()]).toEqual(['c']);
  });

  it('restores the record exactly, with its companion and saved time, and lets the shelf go of it', async () => {
    const original = rec('a');
    await keepDeleted(store, { id: 'a', record: original, imported: true, origin: 'nebula', batch: 'b1' }, 0);
    let put: DeletedGame | undefined;
    const back = await restoreDeleted(store, 'a', async (g) => void (put = g));
    expect(put?.record).toBe(original);
    expect(put?.record.updated).toBe(123);
    expect(back).toMatchObject({ imported: true, origin: 'nebula', batch: 'b1' });
    expect(map.size).toBe(0);
    expect(await restoreDeleted(store, 'a', async () => {})).toBeUndefined();
  });

  it('keeps a game on the shelf if putting it back fails', async () => {
    await keepDeleted(store, { id: 'a', record: rec('a'), imported: false }, 0);
    await expect(
      restoreDeleted(store, 'a', async () => {
        throw new Error('disk full');
      }),
    ).rejects.toThrow('disk full');
    expect(map.has('a')).toBe(true);
  });

  it('empties now, and discards one', async () => {
    await keepDeleted(store, { id: 'a', record: rec('a'), imported: false }, 0);
    await keepDeleted(store, { id: 'b', record: rec('b'), imported: false }, 0);
    await discardDeleted(store, 'a');
    expect([...map.keys()]).toEqual(['b']);
    await emptyDeleted(store);
    expect(map.size).toBe(0);
  });

  it('never lists a copy of a secret game until what reveals it is open, but still empties it', async () => {
    await keepDeleted(store, { id: 's', record: rec('s'), imported: false, origin: 'SECRET' }, 0);
    await keepDeleted(store, { id: 'n', record: rec('n'), imported: false, origin: 'nebula' }, 0);
    expect((await listDeleted(store, 0, 1000)).map((g) => g.id)).toEqual(['n']);
    expect((await listDeleted(store, 1, 1000)).map((g) => g.id).sort()).toEqual(['n', 's']);
    await emptyDeleted(store);
    expect(map.size).toBe(0);
  });
});
