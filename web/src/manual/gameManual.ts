// The printed manual of an original game (games/<id>/manual.json) and the paper that came
// in its box (games/<id>/printables.json plus generated extras; see printables/README.md):
// the stapled booklet with the box front as its cover, and a "What's in the box" tray.
// A game with no box (openGameMaps) still gets its World Map and Level Maps.
import './booklet.css';
import { h } from '../editor/core/ui';
import type { CatalogEntry } from '../project/files';
import { isSandboxGame, loadCatalog, withDetails } from '../project/files';
import { drawBox } from '../desk/boxes/gameBox';
import { buildBooklet } from './printables/manualPages';
import { openBox } from './printables/viewer';
import { boxItems } from './printables/items';
import { shotCache, type PrintContext } from './printables/kit';

/** Opens the game's manual box; `onReady` hears when it has loaded and is about to show. */
export async function openGameManual(listed: CatalogEntry, coverImage?: string, onReady?: () => void): Promise<void> {
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
    await openBox(title, pages, items);
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
export async function openGameMaps(listed: CatalogEntry, onReady?: () => void): Promise<void> {
  const entry = await withDetails(listed);
  const ctx: PrintContext = { entry, family: [], printables: {}, manual: { title: '', pages: [] }, shot: shotCache(entry) };
  const items = boxItems(ctx).filter((i) => MAP_PIECES.has(i.id));
  onReady?.();
  await openBox(`${entry.title}: maps`, [], items, { trayHeading: 'Maps' });
}
