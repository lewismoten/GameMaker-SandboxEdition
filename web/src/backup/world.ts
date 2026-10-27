// Everything a backup can hold, read from this browser at once as plain data (the World): every
// gm-* localStorage key and every record of the IndexedDB stores in inventory.ts. Sections read
// their parts from it and an import changes a copy of it; writeWorld then stores only what
// differs, so a part no section touched is never written. The stores are opened as their owners
// open them (same name, version and upgrade), and only read when the database already exists.
import { same } from './codec';
import { STORES, type StoreId, type StoreSpec } from './inventory';

export interface World {
  /** Every localStorage key starting "gm-". */
  local: Record<string, string>;
  /** Each store's records by key (all keys here are strings). */
  stores: Record<StoreId, Record<string, unknown>>;
}

export const emptyWorld = (): World => ({ local: {}, stores: { projects: {}, saves: {}, saveBackups: {}, desk: {} } });

/** A copy deep enough to change: maps and records copied, bytes shared (never changed in place). */
export function copyWorld(w: World): World {
  const c = emptyWorld();
  c.local = { ...w.local };
  for (const id of Object.keys(STORES) as StoreId[]) {
    for (const [k, v] of Object.entries(w.stores[id])) c.stores[id][k] = v && typeof v === 'object' && !(v instanceof Uint8Array) ? { ...v } : v;
  }
  return c;
}

/** The saves store's record of one save id: file name -> bytes. */
export const savesOf = (w: World, id: string): Record<string, Uint8Array> => (w.stores.saves[id] as Record<string, Uint8Array> | undefined) ?? {};

// ------------------------------------------------------------------ the browser's storage

async function exists(name: string): Promise<boolean> {
  try {
    const list = await indexedDB.databases?.();
    return list ? list.some((d) => d.name === name) : true;
  } catch {
    return true;
  }
}

const opened = new Map<string, Promise<IDBDatabase>>();

function open(spec: StoreSpec): Promise<IDBDatabase> {
  let p = opened.get(spec.db);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const req = indexedDB.open(spec.db, spec.version);
      req.onupgradeneeded = () => {
        for (const s of Object.values(STORES) as StoreSpec[]) {
          if (s.db !== spec.db || req.result.objectStoreNames.contains(s.store)) continue;
          const store = req.result.createObjectStore(s.store, s.keyPath ? { keyPath: s.keyPath } : undefined);
          if (s.index) store.createIndex(s.index.name, s.index.keyPath);
        }
      };
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          opened.delete(spec.db);
        };
        resolve(req.result);
      };
      req.onerror = () => {
        opened.delete(spec.db);
        reject(req.error ?? new Error(`Could not open ${spec.db}`));
      };
    });
    opened.set(spec.db, p);
  }
  return p;
}

async function readStore(spec: StoreSpec): Promise<Record<string, unknown>> {
  if (!(await exists(spec.db))) return {};
  const d = await open(spec);
  if (!d.objectStoreNames.contains(spec.store)) return {};
  return new Promise((resolve, reject) => {
    const out: Record<string, unknown> = {};
    const tx = d.transaction(spec.store, 'readonly');
    const req = tx.objectStore(spec.store).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (!c) return;
      out[c.key as string] = c.value;
      c.continue();
    };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error ?? new Error(`Could not read ${spec.store}`));
  });
}

async function writeStore(spec: StoreSpec, puts: [string, unknown][], deletes: string[]): Promise<void> {
  if (!puts.length && !deletes.length) return;
  const d = await open(spec);
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(spec.store, 'readwrite');
    const s = tx.objectStore(spec.store);
    for (const k of deletes) s.delete(k);
    for (const [k, v] of puts) {
      if (spec.keyPath) s.put(v);
      else s.put(v, k);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`Could not write ${spec.store}`));
    tx.onabort = () => reject(tx.error ?? new Error(`Could not write ${spec.store}`));
  });
}

/** Reads everything from this browser. */
export async function readWorld(storage: Storage = localStorage): Promise<World> {
  const w = emptyWorld();
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k?.startsWith('gm-')) w.local[k] = storage.getItem(k) ?? '';
  }
  for (const id of Object.keys(STORES) as StoreId[]) w.stores[id] = await readStore(STORES[id]);
  return w;
}

/** What differs between two worlds: localStorage keys to set and remove, and each store's puts and deletes. */
export function worldDiff(before: World, after: World) {
  const set = Object.entries(after.local).filter(([k, v]) => before.local[k] !== v);
  const remove = Object.keys(before.local).filter((k) => !(k in after.local));
  const stores = (Object.keys(STORES) as StoreId[]).map((id) => {
    const a = before.stores[id];
    const b = after.stores[id];
    const puts = Object.entries(b).filter(([k, v]) => !(k in a) || !same(a[k], v));
    const deletes = Object.keys(a).filter((k) => !(k in b));
    return { id, puts, deletes };
  });
  return { set, remove, stores };
}

/** Stores `after` where it differs from `before` (what readWorld gave). */
export async function writeWorld(before: World, after: World, storage: Storage = localStorage): Promise<void> {
  const d = worldDiff(before, after);
  for (const s of d.stores) await writeStore(STORES[s.id], s.puts, s.deletes);
  for (const [k, v] of d.set) storage.setItem(k, v);
  for (const k of d.remove) storage.removeItem(k);
}
