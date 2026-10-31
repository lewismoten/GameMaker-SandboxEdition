// Call numbers for the Library, in the Tiny Shelf Classification (public domain, CC0), by Lewis
// Moten, github.com/lewismoten/Tiny-Pockets-Press (data/classification-systems.json). Only the few
// codes the Library uses are copied here, in its `code-short-author` format: "614-MAH TED" is a
// Manual & Handbook (614 MAH) from a game whose mark is TED. A game's mark is the first three
// letters of its title; the site's own reading is GMS and the Game-Maker box's papers are RSD.
import { GM_OWNER, SHARED_OWNER, SITE_OWNER, type ShelfGroup, type ShelfItem, type ShelfOrder } from './shelf';

/** The classes used: code and short label (scope notes in the Tiny Shelf data). */
const MANUALS = '614-MAH'; // Manuals & Handbooks
const GAMES = '660-GAM'; // Games: hint books, maps, walkthroughs
const PERIODICALS = '613-IDXC'; // Indexes & Catalogs (periodicals, catalogs)
const VIDEO = '392-VIDA'; // Video Art
const GAME_DEV = '533-GAD'; // Game Development: Game-Maker's own manuals and guides
const EPHEMERA = '023-EPH'; // Ephemera & Vertical Files: cards, labels, boxes, posters

const BY_TYPE: Record<string, string> = {
  manual: MANUALS,
  keys: MANUALS,
  hintbook: GAMES,
  worldmap: GAMES,
  levelmap: GAMES,
  map: GAMES,
  walkthrough: GAMES,
  newsletter: PERIODICALS,
  catalog: PERIODICALS,
  magazine: PERIODICALS,
  guide: GAME_DEV,
  video: VIDEO,
};

/** The three-letter author mark for who an item is from. */
export function authorMark(owner: string, title: string): string {
  if (owner === GM_OWNER) return 'RSD';
  if (owner === SITE_OWNER || owner === SHARED_OWNER) return 'GMS';
  const letters = title.replace(/^(the|a|an)\s+/i, '').replace(/[^A-Za-z]/g, '');
  return letters.slice(0, 3).toUpperCase().padEnd(3, 'X');
}

/** A card's call number, e.g. "614-MAH TED". */
export function callNumber(item: Pick<ShelfItem, 'type' | 'owner' | 'ownerTitle'>): string {
  const own = item.owner === GM_OWNER && (item.type === 'manual' || item.type === 'guide');
  const code = own ? GAME_DEV : (BY_TYPE[item.type] ?? EPHEMERA);
  return `${code} ${authorMark(item.owner, item.ownerTitle)}`;
}

/** A drawer's call number: a game's shelf is Games by its mark, a kind is that kind's class. */
export function drawerCall(g: ShelfGroup, order: ShelfOrder): string {
  const first = g.parts.flatMap((p) => p.items)[0];
  if (order === 'type') return `${first ? callNumber({ ...first, owner: SITE_OWNER }) : `${EPHEMERA} GMS`}`;
  if (g.key === 'other') return `${PERIODICALS} GMS`;
  return `${GAMES} ${authorMark(first?.owner ?? '', g.heading)}`;
}
