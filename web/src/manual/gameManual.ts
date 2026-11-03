// The printed manual of an original game (games/<id>/manual.json) and the paper that came
// in its box (games/<id>/printables.json plus generated extras; see printables/README.md):
// the stapled booklet with the box front as its cover, and a "What's in the box" tray.
// A game with no box (openGameMaps) still gets its World Map and Level Maps.
import './booklet.css';
import { h } from '../editor/core/ui';
import type { CatalogEntry } from '../project/files';
import { isSandboxGame, loadCatalog, loadGameList, withDetails } from '../project/files';
import { drawBox } from '../desk/boxes/gameBox';
import { buildBooklet } from './printables/manualPages';
import { openBox } from './printables/viewer';
import type { PickerGame } from './printables/gamePicker';
import { boxItems } from './printables/items';
import { shotCache, type PrintContext } from './printables/kit';

/** The games whose boxes the Game picker lists: the shelf's (desk/boxes/shelf.ts), in its order, with no secret game that isn't listed. */
async function shelfGames(): Promise<PickerGame[]> {
  const list = await loadGameList().catch(() => [] as CatalogEntry[]);
  return list.filter((g) => g.original?.box && g.original.manual).map((g) => ({ id: g.id, title: g.title }));
}

/**
 * Opens the game's manual box (at the piece `start` names, else the manual); `onReady` hears when it has loaded and is about to show.
 * The bar's Game picker swaps to another game's box at the same kind of piece (`onGame` hears which, for the address).
 */
export async function openGameManual(
  listed: CatalogEntry,
  coverImage?: string,
  onReady?: () => void,
  start?: string,
  onGame?: (id: string) => void,
): Promise<void> {
  const games = await shelfGames();
  let next: { id: string; piece: string } | undefined = { id: listed.id, piece: start ?? '' };
  let first = true;
  while (next) {
    const { id, piece } = next;
    next = undefined;
    const entry = first ? listed : ((await loadGameList().catch(() => [] as CatalogEntry[])).find((g) => g.id === id) ?? listed);
    await openOne(entry, first ? coverImage : undefined, first ? onReady : undefined, piece || undefined, games, (to, at) => (next = { id: to, piece: at }));
    if (next) onGame?.((next as { id: string }).id);
    first = false;
  }
}

async function openOne(
  listed: CatalogEntry,
  coverImage: string | undefined,
  onReady: (() => void) | undefined,
  start: string | undefined,
  games: PickerGame[],
  onGame: (id: string, piece: string) => void,
): Promise<void> {
  const entry = await withDetails(listed); // a listed entry holds only the manual's title
  const manual = entry.original?.manual;
  if (!manual) return;
  const title = manual.title || `${entry.title} Manual`;
  const cover = coverImage ?? (await drawBox(entry).catch(() => undefined))?.front;
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const pages = await buildBooklet(entry, cover, host);
    const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter(isSandboxGame);
    const ctx: PrintContext = { entry, family, printables: entry.original?.printables ?? {}, manual, shot: shotCache(entry) };
    const items = boxItems(ctx);
    onReady?.();
    const epub = { file: `${entry.id}-manual.epub`, make: () => import('./epub/manualBook').then((m) => m.manualBook(entry)) };
    await openBox(title, pages, items, { start, epub, games, gameId: entry.id, onGame });
  } finally {
    host.remove();
  }
}

/** The pieces a game without a box can still have: the fold-out World Map and its Level Maps. */
const MAP_PIECES = new Set(['worldmap', 'levelmaps']);

/**
 * A boxless game's maps (the Bard of Bizarre's song-games come on a disk, with no manual or
 * box): the World Map and Level Maps, in the same viewer, with nothing else.
 */
export async function openGameMaps(listed: CatalogEntry, onReady?: () => void, start?: string): Promise<void> {
  const entry = await withDetails(listed);
  const ctx: PrintContext = { entry, family: [], printables: entry.original?.printables ?? {}, manual: { title: '', pages: [] }, shot: shotCache(entry) };
  const items = boxItems(ctx).filter((i) => MAP_PIECES.has(i.id));
  onReady?.();
  await openBox(`${entry.title}: maps`, [], items, { trayHeading: 'Maps', start });
}
