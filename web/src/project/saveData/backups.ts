// Save backups: copies of a game's save files (game<n>.sav, savnames.dat, its .his, recordings)
// taken now and then, many per game, each with a date and a label. Shared by the web's
// "Saves & scores" panel and the desk PC's BACKUP.EXE / SAVEHACK.EXE.
//
// Kept in an IndexedDB database of their own ("gamemaker-save-backups", store "saveBackups"),
// not in "gamemaker-web": adding a store there would need a version change that an open tab
// blocks. Game ids are the save ids of project/storage.ts ('game:<catalog id>', 'project:<id>').
// Restoring writes the backup's files back as the game's whole save record (replaceSaveData,
// which fires SAVES_CHANGED); every change here fires BACKUPS_CHANGED on window and on a
// BroadcastChannel of the same name, so other tabs (the desk, the home page) keep up.
import { loadSaveData, newId, replaceSaveData } from '../storage';
import { slotOfFile } from './saveGame';

const DB_NAME = 'gamemaker-save-backups';
const DB_VERSION = 1;
const STORE = 'saveBackups';

const BACKUPS_CHANGED = 'gm-save-backups-changed';

interface SaveBackup {
  id: string;
  /** The save id ('game:nebula', 'project:…'). */
  game: string;
  /** Date.now() when taken. */
  when: number;
  label: string;
  files: Record<string, Uint8Array>;
  /** Taken by a program on its own (before the first edit, before a restore), not by hand. */
  auto?: boolean;
  /** What took it ('web', 'SAVEHACK', 'BACKUP'…). */
  by?: string;
}

/** A backup without its files, for lists. */
export type BackupSummary = Omit<SaveBackup, 'files'> & { names: string[]; bytes: number; slots: number[] };

let dbPromise: Promise<IDBDatabase> | undefined;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: 'id' });
      s.createIndex('game', 'game');
    };
    req.onsuccess = () => {
      const d = req.result;
      // a later version elsewhere: step aside rather than block it
      d.onversionchange = () => {
        d.close();
        dbPromise = undefined;
      };
      resolve(d);
    };
    req.onerror = () => {
      dbPromise = undefined;
      reject(req.error);
    };
  });
  return dbPromise;
}

function request<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(STORE, mode);
        const req = run(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error ?? req.error);
        tx.onabort = () => reject(tx.error ?? req.error);
      }),
  );
}

let channel: BroadcastChannel | undefined;
function announce(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BACKUPS_CHANGED));
  try {
    channel ??= new BroadcastChannel(BACKUPS_CHANGED);
    channel.postMessage('changed');
  } catch {
    /* no BroadcastChannel */
  }
}

/** Calls `f` whenever backups change, here or in another tab; returns the stop function. */
export function watchBackups(f: () => void): () => void {
  window.addEventListener(BACKUPS_CHANGED, f);
  let ch: BroadcastChannel | undefined;
  try {
    ch = new BroadcastChannel(BACKUPS_CHANGED);
    ch.onmessage = f;
  } catch {
    /* this tab only */
  }
  return () => {
    window.removeEventListener(BACKUPS_CHANGED, f);
    ch?.close();
  };
}

/** What a set of files holds, for lists. */
export function summarize(b: SaveBackup): BackupSummary {
  const { files, ...rest } = b;
  const names = Object.keys(files).sort();
  return {
    ...rest,
    names,
    bytes: names.reduce((n, k) => n + files[k].length, 0),
    slots: names
      .map(slotOfFile)
      .filter((s): s is number => s !== undefined)
      .sort((a, z) => a - z),
  };
}

/** A label for a backup taken now ("Before editing slot 3", or the date). */
function defaultLabel(when = Date.now()): string {
  return `Backup ${new Date(when).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`;
}

/** Backups of one game (or of every game), newest first. */
export async function listBackups(game?: string): Promise<BackupSummary[]> {
  try {
    const all = await request<SaveBackup[]>('readonly', (s) => (game ? s.index('game').getAll(game) : s.getAll()));
    return all.map(summarize).sort((a, b) => b.when - a.when);
  } catch {
    return [];
  }
}

export async function getBackup(id: string): Promise<SaveBackup | undefined> {
  return request<SaveBackup | undefined>('readonly', (s) => s.get(id));
}

/**
 * Backs up a game's save files as they are now (or `files` when given). Returns undefined when
 * there is nothing to back up.
 */
export async function backupNow(
  game: string,
  opts: { label?: string; files?: Record<string, Uint8Array>; auto?: boolean; by?: string } = {},
): Promise<SaveBackup | undefined> {
  const files = opts.files ?? (await loadSaveData(game));
  if (!Object.keys(files).length) return undefined;
  const when = Date.now();
  const b: SaveBackup = { id: newId(), game, when, label: opts.label?.trim() || defaultLabel(when), files: { ...files }, auto: opts.auto, by: opts.by };
  await request('readwrite', (s) => s.put(b));
  announce();
  return b;
}

/**
 * Puts a backup's files back as the game's save files (the files saved since are gone: take
 * a backup first with `safety` to keep them). Returns the safety backup, if one was taken.
 */
export async function restoreBackup(id: string, opts: { safety?: boolean; by?: string } = {}): Promise<SaveBackup | undefined> {
  const b = await getBackup(id);
  if (!b) throw new Error('That backup is gone.');
  const safety = opts.safety ? await backupNow(b.game, { label: `Before restoring “${b.label}”`, auto: true, by: opts.by }) : undefined;
  await replaceSaveData(b.game, b.files);
  return safety;
}

export async function deleteBackup(id: string): Promise<void> {
  await request('readwrite', (s) => s.delete(id));
  announce();
}

export async function renameBackup(id: string, label: string): Promise<void> {
  const b = await getBackup(id);
  if (!b) return;
  b.label = label.trim() || b.label;
  await request('readwrite', (s) => s.put(b));
  announce();
}

/** Puts a backup back after a delete (Undo). */
export async function putBackup(b: SaveBackup): Promise<void> {
  await request('readwrite', (s) => s.put(b));
  announce();
}
