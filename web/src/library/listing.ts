// What the Library shows, read from the catalog: each boxed game's manual and the paper in its
// box (manual/printables/items.ts), the Bard of Bizarre's games' maps, the Game-Maker box's
// Owner's Guide and paper (gmItems.ts), and the site's own reading (siteShelf.ts). Each piece
// keeps the way to draw its first sheet, for the card's thumbnail (thumbs.ts). Each game's
// walkthrough is listed too (walkShelf.ts).
import type { CatalogEntry } from '../project/files';
import { isSandboxGame } from '../project/files';
import { isOldSecret } from '../project/secretGames';
import type { BoxItem } from '../manual/printables/viewer';
import type { PrintContext, Sheet } from '../manual/printables/kit';
import { GM_OWNER, SITE_OWNER, shelfGames, typeOfPiece, type ShelfItem } from './shelf';
import { siteShelf } from './siteShelf';
import { mergeShared } from './shared';
import { walkShelf } from './walkShelf';
import { scoopIssue } from '../manual/printables/scoopIssue';
import { scoopDateline } from '../manual/printables/scoopIssues';
import { gmCoverSheet, hintCoverSheet, magazineCoverSheet, manualCoverSheet } from './covers';

export interface Shelf {
  items: ShelfItem[];
  /** Draws a piece's first sheet, by ShelfItem.key (the manuals and the site's pages have none: a cover or an icon instead). */
  thumbs: Map<string, () => Promise<Sheet | undefined>>;
  /** The listed games, by id, for opening their boxes. */
  games: Map<string, CatalogEntry>;
}

/** The pieces a game without a box has (gameManual.ts openGameMaps). */
const MAP_PIECES = new Set(['worldmap', 'levelmaps']);

/**
 * The catalog as the site serves it (games/index.json, as the magazine reads it): it never
 * lists a secret game, and shelfGames drops any an older dev server still lists.
 */
let catalog: Promise<CatalogEntry[]> | undefined;
function loadEntries(): Promise<CatalogEntry[]> {
  catalog ??= fetch('./games/index.json')
    .then((r) => (r.ok ? (r.json() as Promise<CatalogEntry[]>) : []))
    .catch(() => [] as CatalogEntry[])
    .then((list) => {
      if (!list.length) catalog = undefined; // nothing came: ask again next time
      return list;
    });
  return catalog;
}

/** Whether the desk's toy whistle has been picked up (its zine found). */
async function zineFound(): Promise<boolean> {
  try {
    const { loadAchievements } = await import('../achievements/store');
    return !!(await loadAchievements()).unlocked['desk-zine'];
  } catch {
    return false;
  }
}

export async function loadShelf(): Promise<Shelf> {
  const [entries, zine, { boxItems }, { gmBoxItems }, { shotCache }, { levelMaps }] = await Promise.all([
    loadEntries(),
    zineFound(),
    import('../manual/printables/items'),
    import('../manual/printables/gmItems'),
    import('../manual/printables/kit'),
    import('../manual/printables/levelMaps'),
  ]);
  const { boxed, maps } = shelfGames(entries);
  // the walkthroughs' lengths load while the boxes are listed
  const walks = walkShelf([...boxed, ...maps]);
  const family = entries.filter((e) => isSandboxGame(e) && !isOldSecret(e.id));
  const items: ShelfItem[] = [];
  const thumbs = new Map<string, () => Promise<Sheet | undefined>>();
  const games = new Map<string, CatalogEntry>();
  const add = (owner: string, ownerTitle: string, piece: BoxItem, open: ShelfItem['open'], ctx?: PrintContext) => {
    const own = ctx?.printables.items;
    const key = `${owner}:${piece.id}`;
    const ownItem = /^own\d+$/.test(piece.id) ? own?.[Number(piece.id.slice(3))] : undefined;
    // a box's newsletter, numbered as it prints its own number and date (gen.ts newsletter)
    const no = piece.id === 'newsletter' && ctx ? scoopIssue(ctx.entry.id, family) : undefined;
    const issue = no && ctx ? { no, line: `Vol. 1, No. ${no} · ${scoopDateline(ctx.entry.id, ctx.entry.year)}` } : undefined;
    items.push({ key, title: piece.title, note: piece.note, icon: piece.icon, type: typeOfPiece(owner, piece.id, ownItem), owner, ownerTitle, open, issue });
    // the Level Maps: the first level's picture, as the printed maps crop it (its pages are mostly key and captions)
    const levels = piece.id === 'levelmaps' && ctx ? levelMaps(ctx) : undefined;
    // a hint book: just its cover, not every page of questions laid out first
    const book = ownItem?.kind === 'hintbook' && ctx ? ownItem : undefined;
    thumbs.set(key, levels ? () => levels.preview() : book ? () => hintCoverSheet(ctx!, book) : async () => (await piece.render())[0]);
  };

  for (const entry of boxed) {
    const manual = entry.original!.manual!;
    const ctx: PrintContext = { entry, family, printables: entry.original?.printables ?? {}, manual, shot: shotCache(entry) };
    games.set(entry.id, entry);
    items.push({
      key: `${entry.id}:manual`,
      // a manual named just for its game says what it is
      title: manual.title && manual.title !== entry.title ? manual.title : `${entry.title} manual`,
      note: 'The printed manual, stapled',
      icon: '📖',
      type: 'manual',
      owner: entry.id,
      ownerTitle: entry.title,
      open: { via: 'box', game: entry.id, start: 'manual' },
    });
    thumbs.set(`${entry.id}:manual`, () => manualCoverSheet(entry));
    for (const piece of boxItems(ctx)) add(entry.id, entry.title, piece, { via: 'box', game: entry.id, start: piece.id }, ctx);
  }
  for (const entry of maps) {
    const ctx: PrintContext = { entry, family: [], printables: entry.original?.printables ?? {}, manual: { title: '', pages: [] }, shot: shotCache(entry) };
    games.set(entry.id, entry);
    for (const piece of boxItems(ctx).filter((i) => MAP_PIECES.has(i.id)))
      add(entry.id, entry.title, piece, { via: 'box', game: entry.id, start: piece.id, maps: true }, ctx);
  }

  const gmTitle = 'The Game-Maker box';
  items.push({
    key: `${GM_OWNER}:manual`,
    title: 'Game-Maker 3.0 Owner’s Guide',
    note: 'The manual, comb-bound',
    icon: '📘',
    type: 'manual',
    owner: GM_OWNER,
    ownerTitle: gmTitle,
    open: { via: 'gm', start: 'manual' },
  });
  thumbs.set(`${GM_OWNER}:manual`, () => gmCoverSheet(entries.find((e) => e.id === 'teddy')));
  for (const piece of gmBoxItems(family)) add(GM_OWNER, gmTitle, piece, { via: 'gm', start: piece.id });

  const walked = await walks;
  items.push(...walked.items);
  for (const [key, make] of walked.thumbs) thumbs.set(key, make);
  items.push(...siteShelf(zine));
  thumbs.set(`${SITE_OWNER}:magazine`, () => magazineCoverSheet(entries));
  if (zine) thumbs.set(`${SITE_OWNER}:zine`, async () => (await import('../manual/zine/zineItem')).zineCover());
  return { items: mergeShared(items), thumbs, games };
}
