// What the Library's toy box lists (toyBox.ts): the 3D-printable trinkets of every game that has some,
// grouped by game and sorted by title. A secret game is never listed, revealed in this browser or not
// (the same rule the magazine and the credits keep), and a game with no trinket files is left out.
// The desk's shelf lists a game's trinkets with no further gate, so nothing else filters them here.
import type { CatalogEntry } from '../project/files';
import { isOldSecret } from '../project/secretGames';
import type { TrinketItem } from '../desk/boxes/trinketData';

export interface ToyGame {
  id: string;
  title: string;
  items: TrinketItem[];
}

/** The listed games' trinkets, from `load` (the manifest of one game's). */
export async function toyBoxGames(
  entries: readonly Pick<CatalogEntry, 'id' | 'title'>[],
  load: (id: string) => Promise<TrinketItem[]>,
  isSecret: (id: string) => boolean = isOldSecret,
): Promise<ToyGame[]> {
  const seen = new Set<string>();
  const open = entries.filter((e) => !isSecret(e.id) && !seen.has(e.id) && seen.add(e.id));
  const games = await Promise.all(open.map(async (e) => ({ id: e.id, title: e.title, items: await load(e.id).catch(() => []) })));
  return games.filter((g) => g.items.length > 0).sort((a, b) => a.title.localeCompare(b.title));
}
