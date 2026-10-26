// PLAYHACK's first screen: your games sorted the way the home page sorts them, so a PC with
// hundreds of imports opens on a short list. Imported games (homeOrigin's mark) go under
// Imported; a copy of a catalog game goes under that game's tab (Gameware, Shareware, Sandbox,
// Bizarre); everything else is Mine.
import { isImported, originId } from '../../editor/shell/homeOrigin';
import { isBizarreGame } from '../../project/bizarre';
import { isSandboxGame, type CatalogEntry } from '../../project/files';

export type HackGroup = 'mine' | 'imported' | 'gameware' | 'shareware' | 'sandbox' | 'bizarre';

/** The groups in the order PLAYHACK lists them, with their names. */
export const HACK_GROUPS: { id: HackGroup; name: string }[] = [
  { id: 'mine', name: 'Mine' },
  { id: 'imported', name: 'Imported' },
  { id: 'gameware', name: 'Gameware copies' },
  { id: 'shareware', name: 'Shareware copies' },
  { id: 'sandbox', name: 'Sandbox copies' },
  { id: 'bizarre', name: 'Bizarre copies' },
];

/** Which group project `id` belongs in, given the catalog. */
export function hackGroupOf(id: string, catalog: readonly CatalogEntry[]): HackGroup {
  if (isImported(id)) return 'imported';
  const from = originId(id);
  const game = from ? catalog.find((g) => g.id === from) : undefined;
  if (!game) return 'mine';
  // as the home page's tabs sort them: Sandbox Software's games ship as shareware too
  if (isBizarreGame(game)) return 'bizarre';
  if (isSandboxGame(game)) return 'sandbox';
  return game.kind === 'shareware' ? 'shareware' : 'gameware';
}
