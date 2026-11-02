// Saved games made before an optimization hold the old block, monster and picture numbers
// (PLAYGAME.C:1836-1890 restores what scenes remember), so they can draw wrong afterward. The
// dialog warns once and goes on if the person says so (the default is a warning, not a refusal).
import { loadSaveData } from '../../project/storage';
import { confirmDialog } from '../core/ui';
import type { Project } from '../core/project';

/** The saved-game files (game0.sav...) the project has. */
export async function savedGames(project: Pick<Project, 'id'>): Promise<string[]> {
  try {
    return Object.keys(await loadSaveData(`project:${project.id}`)).filter((n) => /^game\d\.sav$/i.test(n));
  } catch {
    return [];
  }
}

/** True to go on: there are no saved games, or the person accepted the warning. */
export async function confirmSaves(project: Pick<Project, 'id'>): Promise<boolean> {
  const saves = await savedGames(project);
  if (!saves.length) return true;
  return confirmDialog(
    'Saved games exist',
    `This game has ${saves.length === 1 ? 'a saved game' : `${saves.length} saved games`} made before this change. Saved games remember blocks and monsters by number, so after renumbering they can show the wrong pictures. Starting new games is safe. Go on anyway?`,
    'Go on',
  );
}
