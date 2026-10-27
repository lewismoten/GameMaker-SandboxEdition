// Each imported game's rating (1–5 stars, or none: Unrated), its free-text note, and where it
// came from with its fingerprint, by project id. Kept in this browser (localJson.ts), never in
// a game's files or exports. When the game is removed, removedGames.ts takes it over.
import type { Fingerprint } from './fingerprint';
import { localJson } from './localJson';

/** 0 is Unrated. */
export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export interface GameNote {
  rating?: Rating;
  note?: string;
  /** Where it was imported from: "games/zark.zip › zark/". */
  source?: string;
  fingerprint?: Fingerprint;
  /** Date.now() of the last change to its rating or note (a backup's restore keeps the newer). */
  edited?: number;
}

const store = localJson<Record<string, GameNote>>('gm-imported-notes', () => ({}));

/** Told on `window` when a rating or note changes, so the lists showing them redraw. */
export const NOTES_CHANGED = 'gm-imported-notes-changed';

/** A game's rating and note (empty when it has none). */
export function noteOf(id: string): GameNote {
  return store.read()[id] ?? {};
}

/** Every game's, by project id. */
export function allNotes(): Record<string, GameNote> {
  return store.read();
}

/** Changes some of a game's fields; one left empty (Unrated, no note) is dropped. */
export function setNote(id: string, change: Partial<GameNote>): void {
  const map = store.read();
  const next: GameNote = { ...map[id], ...change };
  if (('rating' in change && change.rating !== map[id]?.rating) || ('note' in change && change.note !== map[id]?.note)) next.edited = Date.now();
  if (!next.rating) delete next.rating;
  if (!next.note?.trim()) delete next.note;
  if (!next.source) delete next.source;
  if (!next.fingerprint) delete next.fingerprint;
  if (Object.keys(next).length === 1) delete next.edited;
  if (Object.keys(next).length) map[id] = next;
  else delete map[id];
  store.write(map);
  (globalThis as Partial<EventTarget>).dispatchEvent?.(new Event(NOTES_CHANGED));
}

/** Takes a removed game's out (removedGames.ts keeps it); what it was. */
export function takeNote(id: string): GameNote {
  const map = store.read();
  const was = map[id] ?? {};
  if (id in map) {
    delete map[id];
    store.write(map);
  }
  return was;
}

/** A game's rating, 0 when unrated. */
export const ratingOf = (id: string, notes = store.read()): Rating => notes[id]?.rating ?? 0;
