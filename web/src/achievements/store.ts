// Achievements: what has been done on this site (made a game, played one, dialed the BBS…),
// shared by the web pages and the 1994 desk. Kept in the same IndexedDB save store as the
// games' high scores and saved games (project/storage.ts), under the save id SAVE_ID as one
// small JSON file, written through writeSaveFile's per-game queue so unlocks never overlap.
// PLAYGAME never sees it.
//
// unlockAchievement(id) and progress(id, n, of) are cheap and idempotent: the record is kept
// in memory once read, a call that changes nothing writes nothing, and calls made before the
// record is read are held and applied once it is. Each change fires ACHIEVEMENTS_CHANGED on
// window (and tells other tabs over a BroadcastChannel); a new unlock also fires
// ACHIEVEMENT_UNLOCKED with { id } for the toast.
import { loadSaveData, writeSaveFile } from '../project/storage';
import { achievementById } from './catalog';

export const SAVE_ID = 'site:achievements';
export const FILE = 'achievements.json';
export const ACHIEVEMENTS_CHANGED = 'gm-achievements-changed';
/** A CustomEvent with detail { id } for each new unlock. */
export const ACHIEVEMENT_UNLOCKED = 'gm-achievement-unlocked';

export interface AchievementRecord {
  /** id -> Date.now() of the unlock. */
  unlocked: Record<string, number>;
  /** id -> how far along ("3 of 24"). */
  progress: Record<string, { n: number; of: number }>;
  /** id -> the things counted toward it (games played, editors used), for counts derived later. */
  sets: Record<string, string[]>;
}

export const emptyRecord = (): AchievementRecord => ({ unlocked: {}, progress: {}, sets: {} });

/** The record read back from its file; anything malformed is dropped. */
export function parseRecord(bytes: Uint8Array | undefined): AchievementRecord {
  const r = emptyRecord();
  if (!bytes) return r;
  try {
    const o = JSON.parse(new TextDecoder().decode(bytes));
    for (const [k, v] of Object.entries(o?.unlocked ?? {})) if (typeof v === 'number') r.unlocked[k] = v;
    for (const [k, v] of Object.entries(o?.progress ?? {}) as [string, { n?: unknown; of?: unknown }][])
      if (typeof v?.n === 'number' && typeof v?.of === 'number') r.progress[k] = { n: v.n, of: v.of };
    for (const [k, v] of Object.entries(o?.sets ?? {})) if (Array.isArray(v)) r.sets[k] = v.filter((x): x is string => typeof x === 'string');
  } catch {
    /* a broken file starts afresh */
  }
  return r;
}

/** Two records as one (this tab's and another's): the first unlock date, the furthest progress, every item. */
export function mergeRecords(a: AchievementRecord, b: AchievementRecord): AchievementRecord {
  const r = emptyRecord();
  for (const src of [a, b]) {
    for (const [k, t] of Object.entries(src.unlocked)) r.unlocked[k] = Math.min(r.unlocked[k] ?? t, t);
    for (const [k, p] of Object.entries(src.progress)) {
      const q = r.progress[k];
      r.progress[k] = !q || p.n > q.n || (p.n === q.n && p.of > q.of) ? { ...p } : q;
    }
    for (const [k, s] of Object.entries(src.sets)) r.sets[k] = [...new Set([...(r.sets[k] ?? []), ...s])];
  }
  return r;
}

let record: AchievementRecord | undefined;
let loading: Promise<AchievementRecord> | undefined;
/** Changes asked for before the record was read. */
let held: ((r: AchievementRecord) => boolean)[] = [];
let channel: BroadcastChannel | undefined;
const devLog = (...a: unknown[]) => import.meta.env?.DEV && console.info('[achievements]', ...a);

function tellOthers(): void {
  try {
    channel ??= new BroadcastChannel(ACHIEVEMENTS_CHANGED);
    channel.postMessage('changed');
  } catch {
    /* no BroadcastChannel */
  }
}

/** Reads the record once (later calls share it). */
export function loadAchievements(): Promise<AchievementRecord> {
  if (record) return Promise.resolve(record);
  loading ??= loadSaveData(SAVE_ID)
    .then((files) => parseRecord(files[FILE]))
    .catch(() => emptyRecord())
    .then((r) => {
      record = r;
      const changes = held;
      held = [];
      const before = new Set(Object.keys(r.unlocked));
      if (changes.map((f) => f(r)).some(Boolean)) commit(before);
      return r;
    });
  return loading;
}

/** The record as last read, or undefined before it is. */
export const currentAchievements = (): AchievementRecord | undefined => record;

let writing: Promise<void> = Promise.resolve();

