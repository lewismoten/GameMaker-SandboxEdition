// Opening a project, loaded by main.ts only on a project route. Home has its own dynamic
// entry so looking inside a game never downloads the home page. Editors are further chunks.
import { Project } from './editor/core/project';
import { loadProject } from './project/storage';
import type { Workspace } from './editor/shell/workspace';
import { lookedAt } from './editor/shell/lookId';
import { markUsed } from './project/projectUse';

/** Opens a game saved in this browser in the workspace, or a finished game to look inside; undefined when it is not there. */
export async function openStored(id: string, host: HTMLElement, file?: string): Promise<Workspace | undefined> {
  // a finished game opened to look inside (#/p/look:<id>), never stored here
  const look = lookedAt(id);
  if (look) return (await import('./editor/shell/released')).openReleased(look, host, file);
  const [stored, { Workspace }] = await Promise.all([loadProject(id, { keepCopy: true }), import('./editor/shell/workspace')]);
  if (!stored) return undefined;
  // what the home page's "Continue where you left off" shows
  markUsed(id);
  const project = Project.fromFiles(stored.files, stored.record.name, id, stored.record.companion);
  if (stored.record.gam) project.gam = stored.record.gam;
  const ws = new Workspace(host, project, file);
  // damaged parts were left out and the whole save kept aside (storage.ts); say what is broken
  if (stored.damage.length) void import('./editor/shell/recoverNotice').then((m) => m.recoverNotice(project, stored.damage));
  return ws;
}
