// Where the home page's deeper search keeps what it read: one IndexedDB record per game and
// version, in a database of its own (the projects' database is untouched). Every call resolves
// even where storage is blocked: a read finds nothing, a write is dropped.
import type { DeepPart } from './deepExtract';
import type { DeepStore } from './deepIndex';

const DB = 'gamemaker-deep-search';
const STORE = 'index';

let opened: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  opened ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  opened.catch(() => (opened = undefined));
  return opened;
}

export const idbDeepStore: DeepStore = {
  async get(key) {
    try {
      const db = await open();
      return await new Promise<DeepPart[] | undefined>((resolve) => {
        const r = db.transaction(STORE).objectStore(STORE).get(key);
        r.onsuccess = () => resolve(Array.isArray(r.result) ? (r.result as DeepPart[]) : undefined);
        r.onerror = () => resolve(undefined);
      });
    } catch {
      return undefined;
    }
  },
  async put(key, parts) {
    try {
      const db = await open();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(parts, key);
        tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
      });
    } catch {
      /* not kept */
    }
  },
};
