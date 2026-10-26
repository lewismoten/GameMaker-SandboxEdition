// Where an imported game's rating and note go as it comes and goes: an import keeps its source
// and fingerprint (and takes back the rating and note of the same game removed before); a
// removal moves them to its removed-game record; Undo moves them back. No DOM.
import { fingerprintOfFiles, type Fingerprint } from './fingerprint';
import { setNote, takeNote } from './gameNotes';
import { forgetRemoved, rememberRemoved, removedMatch, type RemovedGame } from './removedGames';

/** Notes an imported game's source and fingerprint; the removed game's record it brings back, if any. */
export function noteImport(id: string, source: string, fingerprint: Fingerprint): RemovedGame | undefined {
  const was = removedMatch(fingerprint);
  if (was) forgetRemoved(was.id);
  setNote(id, { source, fingerprint, ...(was ? { rating: was.rating, note: was.note } : {}) });
  return was;
}

/**
 * Keeps a record of an imported game being removed; its `files` (or their `fingerprint`, worked
 * out already) give its fingerprint when the import didn't keep one.
 */
export function noteRemoval(game: { id: string; name: string }, files?: Record<string, Uint8Array>, fingerprint?: Fingerprint): void {
  const n = takeNote(game.id);
  const print = n.fingerprint ?? fingerprint ?? (files ? fingerprintOfFiles(files) : { gam: [] });
  rememberRemoved({ id: game.id, name: game.name, source: n.source, fingerprint: print, rating: n.rating, note: n.note });
}

/** Puts a removed game's rating and note back (Undo after a Delete). */
export function undoRemoval(id: string): void {
  const r = forgetRemoved(id);
  if (r) setNote(id, { rating: r.rating, note: r.note, source: r.source, fingerprint: r.fingerprint });
}
