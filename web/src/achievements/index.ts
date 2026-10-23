// What the rest of the site calls, one line where something happens:
//   unlockAchievement('desk-hexedit'), progress('heart-all', 3, 24), tally('export-all', 'mac'),
//   notePlayed(saveId), noteWatched(gameId), editedFile(name).
// See catalog.ts for the ids, store.ts for how they are kept, start.ts for the gm-achievement event.
import type { Session } from '../engine/scene';
import { EDIT_KINDS } from './catalog';
import { notePlayed } from './goals';
import { tally, unlockAchievement } from './store';

export { unlockAchievement, progress, tally } from './store';
export { notePlayed, noteWatched } from './goals';

/** A file of one of your games was changed: counts its kind (every block set counts as blocks). */
export function editedFile(name: string): void {
  const ext = (/\.([^.]+)$/.exec(name)?.[1] ?? '').toLowerCase();
  // what a designer changes (not a saved game, high scores or a recording written by playing)
  if (!DESIGNED.has(ext)) return;
  unlockAchievement('make-edit');
  const kind = ext === 'mbl' || ext === 'cbl' ? 'bbl' : ext;
  if ((EDIT_KINDS as readonly string[]).includes(kind)) tally('make-every-kind', kind);
}

const DESIGNED = new Set([...EDIT_KINDS, 'mbl', 'cbl', 'gif', 'fli', 'bkd', 'lst', 'cmf', 'voc']);

/** A game was downloaded from the Download chooser (kind as download.ts names it). */
export function downloaded(kind: string): void {
  if (kind === 'files') return unlockAchievement('export-files');
  unlockAchievement(`export-${kind}`);
  tally('export-all', kind);
}

/**
 * Options for mountPlayer on a page that plays games of this site (the play page, the desk):
 * a level entered counts as played, the Game Won scene as finished (never during a demo).
 * A bundled game (a downloaded app) gets none.
 */
export function playAchievements(saveId: string | undefined): { onSession?: (s: Session) => void; onScene?: (scene: number) => void } {
  if (saveId?.startsWith('bundle:')) return {};
  let session: Session | undefined;
  let counted = false;
  return {
    onSession: (s) => (session = s),
    onScene: (scene) => {
      if (!session || session.rec.playing) return;
      if (scene === 1) unlockAchievement('play-finish');
      else if (!counted) {
        counted = true;
        unlockAchievement('play-first');
        void notePlayed(saveId);
      }
    },
  };
}

/** A game being played wrote a file: a saved game counts. */
export function playWrote(saveId: string | undefined, name: string): void {
  if (!saveId?.startsWith('bundle:') && /^game\d\.sav$/i.test(name)) unlockAchievement('play-save');
}
