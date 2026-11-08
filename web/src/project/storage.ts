// IndexedDB persistence: editor projects (whole game directories) and per-game
// "save data" overlays (high scores, saved games, recordings written while playing).
// This stands in for the DOS disk the original Game-Maker read and wrote; it is not a port.
//
// Database "gamemaker-web", version 1, two object stores:
//   projects: ProjectRecord rows keyed by their `id`.
//   saves: one object per game id mapping file name -> bytes (out-of-line keys).
import type { Delta } from '@lewismoten/gamemaker-sandbox-tools/delta';
import { GameFiles } from './files';
import type { Companion } from './companion';
import { recoverRecord, type Damage } from './recover';
import { repairedTitle } from './importedTitle';
import { DAMAGED_SUFFIX, isDamagedCopy, redundantCopies } from './damagedCopies';

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
  /** Editor-only extras (companion.ts): never one of the game's files, so no export but the backup carries it. */
  companion?: Companion;
  /** The Optimize tool's checkpoints, oldest first (checkpoint.ts); never one of the game's files, so no export carries them. */
  checkpoints?: StoredCheckpoint[];
  /** The one checkpoint an earlier version kept, whole; read once into `checkpoints`. */
  checkpoint?: LegacyCheckpoint;
}

/** A checkpoint: a stamp of the whole game, stored as what changed since the one before it (delta.ts), like a commit. */
export interface StoredCheckpoint {
  id: string;
  name: string;
  /** Date.now() when it was made. */
  made: number;
  /** A release label the person gave it, if any. */
  tag?: string;
  /** Changes since the previous checkpoint (all files, for the first). */
  delta: Delta;
  companion?: Companion;
}

