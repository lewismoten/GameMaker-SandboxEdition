// Recently deleted: a game deleted from the home page is kept for 7 days (its whole record: files,
// companion and checkpoints), so it can be brought back exactly as it was or emptied for good.
// Kept in an IndexedDB database of its own ("gamemaker-recently-deleted", store "deleted"), not in
// "gamemaker-web", like the save backups (project/saveData/backups.ts): no version change to wait on.
// A copy of a secret game is kept too, but is listed only while what reveals that game is open
// (project/secretGames.ts), and is counted and emptied silently otherwise. No DOM.
import type { ProjectRecord } from './storage';
import { isOldSecret, secretVisible } from './secretGames';

export const KEEP_MS = 7 * 24 * 3600 * 1000;

export interface DeletedGame {
  /** The project's id, which it comes back under. */
  id: string;
  name: string;
  /** Date.now() when deleted. */
  deletedAt: number;
  /** The size of its files. */
  bytes: number;
  /** The whole record as stored (files, companion, checkpoints, its last-saved time). */
  record: ProjectRecord;
  /** The catalog game it began as a copy of, and whether it was listed under Imported, and its import's batch. */
  origin?: string;
  imported: boolean;
  batch?: string;
}

/** Where deleted games are kept (IndexedDB here; a Map in the tests). */
export interface DeletedStore {
  all(): Promise<DeletedGame[]>;
  put(g: DeletedGame): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Days left before it is emptied (at least 1 while it is still kept). */
export function daysLeft(g: DeletedGame, now = Date.now()): number {
  return Math.max(1, Math.ceil((g.deletedAt + KEEP_MS - now) / 86_400_000));
}

const expired = (g: DeletedGame, now: number) => now - g.deletedAt >= KEEP_MS;

/** The game's size: its files together. */
export const bytesOf = (record: Pick<ProjectRecord, 'files'>): number => Object.values(record.files ?? {}).reduce((sum, b) => sum + b.length, 0);

/** Empties the ones kept 7 days. */
async function purge(store: DeletedStore, now: number): Promise<DeletedGame[]> {
  const kept: DeletedGame[] = [];
  for (const g of await store.all()) {
    if (expired(g, now)) await store.remove(g.id);
    else kept.push(g);
  }
  return kept;
}

/** Keeps a deleted game (and empties the ones whose week is up). */
export async function keepDeleted(store: DeletedStore, g: Omit<DeletedGame, 'bytes' | 'deletedAt' | 'name'>, now = Date.now()): Promise<void> {
  await store.put({ ...g, name: g.record.name, deletedAt: now, bytes: bytesOf(g.record) });
  await purge(store, now);
}

/**
 * The games to list, newest first: a copy of a secret game only while `open` (the gates of
 * secretGames.ts that are open) shows it.
 */
export async function listDeleted(store: DeletedStore, open: number, now = Date.now()): Promise<DeletedGame[]> {
  const shown = (g: DeletedGame) => !g.origin || !isOldSecret(g.origin) || secretVisible(g.origin, open);
  return (await purge(store, now)).filter(shown).sort((a, b) => b.deletedAt - a.deletedAt);
}

/** Forgets a game without restoring it (it was brought back another way). */
export const discardDeleted = (store: DeletedStore, id: string): Promise<void> => store.remove(id);

/** Brings a game back: `put` writes its record as it was; the shelf then lets it go. Undefined when it isn't kept. */
export async function restoreDeleted(store: DeletedStore, id: string, put: (g: DeletedGame) => Promise<void>): Promise<DeletedGame | undefined> {
  const g = (await store.all()).find((x) => x.id === id);
  if (!g) return undefined;
  await put(g);
  await store.remove(id);
  return g;
}

/** Empties the whole shelf now, the hidden ones too. */
export async function emptyDeleted(store: DeletedStore): Promise<void> {
  for (const g of await store.all()) await store.remove(g.id);
}

const DB_NAME = 'gamemaker-recently-deleted';
const STORE = 'deleted';
let dbPromise: Promise<IDBDatabase> | undefined;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => void req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = undefined;
      reject(req.error);
    };
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, go: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(STORE, mode);
        const req = go(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = tx.onabort = () => reject(tx.error ?? req.error);
      }),
  );
}

/** The browser's own shelf. */
export const browserShelf: DeletedStore = {
  all: () => run<DeletedGame[]>('readonly', (s) => s.getAll()).then((l) => l.filter((g) => g && typeof g.id === 'string' && g.record)),
  put: (g) => run('readwrite', (s) => s.put(g)).then(() => undefined),
  remove: (id) => run('readwrite', (s) => s.delete(id)).then(() => undefined),
};