/** Stores the record (merged with whatever another tab stored meanwhile) and says what changed. */
function commit(before: Set<string>): void {
  for (const id of Object.keys(record!.unlocked)) if (!before.has(id)) announceUnlock(id);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED));
  writing = writing
    .then(async () => {
      const stored = parseRecord((await loadSaveData(SAVE_ID))[FILE]);
      if (!record) return;
      record = mergeRecords(stored, record);
      await writeSaveFile(SAVE_ID, FILE, new TextEncoder().encode(JSON.stringify(record)), { quiet: true });
      tellOthers();
    })
    .catch((e) => console.warn('Could not store achievements', e));
}

function announceUnlock(id: string): void {
  devLog('unlocked', id);
  if (typeof document === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCKED, { detail: { id } }));
  void import('./toast').then((m) => m.showUnlock(id));
}

/** Applies a change now, or once the record is read. The change says whether it changed anything. */
function change(f: (r: AchievementRecord) => boolean): void {
  if (!record) {
    held.push(f);
    void loadAchievements();
    return;
  }
  const before = new Set(Object.keys(record.unlocked));
  if (f(record)) commit(before);
}

function known(id: string): boolean {
  if (achievementById(id)) return true;
  devLog('unknown achievement id', id);
  return false;
}

/** Unlocks an achievement (once: later calls do nothing). Unknown ids are ignored. */
export function unlockAchievement(id: string): void {
  if (!known(id) || record?.unlocked[id]) return;
  change((r) => {
    if (r.unlocked[id]) return false;
    r.unlocked[id] = Date.now();
    const of = achievementById(id)?.of;
    if (of) r.progress[id] = { n: of, of };
    return true;
  });
}

/** How far along an achievement is ("n of of"); reaching the end unlocks it. Progress never goes back. */
export function progress(id: string, n: number, of: number): void {
  if (!known(id) || !(of > 0)) return;
  const p = record?.progress[id];
  if (record && p && p.n >= n && p.of === of && (n < of || record.unlocked[id])) return;
  change((r) => {
    const q = r.progress[id];
    let changed = false;
    // a count never drops for the same total (a heart taken away keeps the badge); a new total
    // (the catalog changed) counts afresh
    if (!q || n > q.n || of !== q.of) {
      r.progress[id] = { n: of === q?.of ? Math.max(n, q.n) : n, of };
      changed = true;
    }
    if (n >= of && !r.unlocked[id]) {
      r.unlocked[id] = Date.now();
      changed = true;
    }
    return changed;
  });
}

/**
 * Counts `item` toward an achievement whose total is fixed in the catalog (the editors, the
 * export platforms): the set is kept, and progress is its size against the catalog's `of`.
 */
export function tally(id: string, item: string): void {
  const a = achievementById(id);
  if (!known(id) || !a) return;
  if (record?.sets[id]?.includes(item)) return;
  change((r) => {
    const s = (r.sets[id] ??= []);
    if (s.includes(item)) return false;
    s.push(item);
    if (a.of) {
      const n = a.items ? s.filter((x) => a.items!.includes(x)).length : s.length;
      r.progress[id] = { n: Math.min(n, a.of), of: a.of };
      if (n >= a.of && !r.unlocked[id]) r.unlocked[id] = Date.now();
    }
    return true;
  });
}

/** Keeps an item in a set without unlocking anything (games played, walkthroughs watched). */
export function remember(key: string, item: string): Promise<string[]> {
  return new Promise((resolve) => {
    change((r) => {
      const s = (r.sets[key] ??= []);
      const added = !s.includes(item);
      if (added) s.push(item);
      resolve([...s]);
      return added;
    });
  });
}

/** Forgets everything (the achievements page's Reset). */
export async function resetAchievements(): Promise<void> {
  await loadAchievements();
  held = [];
  record = emptyRecord();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED));
  writing = writing
    .then(() => writeSaveFile(SAVE_ID, FILE, new TextEncoder().encode(JSON.stringify(record)), { quiet: true }))
    .then(tellOthers)
    .catch((e) => console.warn('Could not reset achievements', e));
  await writing;
}

/** Waits for the writes asked for so far (tests, the reset). */
export const achievementsWritten = (): Promise<void> => writing;

/** Another tab changed them: read again. */
export function listenToOtherTabs(): void {
  try {
    channel ??= new BroadcastChannel(ACHIEVEMENTS_CHANGED);
    channel.onmessage = () => {
      void loadSaveData(SAVE_ID).then((files) => {
        const stored = parseRecord(files[FILE]);
        // a reset elsewhere empties the store: follow it rather than merging back
        record = Object.keys(stored.unlocked).length || !record ? mergeRecords(stored, record ?? emptyRecord()) : stored;
        window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED));
      });
    };
  } catch {
    /* no BroadcastChannel */
  }
}

/** Test only: forget the record in memory. */
export function forgetForTests(): void {
  record = undefined;
  loading = undefined;
  held = [];
  writing = Promise.resolve();
}

