// Today's web interface, loaded by main.ts only when it is shown (the desk never downloads
// it). Each editor is a further chunk, loaded when a file of its kind is opened.
import { Project } from './editor/core/project';
import { loadProject } from './project/storage';
import type { Workspace } from './editor/shell/workspace';
import { lookedAt } from './editor/shell/lookId';
import { markUsed } from './project/projectUse';

export { renderHome } from './editor/shell/home';

/** Opens a game saved in this browser in the workspace, or a finished game to look inside; undefined when it is not there. */
export async function openStored(id: string, host: HTMLElement, file?: string): Promise<Workspace | undefined> {
  // a finished game opened to look inside (#/p/look:<id>), never stored here
  const look = lookedAt(id);
  if (look) return (await import('./editor/shell/released')).openReleased(look, host, file);
  const [stored, { Workspace }] = await Promise.all([loadProject(id), import('./editor/shell/workspace')]);
  if (!stored) return undefined;
  // what the home page's "Continue where you left off" shows
  markUsed(id);
  const project = Project.fromFiles(stored.files, stored.record.name, id, stored.record.companion);
  project.gam = stored.record.gam;
  return new Workspace(host, project, file);
}
