// Knowing an import is a game you already hold: its fingerprint (the .gam and player CRCs,
// fingerprint.ts) matches one kept with a game still in this browser. No DOM.
import { sameGame, type Fingerprint } from './fingerprint';
import { allNotes, type GameNote } from './gameNotes';

/** The id of a game still here that is the same game as `fingerprint`, if there is one. */
export function alreadyHave(fingerprint: Fingerprint, notes: Record<string, GameNote> = allNotes()): string | undefined {
  return Object.entries(notes).find(([, n]) => n.fingerprint && sameGame(n.fingerprint, fingerprint))?.[0];
}

/**
 * What the import chooser says beside a game you already hold: "Already in your games (Nebula)",
 * or nothing. `nameOf` gives a game's name from its id (a game no longer listed says nothing).
 */
export function heldText(
  fingerprint: Fingerprint,
  nameOf: (id: string) => string | undefined,
  notes: Record<string, GameNote> = allNotes(),
): string | undefined {
  const id = alreadyHave(fingerprint, notes);
  const name = id === undefined ? undefined : nameOf(id);
  return name === undefined ? undefined : `Already in your games (${name})`;
}
