// A game opened only to look inside (a finished game from the home page, as released): the
// one place its changes are refused. Every way the editors change a project goes through
// Project (files.set/delete, saveGame, setExtras, renameExtras, autosave); once a project is
// made read-only here, each of those asks `refuse` first, before anything changes, and
// nothing is ever written to this browser's storage. What happens next (a dialog offering a
// copy) is the shell's (editor/shell/released.ts); this file has no DOM.
import type { Project } from './project';
import type { GameFiles } from '../../project/files';

/** Thrown where a change was refused, so the rest of that change (a rename's delete, say) never runs. */
export class ReadOnlyError extends Error {
  constructor(what: string) {
    super(`This game is open to look at only: ${what} was not changed.`);
    this.name = 'ReadOnlyError';
  }
}

/**
 * Companion sections (project/companion.ts) a look-only game may still keep, in memory only:
 * what the Level check, its heat maps, play sessions and Make a walkthrough find, and the sound
 * editor's Fit choice (which only steers its PC speaker preview), and the walking paths the
 * walkthrough bot keeps to (check/walk/walkPaths.ts). They describe the game or how it is looked
 * at or walked rather than change it, and are gone when the page closes.
 */
export const MEMORY_SECTIONS: readonly string[] = [
  'levelCheck',
  'myHeat',
  'acceptedFindings',
  'sameEverySide',
  'myPlays',
  'botRoutes',
  'walkthrough',
  'uploadChecklist',
  'speakerFit',
  'walkPaths',
];

export interface ReadOnlyGuard {
  /** The game's name, as released. */
  readonly title: string;
  /** Told (before ReadOnlyError is thrown) that something tried to change `what` (a file name, or "file: section"). */
  attempted(what: string): void;
}

/** Makes `project` refuse every change from now on; `guard` hears of each attempt. */
export function makeReadOnly(project: Project, guard: ReadOnlyGuard): void {
  project.readOnly = guard;
  project.files.guard = (name) => refuse(project, name);
}

/** Tells the guard and throws: called before a change is made. */
export function refuse(project: Project, what: string): never {
  project.readOnly?.attempted(what);
  throw new ReadOnlyError(what);
}

/** True for an error that only says a look-only game refused a change (nothing to report). */
export const isReadOnlyError = (e: unknown): e is ReadOnlyError => e instanceof ReadOnlyError;

/**
 * Puts back any file an editor changed in place (its bytes edited before the refused set) or
 * otherwise differs from `original`, without asking the guard; the game's parsed copy is dropped too.
 */
export function restoreFiles(project: Project, original: GameFiles): void {
  const guard = project.files.guard;
  project.files.guard = undefined;
  try {
    for (const [name, bytes] of original.entries()) {
      const now = project.files.get(name);
      if (!now || !sameBytes(now, bytes)) project.files.set(name, bytes.slice());
    }
    for (const name of project.files.names()) if (!original.has(name)) project.files.delete(name);
  } finally {
    project.files.guard = guard;
  }
  project.forgetParsed();
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
