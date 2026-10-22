// Game folders on the retro PC's hard disk, C:\GM\<GAME>: the games installed with
// Game-Maker (runtime/run/GM) and your own games. Installed games are writable, as on
// a real hard disk: the first change saves your copy over the installed one (kept in
// this browser), and Utilities > Restore puts the original back.
import { Project } from '../../editor/core/project';
import { GameFiles, loadHostedGame, type CatalogEntry } from '../../project/files';
import { deleteProject, listProjects, loadProject } from '../../project/storage';
import { newGame, serializeGame } from '../../formats/game';

export interface HdGame {
  /** Folder name under C:\GM (8.3, upper case). */
  dir: string;
  title: string;
  /** installed: came with Game-Maker; project: one of yours. */
  source: 'installed' | 'project';
  projectId?: string;
  catalog?: CatalogEntry;
  /** Date.now() when your copy was last saved (none for an installed game as shipped). */
  updated?: number;
}

/** Your copy of an installed game is stored as a project with this id. */
const installedId = (catalogId: string) => `hd-${catalogId}`;

export function dosDirName(name: string): string {
  return (name.toUpperCase().replace(/\.[^.]*$/, '').replace(/[^A-Z0-9_]/g, '') || 'GAME').slice(0, 8);
}

/** The folders in C:\GM, given the installed folder names (from the C:\GM listing). */
export async function hardDiskGames(catalog: CatalogEntry[], installedDirs: string[]): Promise<HdGame[]> {
  const games: HdGame[] = [];
  const taken = new Set<string>();
  const projects = await listProjects().catch(() => []);
  for (const d of installedDirs) {
    const g = catalog.find((c) => c.id === d.toLowerCase() && c.gam);
    if (!g) continue;
    const changed = projects.find((p) => p.id === installedId(g.id));
    games.push({ dir: d.toUpperCase(), title: g.title, source: 'installed', catalog: g, updated: changed?.updated });
    taken.add(d.toUpperCase());
  }
  for (const p of projects) {
    if (p.id.startsWith('hd-')) continue; // shown as the installed folder it replaces
    let dir = dosDirName(p.gam);
    for (let i = 1; taken.has(dir); i++) dir = `${dir.slice(0, 8 - String(i).length)}${i}`;
    taken.add(dir);
    games.push({ dir, title: p.name, source: 'project', projectId: p.id, updated: p.updated });
  }
  return games.sort((a, b) => a.dir.localeCompare(b.dir));
}

/** The files currently in a game folder (your saved copy if an installed game was changed). */
export async function hdFiles(g: HdGame): Promise<GameFiles> {
  if (g.source === 'project') return (await loadProject(g.projectId!))?.files ?? new GameFiles();
  const override = await loadProject(installedId(g.catalog!.id));
  return override ? override.files : loadHostedGame(g.catalog!);
}

export async function isModified(g: HdGame): Promise<boolean> {
  return g.source === 'installed' && !!(await loadProject(installedId(g.catalog!.id)));
}

/** The project behind a folder, creating your copy of an installed game on first use. */
export async function hdProject(g: HdGame): Promise<Project> {
  const id = g.source === 'project' ? g.projectId! : installedId(g.catalog!.id);
  const stored = await loadProject(id);
  if (stored) {
    const p = Project.fromFiles(stored.files, stored.record.name, id);
    p.gam = stored.record.gam;
    return p;
  }
  const files = await loadHostedGame(g.catalog!);
  const p = Project.fromFiles(files, g.title, id);
  p.gam = g.catalog!.gam!;
  await p.saveNow();
  return p;
}

/** Puts an installed game back the way it came off the CD. */
export async function restoreInstalled(g: HdGame): Promise<void> {
  if (g.source === 'installed') await deleteProject(installedId(g.catalog!.id));
}

/** MD C:\GM\NAME: a new, empty game folder (with a starting .gam). */
export async function makeGameFolder(dir: string, title = dir): Promise<Project> {
  const files = new GameFiles();
  const gam = `${dosDirName(dir).toLowerCase()}.gam`;
  files.set(gam, serializeGame(newGame(title)));
  const p = Project.fromFiles(files, title);
  p.gam = gam;
  await p.saveNow();
  return p;
}
