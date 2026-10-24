// The web player's saves: every file a game writes (its .his high scores, game<n>.sav saved
// games, savnames.dat, recordings), kept per game id in this site's IndexedDB
// ("gamemaker-web-player", store "saves", one record { id, files, when } per game). When the
// browser blocks storage the files live in memory for the visit and the page says so.

const DB_NAME = 'gamemaker-web-player';
const STORE = 'saves';

export type SaveFiles = Record<string, Uint8Array>;

interface SaveRecord {
  id: string;
  files: SaveFiles;
  /** Date.now() of the last write. */
  when: number;
}

/** A game's saves, without the bytes, for the list. */
export interface SaveSummary {
  id: string;
  names: string[];
  bytes: number;
  when: number;
}

const memory = new Map<string, SaveRecord>();
let dbPromise: Promise<IDBDatabase | undefined> | undefined;

function db(): Promise<IDBDatabase | undefined> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
      req.onblocked = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
  return dbPromise;
}

/** Whether saves outlast the visit (false when the browser blocks storage). */
export async function savesPersist(): Promise<boolean> {
  return !!(await db());
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const d = await db();
  if (!d) return undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = d.transaction(STORE, mode);
      const req = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB aborted'));
    });
  } catch (e) {
    console.warn('Saves: storage failed', e);
    return undefined;
  }
}

// With storage, IndexedDB alone (so other tabs' writes are seen); without, the memory map.
async function getRecord(id: string): Promise<SaveRecord | undefined> {
  if (!(await db())) return memory.get(id);
  return run<SaveRecord | undefined>('readonly', (s) => s.get(id) as IDBRequest<SaveRecord | undefined>);
}

async function putRecord(rec: SaveRecord): Promise<void> {
  if (!(await db())) memory.set(rec.id, rec);
  else await run('readwrite', (s) => s.put(rec));
}

async function records(): Promise<SaveRecord[]> {
  await queue;
  if (!(await db())) return [...memory.values()];
  return (await run<SaveRecord[]>('readonly', (s) => s.getAll() as IDBRequest<SaveRecord[]>)) ?? [];
}

/** The game's saved files (none yet: {}). */
export async function loadSaves(id: string): Promise<SaveFiles> {
  return { ...((await getRecord(id))?.files ?? {}) };
}

/** Keeps one file the game wrote. Writes one game at a time, in order. */
let queue: Promise<void> = Promise.resolve();
export function writeSave(id: string, name: string, bytes: Uint8Array): Promise<void> {
  queue = queue.then(async () => {
    const rec = (await getRecord(id)) ?? { id, files: {}, when: 0 };
    await putRecord({ id, files: { ...rec.files, [name]: bytes.slice() }, when: Date.now() });
  });
  return queue;
}

/** Puts `files` into the game's saves, each replacing the file of its name. */
export function mergeSaves(id: string, files: SaveFiles): Promise<void> {
  queue = queue.then(async () => {
    const rec = (await getRecord(id)) ?? { id, files: {}, when: 0 };
    await putRecord({ id, files: { ...rec.files, ...files }, when: Date.now() });
  });
  return queue;
}

/** Forgets every save of the game. */
export function deleteSaves(id: string): Promise<void> {
  queue = queue.then(async () => {
    if (!(await db())) memory.delete(id);
    else await run('readwrite', (s) => s.delete(id));
  });
  return queue;
}

/** Every game's saves. */
export async function allSaves(): Promise<Record<string, SaveFiles>> {
  const out: Record<string, SaveFiles> = {};
  for (const rec of await records()) out[rec.id] = { ...rec.files };
  return out;
}

/** What each game has saved, newest first. */
export async function saveSummaries(): Promise<SaveSummary[]> {
  return (await records())
    .filter((r) => Object.keys(r.files).length)
    .map((r) => ({ id: r.id, names: Object.keys(r.files).sort(), bytes: Object.values(r.files).reduce((n, b) => n + b.length, 0), when: r.when }))
    .sort((a, b) => b.when - a.when);
}
