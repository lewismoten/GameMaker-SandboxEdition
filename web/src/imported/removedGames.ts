// A small record of each imported game removed from this browser: its fingerprint, name,
// where it came from, its rating and note, and when it was removed. A later import marks the
// same game "Previously removed" (left unticked); the Library lists the records with their
// notes and can forget one. Kept in this browser (localJson.ts), never in a game's files.
import { sameGame, type Fingerprint } from './fingerprint';
import type { Rating } from './gameNotes';
import { localJson } from './localJson';

export interface RemovedGame {
  /** The project id it had (Undo, after a Delete, puts it back under it). */
  id: string;
  name: string;
  source?: string;
  fingerprint: Fingerprint;
  rating?: Rating;
  note?: string;
  /** Date.now() when it was removed. */
  removed: number;
}

const store = localJson<RemovedGame[]>('gm-removed-games', () => []);

/** Every record, the one removed last first. */
export function removedGames(): RemovedGame[] {
  return [...store.read()].reverse().sort((a, b) => b.removed - a.removed);
}

/** Remembers a removed game, in place of an older record of the same game. */
export function rememberRemoved(game: Omit<RemovedGame, 'removed'>, now = Date.now()): void {
  const kept = store.read().filter((r) => r.id !== game.id && !sameGame(r.fingerprint, game.fingerprint));
  const record: RemovedGame = { ...game, removed: now };
  if (!record.rating) delete record.rating;
  if (!record.note?.trim()) delete record.note;
  store.write([...kept, record]);
}

/** Forgets a record (by the id the game had); what it was. */
export function forgetRemoved(id: string): RemovedGame | undefined {
  const all = store.read();
  const was = all.find((r) => r.id === id);
  if (was) store.write(all.filter((r) => r !== was));
  return was;
}

/** The record of a removed game with this fingerprint, if any. */
export function removedMatch(fingerprint: Fingerprint, records = store.read()): RemovedGame | undefined {
  return records.find((r) => sameGame(r.fingerprint, fingerprint));
}
