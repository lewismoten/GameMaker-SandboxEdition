// The Library cards' pictures of things whose first page is a cover: each drawn on its own,
// without laying out the rest (thumbs.ts draws them small). A game's manual and its hint book,
// the Game-Maker Owner's Guide, and TURBO BUTTON's front cover. Each loads its module only when
// its card first comes near the window.
import type { CatalogEntry } from '../project/files';
import type { PrintContext, Sheet } from '../manual/printables/kit';
import type { HintBookItem } from '../manual/printables/types';

/** A game's manual cover, as its booklet's first page (manualCover.ts). */
export async function manualCoverSheet(entry: CatalogEntry): Promise<Sheet | undefined> {
  if (!entry.original?.box) return undefined;
  const [{ manualCover }, { sheet }] = await Promise.all([import('../manual/printables/manualCover'), import('../manual/printables/kit')]);
  const cover = manualCover(entry);
  await cover.ready;
  return sheet(5.5, 8.5, 'mc-thumb', cover.el);
}

/** A hint book's cover alone (hintCover.ts), without flowing its questions onto pages. */
export async function hintCoverSheet(ctx: PrintContext, it: HintBookItem): Promise<Sheet> {
  const { hintBookCover } = await import('../manual/printables/hintCover');
  return hintBookCover(ctx, it);
}

/** The Owner's Guide's cover (gmCover.ts), peeled back on Teddy's game as the guide shows it. */
export async function gmCoverSheet(teddy: CatalogEntry | undefined): Promise<Sheet> {
  const [{ gmCover }, { sheet }, { mapShot }] = await Promise.all([
    import('../manual/printables/gmCover'),
    import('../manual/printables/kit'),
    import('../gfx/gameShots'),
  ]);
  const at = teddy?.original?.box?.shots?.[0];
  const shot = teddy && at ? await mapShot(teddy, at[0], at[1], at[2], 16, 10).catch(() => undefined) : undefined;
  return sheet(5.5, 8.5, 'gm-thumb', gmCover(shot?.toDataURL(), shot ? teddy?.title : undefined));
}

/** The magazine's page size in CSS pixels (a letter page at 96 to the inch, as the viewer lays it out). */
const MAG_W = 816;
const MAG_H = 1056;

/** TURBO BUTTON's front cover: only the cover section's page, drawn as the magazine viewer draws it. */
export async function magazineCoverSheet(entries: readonly CatalogEntry[]): Promise<Sheet | undefined> {
  const [{ COVER }, { magContext, magGames }, { renderPage }, { h }] = await Promise.all([
    import('../manual/magazine/sections/cover'),
    import('../manual/magazine/games'),
    import('../manual/magazine/render'),
    import('../editor/core/ui'),
    import('../manual/magazine/mag.css'),
  ]);
  const games = magGames(entries);
  const page = (await COVER.pages(magContext(games)))[0];
  if (!page) return undefined;
  const byId = new Map(entries.map((e) => [e.id, e]));
  const { el, ready } = renderPage({ ...page, id: 'cover', folio: 1, section: 'cover' }, { where: 'web', entry: (id) => byId.get(id) });
  await ready;
  // laid out at its own size, as the viewer's paper is (thumbs.ts keeps data-layout)
  const paper = h('div', { class: 'lib-mag-paper', dataset: { layout: String(MAG_W) } }, el);
  return { el: paper, w: MAG_W / 96, h: MAG_H / 96 };
}
