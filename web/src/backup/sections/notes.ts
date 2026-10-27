// Imported games' notes and ratings (imported/gameNotes.ts) and the records of removed ones
// (imported/removedGames.ts), never the games' files. Each note carries its game's name and
// fingerprint, so restoring it finds the same game here by its id or its fingerprint; a note
// whose game isn't here becomes a removed game's record, which brings the rating and note back
// when that game is imported again. Merge keeps the newer edit of each note.
import { sameGame, type Fingerprint } from '../../imported/fingerprint';
import type { World } from '../world';
import { importedIds } from './projects';
import { isRecord, json, need, plural, type Section } from './types';

interface Note {
  rating?: number;
  note?: string;
  source?: string;
  fingerprint?: Fingerprint;
  edited?: number;
  /** In a backup only: the game's name when it was backed up. */
  name?: string;
}

interface Removed {
  id: string;
  name: string;
  source?: string;
  fingerprint: Fingerprint;
  rating?: number;
  note?: string;
  removed: number;
}

export interface NotesPayload {
  notes: Record<string, Note>;
  removed: Removed[];
}

const NOTES = 'gm-imported-notes';
const REMOVED = 'gm-removed-games';

const isPrint = (v: unknown): v is Fingerprint => isRecord(v) && Array.isArray(v.gam) && v.gam.every((n) => typeof n === 'number');

function readNotes(w: World): NotesPayload {
  const n = json<unknown>(w.local[NOTES]);
  const r = json<unknown>(w.local[REMOVED]);
  return { notes: isRecord(n) ? (n as Record<string, Note>) : {}, removed: Array.isArray(r) ? (r as Removed[]) : [] };
}

const hasWords = (n: Note | undefined) => !!(n?.rating || n?.note?.trim());

/** The file's notes put where they belong here: on the same game (by id, then fingerprint), else as removed records. */
function place(base: NotesPayload, theirs: NotesPayload, w: World, prefer?: 'mine' | 'theirs'): NotesPayload {
  const imported = importedIds(w);
  const notes = { ...base.notes };
  const removed = [...base.removed];
  for (const r of theirs.removed) addRemoved(removed, r);
  for (const [id, n0] of Object.entries(theirs.notes)) {
    const { name, ...n } = n0;
    let target = imported.has(id) ? id : undefined;
    if (!target && n.fingerprint)
      target = Object.keys(notes).find((k) => imported.has(k) && notes[k].fingerprint && sameGame(notes[k].fingerprint, n.fingerprint!));
    if (target) {
      const here = notes[target];
      const wins = prefer === 'theirs' || (prefer !== 'mine' && (n.edited ?? 0) > (here?.edited ?? 0));
      if (!hasWords(here) || wins) notes[target] = { ...here, ...n, source: here?.source ?? n.source, fingerprint: here?.fingerprint ?? n.fingerprint };
      continue;
    }
    if (!n.fingerprint || !hasWords(n)) continue;
    addRemoved(removed, {
      id,
      name: name || 'Imported game',
      source: n.source,
      fingerprint: n.fingerprint,
      rating: n.rating,
      note: n.note,
      removed: n.edited ?? 0,
    });
  }
  return { notes, removed };
}

/** Adds a removed record, in place of an older one of the same game. */
function addRemoved(list: Removed[], r: Removed): void {
  const i = list.findIndex((x) => x.id === r.id || sameGame(x.fingerprint, r.fingerprint));
  if (i < 0) list.push(r);
  else if (r.removed > list[i].removed && !(list[i].note === r.note && list[i].rating === r.rating)) list[i] = r;
}

export const notes: Section<NotesPayload> = {
  id: 'notes',
  title: 'Imported games’ notes and ratings',
  short: 'Imported games’ notes',
  description: 'Your stars and notes on imported games, and the records of ones you removed. Not the games themselves.',
  unit: ['note', 'notes'],
  extract(w) {
    const p = readNotes(w);
    const named: Record<string, Note> = {};
    for (const [id, n] of Object.entries(p.notes)) {
      const rec = w.stores.projects[id];
      named[id] = isRecord(rec) && typeof rec.name === 'string' ? { ...n, name: rec.name } : n;
    }
    return { notes: named, removed: p.removed };
  },
  count: (p) => Object.values(p.notes).filter(hasWords).length + p.removed.length,
  validate(raw) {
    need(isRecord(raw) && isRecord(raw.notes) && Array.isArray(raw.removed), 'notes');
    for (const n of Object.values(raw.notes)) need(isRecord(n) && (n.fingerprint === undefined || isPrint(n.fingerprint)), 'notes');
    for (const r of raw.removed) need(isRecord(r) && typeof r.id === 'string' && typeof r.removed === 'number' && isPrint(r.fingerprint), 'removed games');
    return raw as unknown as NotesPayload;
  },
  merge: (mine, theirs, ctx) => place(strip(mine), theirs, ctx.world, ctx.prefer),
  replace: (theirs, ctx) => place({ notes: {}, removed: [] }, theirs, ctx.world, 'theirs'),
  inject(w, _mine, next) {
    const clean = strip(next);
    if (Object.keys(clean.notes).length) w.local[NOTES] = JSON.stringify(clean.notes);
    else delete w.local[NOTES];
    if (clean.removed.length) w.local[REMOVED] = JSON.stringify(clean.removed);
    else delete w.local[REMOVED];
  },
  describe(mine, next) {
    const a = strip(mine);
    const b = strip(next);
    const changed = Object.keys(b.notes).filter((id) => JSON.stringify(a.notes[id]) !== JSON.stringify(b.notes[id])).length;
    const gone = Object.keys(a.notes).filter((id) => !(id in b.notes)).length;
    const removedDiff = b.removed.length - a.removed.length;
    const out: string[] = [];
    if (changed) out.push(`Sets ${plural(changed, ['note or rating', 'notes and ratings'])}`);
    if (gone) out.push(`Removes ${plural(gone, ['note', 'notes'])}`);
    if (removedDiff > 0) out.push(`Adds ${plural(removedDiff, ['removed game’s record', 'removed games’ records'])}`);
    if (removedDiff < 0) out.push(`Removes ${plural(-removedDiff, ['removed game’s record', 'removed games’ records'])}`);
    return out;
  },
};

/** Notes without the names a backup adds. */
function strip(p: NotesPayload): NotesPayload {
  return { notes: Object.fromEntries(Object.entries(p.notes).map(([id, { name: _name, ...n }]) => [id, n])), removed: p.removed };
}
