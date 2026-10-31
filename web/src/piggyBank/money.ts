// The Desk piggy bank's record: the last amount of a catalog game's in-game money left on a win.
// It is a small companion file in the score save, so ordinary save backups carry it too.
import { loadSaveData, writeSaveFile } from '../project/storage';

export const SAVE_ID = 'site:scores';
export const FILE = 'piggy-bank.json';
export const MONEY_CHANGED = 'gm-piggy-bank-changed';

export type MoneyRecord = Record<string, number>;

const whole = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

export function parseMoney(bytes: Uint8Array | undefined): MoneyRecord {
  if (!bytes) return {};
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    return Object.fromEntries(
      Object.entries(raw)
        .filter((entry): entry is [string, number] => whole(entry[1]))
        .map(([game, money]) => [game, Math.floor(money)]),
    );
  } catch {
    return {};
  }
}

export async function loadMoney(): Promise<MoneyRecord> {
  const files: Record<string, Uint8Array> = await loadSaveData(SAVE_ID).catch(() => ({}));
  return parseMoney(files[FILE]);
}

/** Keeps only wins: a loss and a quit do not empty Teddy's pretend piggy bank. */
export async function recordMoney(game: string, money: number): Promise<void> {
  const next = { ...(await loadMoney()), [game]: Math.max(0, Math.floor(money)) };
  await writeSaveFile(SAVE_ID, FILE, new TextEncoder().encode(JSON.stringify(next)), { quiet: true });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(MONEY_CHANGED));
}
