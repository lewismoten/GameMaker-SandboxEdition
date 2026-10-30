// The asset library: CD resources and public original-game assets, loaded from cached ZIPs.
import { loadCatalog, loadHostedGame, type CatalogEntry, type GameFiles } from '../../project/files';
import { Project, type FileKind } from './project';
import { selectLibraryItems, type LibraryItem, type LibrarySource } from './libraryCatalog';
export type { LibraryItem, LibrarySource } from './libraryCatalog';
import type { ThumbSource } from '../widgets/thumbs';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

let catalog: Promise<CatalogEntry[]> | undefined;
const games = new Map<string, Promise<GameFiles>>();

function sourceCatalog(): Promise<CatalogEntry[]> {
  return (catalog ??= loadCatalog().catch(() => []));
}

/** Ordered assets from the requested source, with matching palettes shown once. */
export async function libraryItems(kind: FileKind, source: LibrarySource = 'cd'): Promise<LibraryItem[]> {
  return selectLibraryItems(await sourceCatalog(), kind, source);
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
  const libraryDefault = item.game.id === 'library' ? files.get('default.pal') : undefined;
  return { files, palette: libraryDefault ? parsePalette(libraryDefault) : p.paletteFor(item.name).palette };
}
