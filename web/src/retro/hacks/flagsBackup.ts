// FLAGS /BACKUP and /RESTORE: the browser state FLAGS changes, kept as C:\DOS\FLAGS.BAK (a text
// file in the desk PC's own IndexedDB record, so DIR, TYPE and DEL see it) and put back on request.
// A change made while no FLAGS.BAK exists takes one first, so testing never loses real progress.
import { idbRecord } from '../dos/cDriveStore';
import { loadAchievements, replaceAchievements, parseRecord, type AchievementRecord } from '../../achievements/store';
import { setDeskClock } from '../dos/deskClock';
import { restoreAccount } from '../bbs/ratio';
import { BACKUP_KEYS } from './flagsBackupKeys';
import { file, type DosNode } from '../dos/vfs';

export const BAK_NAME = 'FLAGS.BAK';
const HEADER = 'FLAGS.BAK 1  (FLAGS /RESTORE puts this back; DEL deletes it)';

interface Bak {
  at: number;
  local: Record<string, string>;
  ach: AchievementRecord;
}

const store = idbRecord<string>('FLAGSBAK');
/** Kept so DIR can list the file without waiting; set when the record loads. */
let cached: string | null | undefined;

export async function readBak(): Promise<string | null> {
  if (cached === undefined) cached = (await store.load().catch(() => undefined)) ?? null;
  return cached;
}

export async function writeBak(text: string | null): Promise<void> {
  cached = text;
  await store.save(text ?? '').catch(() => undefined);
}

/** The state as FLAGS.BAK text. */
export async function makeBak(at = Date.now()): Promise<string> {
  const local: Record<string, string> = {};
  for (const k of BACKUP_KEYS) {
    const v = (() => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    })();
    if (v !== null) local[k] = v;
  }
  const bak: Bak = { at, local, ach: await loadAchievements() };
  return `${HEADER}\r\n${JSON.stringify(bak)}\r\n`;
}

/** The backup in `text`, or undefined when it isn't one of ours. */
export function parseBak(text: string | null): Bak | undefined {
  if (!text?.startsWith('FLAGS.BAK 1')) return undefined;
  try {
    const o = JSON.parse(text.split(/\r?\n/)[1] ?? '') as Partial<Bak>;
    if (typeof o.at !== 'number' || !o.local || typeof o.local !== 'object') return undefined;
    const local: Record<string, string> = {};
    for (const k of BACKUP_KEYS) if (typeof o.local[k] === 'string') local[k] = o.local[k];
    return { at: o.at, local, ach: parseRecord(new TextEncoder().encode(JSON.stringify(o.ach ?? {}))) };
  } catch {
    return undefined;
  }
}

const EVENTS = [
  'gm-eggs-changed',
  'gm-tin-hearts-changed',
  'gm-score-trophies-changed',
  'gm-desk-clock',
  'course-grades-changed',
  'courier-changed',
  'gm-chicken-changed',
];

/** Puts a backup's state back: every kept key is set or removed, so the state is exactly as it was. */
export async function restoreBak(bak: Bak): Promise<void> {
  for (const k of BACKUP_KEYS) {
    try {
      if (k in bak.local) localStorage.setItem(k, bak.local[k]);
      else localStorage.removeItem(k);
    } catch {
      /* private mode */
    }
  }
  restoreAccount(bak.local['gm-bbs-sandbox-user'] ?? null);
  const offset = Number(bak.local['gm-desk-clock']);
  setDeskClock(new Date(Date.now() + (Number.isFinite(offset) ? offset : 0)));
  await replaceAchievements(bak.ach);
  if (typeof window !== 'undefined') for (const e of EVENTS) window.dispatchEvent(new Event(e));
}

/** C:\DOS\FLAGS.BAK for DIR and TYPE, once one is made. */
export async function flagsBakNodes(): Promise<DosNode[]> {
  const text = await readBak();
  if (!text) return [];
  const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0) & 255);
  return [file(BAK_NAME, bytes.length, { read: async () => bytes, remove: () => writeBak(null) })];
}
