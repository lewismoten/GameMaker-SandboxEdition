// IndexedDB persistence: editor projects (whole game directories) and per-game
// "save data" overlays (high scores, saved games, recordings written while playing).
import { GameFiles } from './files';

const DB_NAME = 'gamemaker-web';
const DB_VERSION = 1;
const PROJECTS = 'projects';
const SAVES = 'saves';

export interface ProjectRecord {
  id: string;
  name: string;
  gam: string;
  updated: number;
  files: Record<string, Uint8Array>;
}

let dbPromise: Promise<IDBDatabase> | undefined;

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

export async function writeSaveFile(gameId: string, name: string, bytes: Uint8Array): Promise<void> {
  try {
    const current = await loadSaveData(gameId);
    current[name] = bytes;
    await request(SAVES, 'readwrite', (s) => s.put(current, gameId));
  } catch (e) {
    console.warn('Could not store save data', e);
  }
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
