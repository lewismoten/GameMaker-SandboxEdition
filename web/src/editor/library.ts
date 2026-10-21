// The library: the free sample games ("gameware") from the Game-Maker CD, whose pictures,
// blocks, monsters, sounds and music anyone may reuse in their own games.
import { loadCatalog, loadHostedGame, type CatalogEntry, type GameFiles } from '../project/files';
import { Project, kindOf, type FileKind } from './core/project';
import type { ThumbSource } from './thumbs';

export interface LibraryItem {
  game: CatalogEntry;
  name: string;
  size: number;
}

let catalog: Promise<CatalogEntry[]> | undefined;
const games = new Map<string, Promise<GameFiles>>();

function gameware(): Promise<CatalogEntry[]> {
  return (catalog ??= loadCatalog()
    .then((c) => c.filter((g) => g.kind === 'gameware'))
    .catch(() => []));
}

/** Every library file of a kind, game by game. */
export async function libraryItems(kind: FileKind): Promise<LibraryItem[]> {
  const out: LibraryItem[] = [];
  for (const g of await gameware()) g.files.forEach((name, i) => kindOf(name) === kind && out.push({ game: g, name, size: g.sizes?.[i] ?? 0 }));
  return out;
}

/** All the files of a library game (fetched once). */
export function libraryGame(g: CatalogEntry): Promise<GameFiles> {
  let p = games.get(g.id);
  if (!p) {
    p = loadHostedGame(g);
    games.set(g.id, p);
  }
  return p;
}

export async function libraryFile(item: LibraryItem): Promise<Uint8Array> {
  const files = await libraryGame(item.game);
  const b = files.get(item.name);
  if (!b) throw new Error(`${item.name} is missing from ${item.game.title}`);
  return b;
}

/** What a library file's thumbnail needs: its game's files and the palette it is shown with. */
export async function libraryThumbSource(item: LibraryItem): Promise<ThumbSource> {
  const files = await libraryGame(item.game);
  const p = Project.fromFiles(files, item.game.title, `lib-${item.game.id}`);
  return { files, palette: p.paletteFor(item.name).palette };
}
