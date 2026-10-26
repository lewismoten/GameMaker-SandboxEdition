// What the rest of the site calls, one line where something happens:
//   unlockAchievement('desk-hexedit'), progress('heart-all', 3, 24), tally('export-all', 'mac'),
//   notePlayed(saveId), noteWatched(gameId), editedFile(name).
// See catalog.ts for the ids, store.ts for how they are kept, start.ts for the gm-achievement event.
import type { Session } from '../engine/scene';
import { EDIT_KINDS } from './editKinds';
import { noteFinished, notePlayed, noteWatched } from './goals';
import { tally, unlockAchievement } from './store';

export { unlockAchievement, progress, tally } from './store';

/** A walkthrough played to its end. */
export function watchedWalkthrough(gameId: string): void {
  unlockAchievement('watch-one');
  void noteWatched(gameId);
}

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
 * Places in a catalog game worth a note of their own, by the game's id and a scene's name (its
 * desc, steadier than its number): entering the scene unlocks `id`, or counts the name's first
 * group toward it. `won` counts toward it when the game is finished.
 */
export const GAME_SPOTS: { game: string; scene: RegExp; id: string; won?: string }[] = [
  { game: 'blaster', scene: /^3c the big name$/i, id: 'blaster-big-name' },
  // a chapter-done page for each of the first three; the fourth ends the game
  { game: 'brief', scene: /^chapter (\d) done$/i, id: 'brief-chapters', won: '4' },
];

/** What entering scene `desc` of catalog game `game` (or finishing it, when `won`) unlocks or counts. */
export function gameSpot(game: string | undefined, desc: string | undefined, won = false): void {
  const id = game?.replace(/^game:/, '');
  for (const s of GAME_SPOTS) {
    if (s.game !== id) continue;
    if (won) {
      if (s.won) tally(s.id, s.won);
      continue;
    }
    const m = desc ? s.scene.exec(desc.trim()) : null;
    if (m) m[1] ? tally(s.id, m[1]) : unlockAchievement(s.id);
  }
}

/**
 * Options for mountPlayer on a page that plays games of this site (the play page, the desk):
 * a level entered counts as played, the Game Won scene as finished (never during a demo), and
 * a few scenes count for themselves (GAME_SPOTS). A bundled game (a downloaded app) or one of
 * your own gets none of the last.
 */
export function playAchievements(saveId: string | undefined): { onSession?: (s: Session) => void; onScene?: (scene: number) => void } {
  if (saveId?.startsWith('bundle:')) return {};
  let session: Session | undefined;
  let counted = false;
  return {
    onSession: (s) => (session = s),
    onScene: (scene) => {
      if (!session || session.rec.playing) return;
      const catalogGame = saveId?.startsWith('project:') ? undefined : saveId;
      if (scene === 1) {
        unlockAchievement('play-finish');
        void noteFinished(saveId);
        gameSpot(catalogGame, undefined, true);
        return;
      }
      if (!counted) {
        counted = true;
        unlockAchievement('play-first');
        void notePlayed(saveId);
      }
      gameSpot(catalogGame, session.game.scenes[scene]?.desc);
    },
  };
}

/** A game being played wrote a file: a saved game counts. */
export function playWrote(saveId: string | undefined, name: string): void {
  if (!saveId?.startsWith('bundle:') && /^game\d\.sav$/i.test(name)) unlockAchievement('play-save');
}

/** The desk PC ran a program (ProgramRef kinds, retro/dos/vfs.ts). */
export function deskProgram(kind: string): void {
  const id = DESK_PROGRAMS[kind];
  if (id) unlockAchievement(id);
}

const DESK_PROGRAMS: Record<string, string> = {
  gm: 'desk-gm',
  hexedit: 'desk-hexedit',
  savehack: 'desk-savehack',
  backup: 'desk-backup',
  gmcrack: 'desk-gmcrack',
  egg: 'desk-egg',
  achieve: 'desk-achieve',
};
