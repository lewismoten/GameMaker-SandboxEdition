// A short history of recent imports, kept in this browser so a closed dialog can still be read
// later: when, from where, how many games came in, how many were left out as ones already held,
// and which failed and why. The last 20 are kept. Editor-only; never in a game's files. No DOM.
import { localJson } from './localJson';

export interface ImportRecord {
  /** Date.now() when it finished. */
  at: number;
  /** Where the games came from: "games/zark.zip", or "the files picked". */
  source: string;
  /** Games brought in. */
  added: number;
  /** Games found but left out because they were already held (not ticked). */
  skipped: number;
  /** Games that could not be imported, each with its reason. */
  failed: string[];
  /** The import was canceled part way. */
  canceled?: boolean;
}

/** How many records are kept. */
export const KEEP = 20;

/** `list` with `record` first (newest first), cut to the last KEEP. */
export function withRecord(list: ImportRecord[], record: ImportRecord): ImportRecord[] {
  return [record, ...list].slice(0, KEEP);
}

const store = localJson<ImportRecord[]>('gm-import-history', () => []);

/** The kept imports, newest first. */
export function importHistory(): ImportRecord[] {
  const list = store.read();
  return Array.isArray(list) ? list : [];
}

/** Adds one import to the history. */
export function recordImport(record: ImportRecord): void {
  store.write(withRecord(importHistory(), record));
}

/** Forgets the history. */
export function clearImportHistory(): void {
  store.write([]);
}

/** One line for a record: "Imported 3 games, 1 already held and left out, 1 failed". */
export function recordText(r: ImportRecord): string {
  const n = (c: number, one: string, many = `${one}s`) => `${c} ${c === 1 ? one : many}`;
  const parts = [`${r.canceled ? 'Canceled: imported' : 'Imported'} ${n(r.added, 'game')}`];
  if (r.skipped) parts.push(`${r.skipped} already held and left out`);
  if (r.failed.length) parts.push(`${r.failed.length} failed`);
  return parts.join(', ');
}
