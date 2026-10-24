// Today's web interface, loaded by main.ts only when it is shown (the desk never downloads
// it). Each editor is a further chunk, loaded when a file of its kind is opened.
import { Project } from './editor/core/project';
import { loadProject } from './project/storage';
import type { Workspace } from './editor/shell/workspace';

export { renderHome } from './editor/shell/home';

/** Opens a game saved in this browser in the workspace; undefined when it is not there. */
export async function openStored(id: string, host: HTMLElement, file?: string): Promise<Workspace | undefined> {
  const [stored, { Workspace }] = await Promise.all([loadProject(id), import('./editor/shell/workspace')]);
  if (!stored) return undefined;
  const project = Project.fromFiles(stored.files, stored.record.name, id, stored.record.companion);
  project.gam = stored.record.gam;
  return new Workspace(host, project, file);
}