/** The single checkpoint of earlier versions: every file whole. */
export interface LegacyCheckpoint {
  name: string;
  made: number;
  files: Record<string, Uint8Array>;
  companion?: Companion;
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

function request<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
  read?: (value: T, store: IDBObjectStore) => T,
): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(store, mode);
        const req = run(tx.objectStore(store));
        req.onsuccess = () => resolve(read ? read(req.result, tx.objectStore(store)) : req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// Read and name-only put share a transaction: a concurrent rename cannot be overwritten.
// No schema bump, DOS file rewrite, timestamp change, or damage-backup modification.
function repairName<T extends ProjectRecord | undefined>(row: T, store: IDBObjectStore): T {
  if (!row || typeof row !== 'object' || typeof row.id !== 'string' || isDamagedCopy(row.id)) return row;
  const name = repairedTitle(row);
  if (!name) return row;
  const next = { ...row, name };
  store.put(next);
  return next;
}

type Summary = Omit<ProjectRecord, 'files'>;

// every stored record that has an id, files and all
async function allRecords(): Promise<ProjectRecord[]> {
  return (
    await request<ProjectRecord[]>(
      PROJECTS,
      'readwrite',
      (s) => s.getAll(),
      (rows, s) => rows.map((r) => repairName(r, s)),
    )
  ).filter((r) => r && typeof r === 'object' && typeof r.id === 'string');
}

const summaries = (rows: ProjectRecord[]): Summary[] => rows.map(({ files: _files, ...rest }) => rest).sort((a, b) => b.updated - a.updated);

/**
 * Project summaries without their files, newest first. getAll() still loads the files, then drops
 * them. The kept copies of damaged saves (`<id>~damaged`) are not games of their own: see listDamagedCopies.
 */
export async function listProjects(): Promise<Summary[]> {
  return summaries((await allRecords()).filter((r) => !isDamagedCopy(r.id)));
}

/** The kept copies of damaged saves, newest first (the home page's "Damaged copies…" lists them). */
export async function listDamagedCopies(): Promise<Summary[]> {
  return summaries((await allRecords()).filter((r) => isDamagedCopy(r.id)));
}

let pruned: Promise<number> | undefined;

/**
 * Deletes each kept damaged copy that holds nothing its original lacks (damagedCopies.ts says
 * when), once a page load; resolves to how many went. Never throws: a copy that can't be checked stays.
 */
export function pruneDamagedCopies(): Promise<number> {
  return (pruned ??= pruneNow());
}

async function pruneNow(): Promise<number> {
  try {
    const gone = redundantCopies(await allRecords());
    for (const id of gone) await request(PROJECTS, 'readwrite', (s) => s.delete(id));
    return gone.length;
  } catch {
    return 0;
  }
}

/**
 * A stored project with every intact file. A damaged piece (recover.ts) is left out and listed
 * in `damage`. `keepCopy` (only the editor opening the game passes it): the record as it was
 * stored is first kept whole under `<id>~damaged`, so nothing the person might still want is
 * overwritten by the next autosave. A listing, preview or check never makes a copy.
 */
export async function loadProject(
  id: string,
  o: { keepCopy?: boolean } = {},
): Promise<{ record: ProjectRecord; files: GameFiles; damage: Damage[] } | undefined> {
  const raw = await loadRecord(id);
  if (raw === undefined || raw === null) return undefined;
  const { record, files, damage } = recoverRecord(id, raw);
  if (o.keepCopy && damage.length && !isDamagedCopy(id)) await keepDamagedCopy(id, raw, record.name);
  return { record, files, damage };
}

// Stores the project exactly as it was found, once; failing to is not a reason to stop the open.
async function keepDamagedCopy(id: string, raw: unknown, name: string): Promise<void> {
  try {
    const copyId = id + DAMAGED_SUFFIX;
    if ((await request<unknown>(PROJECTS, 'readonly', (s) => s.get(copyId))) !== undefined) return;
    const copy =
      typeof raw === 'object' && raw
        ? { ...raw, id: copyId, name: `${name} (damaged copy)` }
        : { id: copyId, name: `${name} (damaged copy)`, gam: '', updated: Date.now(), files: {} };
    await request(PROJECTS, 'readwrite', (s) => s.put(copy));
  } catch {
    /* the notice still tells what is broken */
  }
}

/**
 * Stores a project. `companion` undefined keeps the one stored already (many callers only
 * know the files), so the record is read and written in one transaction.
 */
export async function saveProject(id: string, name: string, gam: string, files: GameFiles, companion?: Companion): Promise<void> {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(PROJECTS, 'readwrite');
    const store = tx.objectStore(PROJECTS);
    const next: ProjectRecord = { id, name, gam, updated: Date.now(), files: Object.fromEntries(files.entries()) };
    const get = store.get(id);
    get.onsuccess = () => store.put(withCompanion(next, get.result as ProjectRecord | undefined, companion));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** The record to store: the given companion, else the stored one, else none; the stored checkpoints always stay. */
export function withCompanion(next: ProjectRecord, stored: ProjectRecord | undefined, companion?: Companion): ProjectRecord {
  const c = companion ?? stored?.companion;
  let out = c ? { ...next, companion: c } : next;
  if (stored?.checkpoints) out = { ...out, checkpoints: stored.checkpoints };
  if (stored?.checkpoint) out = { ...out, checkpoint: stored.checkpoint };
  return out;
}

/** The project's stored record. */
export async function loadRecord(id: string): Promise<ProjectRecord | undefined> {
  return request<ProjectRecord | undefined>(PROJECTS, 'readwrite', (s) => s.get(id), repairName);
}

/** Stores the project's checkpoints (none: removes them, and the old single one), leaving the rest of its record as it is. */
export async function saveCheckpoints(id: string, checkpoints: StoredCheckpoint[]): Promise<void> {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(PROJECTS, 'readwrite');
    const store = tx.objectStore(PROJECTS);
    const get = store.get(id);
    get.onsuccess = () => {
      const rec = get.result as ProjectRecord | undefined;
      if (!rec) return reject(new Error('The game is not saved yet'));
      const { checkpoint: _old, checkpoints: _list, ...rest } = rec;
      store.put(checkpoints.length ? { ...rest, checkpoints } : rest);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Puts a record back exactly as it was kept (its last-saved time, companion and checkpoints included). */
export async function putRecord(record: ProjectRecord): Promise<void> {
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
export function writeSaveFile(gameId: string, name: string, bytes: Uint8Array, o: { quiet?: boolean } = {}): Promise<void> {
  // one game's writes take turns: saving writes savnames.dat and gameN.sav back to back,
  // and two overlapping read-change-puts would lose the first file (the slot's name)
  const queued = (saveWrites.get(gameId) ?? Promise.resolve()).then(() => storeSaveFile(gameId, name, bytes, o.quiet));
  saveWrites.set(gameId, queued);
  void queued.then(() => {
    if (saveWrites.get(gameId) === queued) saveWrites.delete(gameId);
  });
  return queued;
}

const saveWrites = new Map<string, Promise<void>>();

// quiet: no SAVES_CHANGED (the achievements' record is no game's save; an open Saves & scores need not reload)
async function storeSaveFile(gameId: string, name: string, bytes: Uint8Array, quiet = false): Promise<void> {
  // Node tests have neither a browser window nor a disk to persist to. Browser failures
  // (including a browser without IndexedDB) still reach the warning below.
  if (typeof window === 'undefined' && typeof indexedDB === 'undefined') return;
  try {
    const current = await loadSaveData(gameId);
    current[name] = bytes;
    await request(SAVES, 'readwrite', (s) => s.put(current, gameId));
    if (!quiet && typeof window !== 'undefined') window.dispatchEvent(new Event(SAVES_CHANGED));
  } catch (e) {
    console.warn('Could not store save data', e);
  }
}

/**
 * Replaces a game's whole save record (restoring a backup, deleting a slot): files left out
 * are gone afterwards. Fires SAVES_CHANGED. Unlike writeSaveFile, failures are thrown.
 */
export async function replaceSaveData(gameId: string, files: Record<string, Uint8Array>): Promise<void> {
  if (Object.keys(files).length) await request(SAVES, 'readwrite', (s) => s.put({ ...files }, gameId));
  else await request(SAVES, 'readwrite', (s) => s.delete(gameId));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVES_CHANGED));
}

/** A random id; falls back to time + random when crypto.randomUUID is missing (insecure contexts). */
export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
