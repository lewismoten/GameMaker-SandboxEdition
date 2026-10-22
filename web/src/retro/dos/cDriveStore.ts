// What the retro PC's hard disk (C:) gained and lost since Game-Maker was installed: the
// BBS's downloads (shareware ids and picture names) with when each arrived, the files DEL
// took out of them, and folders made on C: (C:\IMAGES). Kept in this browser's IndexedDB
// (database "gamemaker-desk"), so it survives reloading the page. Your game folders in
// C:\GM are projects, kept by project/storage.ts.

export interface CDriveState {
  /** Downloaded shareware ids and picture names, with Date.now() of the download. */
  ids: [string, number][];
  /** Files DEL took out of a download's folder ("id/NAME"). */
  deleted: string[];
  /** Folders made on C: ("IMAGES"), with when they were made. */
  dirs: [string, number][];
}

export interface CDriveStore {
  load(): Promise<CDriveState | undefined>;
  save(state: CDriveState): Promise<void>;
}

const DB_NAME = 'gamemaker-desk';
const STORE = 'cdrive';
const KEY = 'C';

let dbPromise: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function request<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

// Earlier versions kept the lists in localStorage, without dates.
const OLD_KEYS = { ids: 'gm-bbs-downloads', deleted: 'gm-bbs-deleted', dirs: 'gm-dos-dirs' };

function oldList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** The localStorage lists of earlier versions as a state (dated `when`), or undefined if none. */
export function migrateOld(when = Date.now()): CDriveState | undefined {
  const ids = oldList(OLD_KEYS.ids);
  const deleted = oldList(OLD_KEYS.deleted);
  const dirs = oldList(OLD_KEYS.dirs);
  if (!ids.length && !deleted.length && !dirs.length) return undefined;
  return { ids: ids.map((i) => [i, when]), deleted, dirs: dirs.map((d) => [d, when]) };
}

function forgetOld(): void {
  try {
    for (const k of Object.values(OLD_KEYS)) localStorage.removeItem(k);
  } catch {
    /* private mode */
  }
}

/** C: in IndexedDB (moving earlier localStorage lists over on first use). */
export const idbCDrive: CDriveStore = {
  async load() {
    const s = await request<CDriveState | undefined>('readonly', (st) => st.get(KEY));
    if (s) return s;
    const old = migrateOld();
    if (old) {
      await this.save(old);
      forgetOld();
    }
    return old;
  },
  async save(state) {
    await request('readwrite', (st) => st.put(state, KEY));
  },
};
