// Saves "Make an optimized copy" as a new game in My Games: the steps run on a copy of the files and
// of the editor notes; this game, its checkpoints and its saved games are not touched. The copy
// remembers the same origin and import mark as this game so the home list files it with it.
import { getCheckpoints } from '../../project/checkpoint';
import type { GameFiles } from '../../project/files';
import { listProjects, newId, saveProject } from '../../project/storage';
import type { Project } from '../core/project';
import { isImported, originId, rememberOrigin, setImported } from '../shell/homeOrigin';
import { optimizedName, packedFrom, storeFor } from './optimizedCopy';

type Store = ReturnType<typeof storeFor>;

/** Runs `run` on copies of the files and notes, saves them as a new game, and returns the new game's name. */
export async function makeOptimizedCopy(project: Project, run: (files: GameFiles, store: Store) => void): Promise<string> {
  const files = project.files.copy();
  const store = storeFor(project.companion);
  run(files, store);
  const from = packedFrom(await getCheckpoints(project.id), project.files, project.companion);
  const name = optimizedName(
    project.name,
    from,
    (await listProjects()).map((p) => p.name),
  );
  const id = newId();
  await saveProject(id, name, project.gam, files, store.companion);
  rememberOrigin(id, originId(project.id));
  setImported(id, isImported(project.id));
  return name;
}
