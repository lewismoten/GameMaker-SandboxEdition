// The Library's walkthroughs: one card per listed game whose catalog entry names a walkthrough
// (games/<id>/walkthrough.json), with how long it plays (its timeline's frames at its fps), and
// a picture of the game's title screen. Opening one plays it in the site's walkthrough player.
import type { CatalogEntry } from '../project/files';
import { fetchSiteFile } from '../project/files';
import type { Sheet } from '../manual/printables/kit';
import type { ShelfItem } from './shelf';

/** How long a walkthrough plays, in seconds; undefined when it can't be read. */
async function lengthOf(entry: CatalogEntry): Promise<number | undefined> {
  try {
    const bytes = await fetchSiteFile(entry.walkthrough!, entry.gz);
    if (!bytes) return undefined;
    const tl = (JSON.parse(new TextDecoder().decode(bytes)) as { timeline?: { fps?: number; frames?: number } }).timeline;
    return tl?.fps && tl.frames ? tl.frames / tl.fps : undefined;
  } catch {
    return undefined;
  }
}

/** The game's title screen, as a picture the size of a VGA screen. */
async function titleSheet(entry: CatalogEntry): Promise<Sheet | undefined> {
  const [{ renderTitle }, { sheet }, { h }] = await Promise.all([import('../gfx/gameShots'), import('../manual/printables/kit'), import('../editor/core/ui')]);
  const canvas = h('canvas', { width: 320, height: 200, style: 'display:block;width:100%;height:100%;image-rendering:pixelated' });
  if (!(await renderTitle(entry, canvas).catch(() => false))) return undefined;
  return sheet(4, 2.5, 'walk-thumb', canvas);
}

/** The listed games' walkthroughs (shelfGames chose them: a secret one only once revealed), and their pictures by key. */
export async function walkShelf(games: readonly CatalogEntry[]): Promise<{ items: ShelfItem[]; thumbs: [string, () => Promise<Sheet | undefined>][] }> {
  const withWalk = games.filter((g) => g.walkthrough && g.gam);
  const lengths = await Promise.all(withWalk.map(lengthOf));
  const items: ShelfItem[] = withWalk.map((g, i) => ({
    key: `${g.id}:walkthrough`,
    title: 'Walkthrough',
    note: 'The whole game played start to finish',
    icon: '🎬',
    type: 'walkthrough',
    owner: g.id,
    ownerTitle: g.title,
    open: { via: 'walk', game: g.id },
    seconds: lengths[i],
  }));
  return { items, thumbs: withWalk.map((g) => [`${g.id}:walkthrough`, () => titleSheet(g)]) };
}
