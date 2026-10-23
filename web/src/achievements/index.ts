// What the rest of the site calls, one line where something happens:
//   unlockAchievement('desk-hexedit'), progress('heart-all', 3, 24), tally('export-all', 'mac'),
//   notePlayed(saveId), noteWatched(gameId), editedFile(name).
// See catalog.ts for the ids, store.ts for how they are kept, start.ts for the gm-achievement event.
import { EDIT_KINDS } from './catalog';
import { tally, unlockAchievement } from './store';

export { unlockAchievement, progress, tally } from './store';
export { notePlayed, noteWatched } from './goals';

/** A file of one of your games was changed: counts its kind (every block set counts as blocks). */
export function editedFile(name: string): void {
  unlockAchievement('make-edit');
  const ext = (/\.([^.]+)$/.exec(name)?.[1] ?? '').toLowerCase();
  const kind = ext === 'mbl' || ext === 'cbl' ? 'bbl' : ext;
  if ((EDIT_KINDS as readonly string[]).includes(kind)) tally('make-every-kind', kind);
}

/** A game was downloaded from the Download chooser (kind as download.ts names it). */
export function downloaded(kind: string): void {
  if (kind === 'files') return unlockAchievement('export-files');
  unlockAchievement(`export-${kind}`);
  tally('export-all', kind);
}
