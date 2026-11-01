// Knowing an import is a game you already hold: its fingerprint (the .gam and player CRCs,
// fingerprint.ts) matches one kept with a game still in this browser. No DOM.
import { sameGame, type Fingerprint } from './fingerprint';
import { allNotes, type GameNote } from './gameNotes';

/** The id of a game still here that is the same game as `fingerprint`, if there is one. */
export function alreadyHave(fingerprint: Fingerprint, notes: Record<string, GameNote> = allNotes()): string | undefined {
  return Object.entries(notes).find(([, n]) => n.fingerprint && sameGame(n.fingerprint, fingerprint))?.[0];
}
