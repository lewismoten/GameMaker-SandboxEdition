// The toy safe's record: whether Teddy's safe has been opened, the pretend coins spent in its
// treat store and the treats bought. It sits in the same score save as money.ts's amounts
// (so backups carry it) but in a file of its own, so each game's saved money stays as it was.
import { loadSaveData, writeSaveFile } from '../project/storage';
import { SAVE_ID, MONEY_CHANGED } from './money';
import { treatById } from './treats';

export const SAFE_FILE = 'fort-knox.json';

export interface SafeRecord {
  opened: boolean;
  spent: number;
  treats: Record<string, number>;
}

export const emptySafe = (): SafeRecord => ({ opened: false, spent: 0, treats: {} });
const whole = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

export function parseSafe(bytes: Uint8Array | undefined): SafeRecord {
  if (!bytes) return emptySafe();
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    const treats = Object.fromEntries(
      Object.entries(raw.treats ?? {})
        .filter((e): e is [string, number] => whole(e[1]) && treatById(e[0]) !== undefined)
        .map(([id, n]) => [id, Math.floor(n)]),
    );
    return { opened: raw.opened === true, spent: whole(raw.spent) ? Math.floor(raw.spent) : 0, treats };
  } catch {
    return emptySafe();
  }
}

/** The pretend coins left: what the games left over, less what the treat store has had. */
export const balance = (saved: number, rec: SafeRecord): number => Math.max(0, saved - rec.spent);

/** Buys one treat, or returns undefined when it is unknown or costs more than the balance. */
export function buy(rec: SafeRecord, id: string, saved: number): SafeRecord | undefined {
  const t = treatById(id);
  if (!t || t.price > balance(saved, rec)) return undefined;
  return { ...rec, spent: rec.spent + t.price, treats: { ...rec.treats, [id]: (rec.treats[id] ?? 0) + 1 } };
}

/** Merging two backups keeps the most of everything (it never gives coins back). */
export function mergeSafe(a: SafeRecord, b: SafeRecord): SafeRecord {
  const treats = { ...a.treats };
  for (const [id, n] of Object.entries(b.treats)) treats[id] = Math.max(treats[id] ?? 0, n);
  return { opened: a.opened || b.opened, spent: Math.max(a.spent, b.spent), treats };
}

export async function loadSafe(): Promise<SafeRecord> {
  const files: Record<string, Uint8Array> = await loadSaveData(SAVE_ID).catch(() => ({}));
  return parseSafe(files[SAFE_FILE]);
}

export async function saveSafe(rec: SafeRecord): Promise<void> {
  await writeSaveFile(SAVE_ID, SAFE_FILE, new TextEncoder().encode(JSON.stringify(rec)), { quiet: true });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(MONEY_CHANGED));
}
