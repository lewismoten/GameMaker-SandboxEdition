// IndexedDB persistence: editor projects (whole game directories) and per-game
// "save data" overlays (high scores, saved games, recordings written while playing).
// This stands in for the DOS disk the original Game-Maker read and wrote; it is not a port.
//
// Database "gamemaker-web", version 1, two object stores:
//   projects: ProjectRecord rows keyed by their `id`.
//   saves: one object per game id mapping file name -> bytes (out-of-line keys).
import { GameFiles } from './files';

const DB_NAME = 'gamemaker-web';
const DB_VERSION = 1;
const PROJECTS = 'projects';
const SAVES = 'saves';

export interface ProjectRecord {
  id: string;
  name: string;
  /** File name of the project's main .gam file within `files`. */
  gam: string;
  /** Date.now() of the last save; the project list is sorted newest first. */
  updated: number;
  /** The whole game directory: file name -> contents. */
  files: Record<string, Uint8Array>;
}

let dbPromise: Promise<IDBDatabase> | undefined;

// Opens the database once and shares the connection; a first open creates the stores.
function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(PROJECTS)) d.createObjectStore(PROJECTS, { keyPath: 'id' });
      if (!d.objectStoreNames.contains(SAVES)) d.createObjectStore(SAVES);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function request<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(store, mode);
        const req = run(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Project summaries without their files. getAll() still loads the files, then drops them. */
export async function listProjects(): Promise<Omit<ProjectRecord, 'files'>[]> {
  const all = await request<ProjectRecord[]>(PROJECTS, 'readonly', (s) => s.getAll());
  return all.map(({ files: _files, ...rest }) => rest).sort((a, b) => b.updated - a.updated);
}

export async function loadProject(id: string): Promise<{ record: ProjectRecord; files: GameFiles } | undefined> {
  const record = await request<ProjectRecord | undefined>(PROJECTS, 'readonly', (s) => s.get(id));
  if (!record) return undefined;
  return { record, files: new GameFiles(Object.entries(record.files)) };
}

export async function saveProject(id: string, name: string, gam: string, files: GameFiles): Promise<void> {
  const record: ProjectRecord = { id, name, gam, updated: Date.now(), files: Object.fromEntries(files.entries()) };
  await request(PROJECTS, 'readwrite', (s) => s.put(record));
}

export async function deleteProject(id: string): Promise<void> {
  await request(PROJECTS, 'readwrite', (s) => s.delete(id));
}

/** Files a game wrote while being played (high scores, saves), keyed by game id. */
export async function loadSaveData(gameId: string): Promise<Record<string, Uint8Array>> {
  try {
    return (await request<Record<string, Uint8Array> | undefined>(SAVES, 'readonly', (s) => s.get(gameId))) ?? {};
  } catch {
    return {};
  }
}

/** Fired on window after writeSaveFile stores a file (a saved game can hold a felt egg). */
export const SAVES_CHANGED = 'gm-saves-changed';

/**
 * Adds or replaces one save file by rewriting the game's whole save record (read, change,
 * put in separate transactions). Failures are logged, not thrown, so play goes on.
 */
export async function writeSaveFile(gameId: string, name: string, bytes: Uint8Array): Promise<void> {
  try {
    const current = await loadSaveData(gameId);
    current[name] = bytes;
    await request(SAVES, 'readwrite', (s) => s.put(current, gameId));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVES_CHANGED));
  } catch (e) {
    console.warn('Could not store save data', e);
  }
}

/**
 * Replaces a game's whole save record (restoring a backup, deleting a slot): files left out
 * are gone afterwards. Fires SAVES_CHANGED. Unlike writeSaveFile, failures are thrown.
 */
export async function replaceSaveData(gameId: string, files: Record<string, Uint8Array>): Promise<void> {
  await request(SAVES, 'readwrite', (s) => (Object.keys(files).length ? s.put({ ...files }, gameId) : s.delete(gameId)));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVES_CHANGED));
}

/** A random id; falls back to time + random when crypto.randomUUID is missing (insecure contexts). */
export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
