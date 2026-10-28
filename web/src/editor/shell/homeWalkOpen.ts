// What the home page's Make a walkthrough (homeWalk.ts) loads when first used, so the home
// page's first load carries none of the walkthrough bot: the game as a project to walk (yours
// from this browser; a CD game look-only, as Look inside loads it, keeping its walkthrough in
// this browser apart from its files) and the walkthrough made of it so far.
import { toast } from '../core/ui';
import { Project } from '../core/project';
import { makeReadOnly } from '../core/readOnly';
import { GameFiles } from '../../project/files';
import { loadProject } from '../../project/storage';
import { getSection } from '../../project/companion';
import { keepLookOnly, keptFor, WALK_SECTION, type SavedWalk } from '../check/walk/keptWalk';
import type { WalkDialogOptions } from '../widgets/walkDialog';
import type { HomeGame } from './homeCards';
import { lookId } from './lookId';

export { WALK_SECTION, type SavedWalk };

interface Loaded {
  project: Project;
  opt: WalkDialogOptions;
}

/** The game as a project to walk: yours from this browser, a CD game look-only. */
export async function load(game: HomeGame): Promise<Loaded | undefined> {
  if (game.project) {
    const stored = await loadProject(game.project.id);
    if (!stored) return undefined;
    const project = Project.fromFiles(stored.files, stored.record.name, game.project.id, stored.record.companion);
    project.gam = stored.record.gam;
    return { project, opt: { home: true } };
  }
  const e = game.entry;
  if (!e?.gam) return undefined;
  const [files, { catalogCompanion }] = await Promise.all([game.files(), import('../../dosPlayer/catalogPatches')]);
  const project = Project.fromFiles(new GameFiles(files.entries().map(([n, b]) => [n, b.slice()])), e.title, lookId(e.id), catalogCompanion(e, e.gam));
  project.gam = e.gam;
  makeReadOnly(project, { title: e.title, attempted: (what) => toast(`${e.title} is open to look at only: ${what} was not changed.`) });
  const kept = keepLookOnly(project, e);
  return { project, opt: { home: true, entry: e, keeps: kept.keeps } };
}

/** The walkthrough the bot made of it, if one is kept. */
export function madeWalk(game: HomeGame): SavedWalk | undefined {
  if (game.project) {
    const c = game.project.companion;
    return c ? getSection<SavedWalk | undefined>(c, game.project.gam, WALK_SECTION, undefined) : undefined;
  }
  return game.entry ? (keptFor(game.entry)?.[WALK_SECTION] as SavedWalk | undefined) : undefined;
}
