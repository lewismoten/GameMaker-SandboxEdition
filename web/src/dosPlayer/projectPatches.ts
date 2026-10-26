// A stored project's DOS player patches, read and written straight from IndexedDB (project/
// storage.ts): for the desk PC, whose PLAYHACK.EXE edits them and whose Play shows them, without
// opening the project in the editor.
import { getSection, emptyCompanion, setSection } from '../project/companion';
import { loadProject, saveProject } from '../project/storage';
import { PLAYER_SECTION, playerRecord, recordPatches } from './playerRecord';
import type { PlayerPatches } from './patchRules';

/** The project's patches (none when it is gone). */
export async function loadProjectPatches(projectId: string): Promise<PlayerPatches> {
  const p = await loadProject(projectId).catch(() => undefined);
  const c = p?.record.companion;
  return c ? recordPatches(getSection(c, p.record.gam, PLAYER_SECTION, undefined)) : {};
}

/** Replaces the project's patches; false when the project is gone. */
export async function saveProjectPatches(projectId: string, patches: PlayerPatches): Promise<boolean> {
  const p = await loadProject(projectId).catch(() => undefined);
  if (!p) return false;
  const { record, files } = p;
  const companion = record.companion ?? emptyCompanion();
  setSection(companion, record.gam, PLAYER_SECTION, playerRecord(patches));
  await saveProject(record.id, record.name, record.gam, files, companion);
  return true;
}
