// Which of the site's games the Pi is playing, from its "SND game <DIR> <GAM>" line: the
// card's folder may be any 8.3 name (DICE, KEYDOORS), so the .GAM file decides, and the
// folder only picks between games whose .gam files share a name (grad.gam, room.gam).
import type { CatalogEntry } from '../project/files';

export type SiteGame = Pick<CatalogEntry, 'id' | 'title' | 'gam' | 'path'> & Partial<Pick<CatalogEntry, 'dosName'>>;

/** The names a game's folder could have on the card: its DOS name, its id, its site folder (upper case, 8 letters). */
function folderNames(g: SiteGame): string[] {
  const folder = g.path.replace(/\/+$/, '').split('/').pop() ?? '';
  return [g.dosName, g.id, folder].filter((n): n is string => !!n).map((n) => n.toUpperCase().slice(0, 8));
}

/** The site's game for the Pi's folder `dir` ("" when unknown) and .GAM file `gam`, or undefined. */
export function findSiteGame<T extends SiteGame>(games: readonly T[], dir: string, gam: string): T | undefined {
  const sameGam = games.filter((g) => g.gam?.toLowerCase() === gam.toLowerCase());
  if (sameGam.length === 1) return sameGam[0];
  const d = dir.toUpperCase();
  const inFolder = d ? sameGam.filter((g) => folderNames(g).includes(d)) : [];
  return inFolder.length === 1 ? inFolder[0] : undefined;
}
