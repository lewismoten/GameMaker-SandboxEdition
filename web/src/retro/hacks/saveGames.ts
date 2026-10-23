// The games SAVEHACK.EXE and BACKUP.EXE on the desk PC work on: every catalog game (the CD's,
// the BBS's shareware, the originals; secret ones only once revealed, as loadCatalog lists them)
// and your own games, each by its save id ('game:<id>', 'project:<id>') and an 8.3-style DOS
// name (TEDDY, ORB…) to type on the command line.
import { listProjects, loadProject, loadSaveData } from '../../project/storage';
import { loadHostedGame, type CatalogEntry, type GameFiles } from '../../project/files';
import { dosDirName } from '../dos/hardDisk';

export interface HackGame {
  /** Save id: 'game:<catalog id>' or 'project:<id>'. */
  save: string;
  /** Catalog id or project id. */
  id: string;
  /** Up to 8 letters, upper case, unique in the list. */
  dos: string;
  title: string;
  gam?: string;
  catalog?: CatalogEntry;
  projectId?: string;
}

export interface GameWithSaves extends HackGame {
  files: Record<string, Uint8Array>;
  bytes: number;
}

/** A catalog game's DOS name: its program's (ORB.EXE → ORB), else its .gam's, else its id. */
export function catalogDosName(g: Pick<CatalogEntry, 'id' | 'exe' | 'gam'>): string {
  return dosDirName(g.exe ?? g.gam ?? g.id);
}

/** Every game that could have saves, catalog games first, with unique DOS names. */
export async function hackGames(catalog: CatalogEntry[]): Promise<HackGame[]> {
  const out: HackGame[] = [];
  const taken = new Set<string>();
  const unique = (name: string) => {
    let dos = name;
    for (let i = 1; taken.has(dos); i++) dos = `${name.slice(0, 8 - String(i).length)}${i}`;
    taken.add(dos);
    return dos;
  };
  for (const g of catalog) if (g.gam) out.push({ save: `game:${g.id}`, id: g.id, dos: unique(catalogDosName(g)), title: g.title, gam: g.gam, catalog: g });
  // your own games ('hd-' ones are your copies of installed games: they play as the catalog game)
  const projects = await listProjects().catch(() => []);
  for (const p of projects) {
    if (p.id.startsWith('hd-')) continue;
    out.push({ save: `project:${p.id}`, id: p.id, dos: unique(dosDirName(p.gam)), title: p.name, gam: p.gam, projectId: p.id });
  }
  return out;
}

/** The games that have save files now (in list order). */
export async function gamesWithSaves(games: HackGame[]): Promise<GameWithSaves[]> {
  return (await gamesAndSaves(games)).filter((g) => Object.keys(g.files).length);
}

/** Every game with what it has saved (maybe nothing): SAVEHACK can start a save in any of them. */
export async function gamesAndSaves(games: HackGame[]): Promise<GameWithSaves[]> {
  return Promise.all(
    games.map(async (g) => {
      const files = await loadSaveData(g.save);
      const bytes = Object.values(files).reduce((n, b) => n + b.length, 0);
      return { ...g, files, bytes };
    }),
  );
}

/** A game by what was typed: its DOS name, its id or its save id (any case). */
export function findGame<T extends HackGame>(games: T[], name: string): T | undefined {
  const want = name.trim().toUpperCase().replace(/\.(EXE|GAM)$/, '');
  if (!want) return undefined;
  return games.find((g) => g.dos === want) ?? games.find((g) => g.id.toUpperCase() === want || g.save.toUpperCase() === want);
}

/** The game's own files (for item and level names), or undefined when they can't be had. */
export async function gameFilesOf(g: HackGame): Promise<GameFiles | undefined> {
  try {
    if (g.catalog) return await loadHostedGame(g.catalog);
    if (g.projectId) return (await loadProject(g.projectId))?.files;
  } catch {
    /* offline: numbers only */
  }
  return undefined;
}
