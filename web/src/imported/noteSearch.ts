// The Library's list of imported games' ratings and notes: the games still here that have a
// rating or a note, then the removed ones (removedGames.ts), and finding them by any words of
// their name, note, source or fingerprint. No DOM.
import { fingerprintText, type Fingerprint } from './fingerprint';
import type { GameNote, Rating } from './gameNotes';
import type { RemovedGame } from './removedGames';

export interface NoteEntry {
  /** The project id the game has, or had. */
  id: string;
  name: string;
  rating: Rating;
  note: string;
  source?: string;
  fingerprint?: Fingerprint;
  /** When it was removed (Date.now()); missing while the game is still here. */
  removed?: number;
}

const byName = (a: NoteEntry, b: NoteEntry) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

/** The games here with a rating or note (A to Z), then the removed ones (removed last first). */
export function noteEntries(live: { id: string; name: string }[], notes: Record<string, GameNote>, removed: RemovedGame[]): NoteEntry[] {
  const here = live
    .map((p) => ({ p, n: notes[p.id] }))
    .filter(({ n }) => n?.rating || n?.note?.trim())
    .map(({ p, n }) => ({ id: p.id, name: p.name, rating: n.rating ?? 0, note: n.note ?? '', source: n.source, fingerprint: n.fingerprint }))
    .sort(byName);
  const gone = [...removed]
    .sort((a, b) => b.removed - a.removed)
    .map((r) => ({ id: r.id, name: r.name, rating: r.rating ?? 0, note: r.note ?? '', source: r.source, fingerprint: r.fingerprint, removed: r.removed }));
  return [...here, ...gone];
}

/** The words an entry is found by. */
const words = (e: NoteEntry) =>
  [e.name, e.note, e.source ?? '', e.fingerprint ? fingerprintText(e.fingerprint) : '', e.removed ? 'removed' : ''].join('\n').toLowerCase();

/** The entries with every word of the query (any order, any case). */
export function searchNotes(entries: NoteEntry[], query: string): NoteEntry[] {
  const want = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!want.length) return entries;
  return entries.filter((e) => {
    const text = words(e);
    return want.every((w) => text.includes(w));
  });
}
