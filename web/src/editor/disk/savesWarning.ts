// Saved games hold block, monster and scene numbers (savesSafe.ts says which steps change them). The
// dialog asks which games have saves so it can keep in-place steps to the ones that can't hurt them.
import { loadSaveData } from '../../project/storage';
import type { Project } from '../core/project';

/** The saved-game files (game0.sav...) the project has. */
export async function savedGames(project: Pick<Project, 'id'>): Promise<string[]> {
  try {
    return Object.keys(await loadSaveData(`project:${project.id}`)).filter((n) => /^game\d\.sav$/i.test(n));
  } catch {
    return [];
  }
}
