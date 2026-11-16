// Public tier identifiers and per-file integrity metadata, shared by build and browser.
import { isStarterGame } from '../project/starter';
import { isBizarreGame } from '../project/bizarre';

export const offlineTiers = {
  core: 'Core',
  starters: 'Starters',
  sandbox: 'Sandbox',
  specials: 'Specials',
  bizarre: 'Bizarre',
  cd: 'CD',
  feelies: 'Feelies & library',
  speech: 'Spoken tour & phone',
  hardware: 'Hardware & native exports',
} as const;
export type OfflineTier = keyof typeof offlineTiers;
export interface OfflineFile {
  path: string;
  wire: number;
  stored: number;
  sha256: string;
  tier: OfflineTier;
}
export interface OfflineManifest {
  version: string;
  shell: string[];
  files: OfflineFile[];
}
export function selectedFiles(files: OfflineFile[], tiers: OfflineTier[]): OfflineFile[] {
  return files.filter((f) => f.tier === 'core' || tiers.includes(f.tier));
}
export interface OfflineGame {
  path: string;
  original?: unknown;
  series?: string;
  company?: string;
}
/** Catalog series determine the game tier, including inventories behind the reveal gate. */
export function gameTier(game: OfflineGame): OfflineTier {
  if (game.series === 'special') return 'specials';
  if (isStarterGame(game)) return 'starters';
  if (isBizarreGame(game)) return 'bizarre';
  return game.original && (game.company ?? 'Sandbox Software') === 'Sandbox Software' ? 'sandbox' : 'cd';
}
/** Expand legacy selections once; current selections may omit Specials independently. */
export function migrateTiers(value: readonly unknown[], version = 1): OfflineTier[] {
  const expanded = value.flatMap((t) =>
    t === 'games' ? ['starters', 'sandbox', 'specials', 'bizarre', 'cd'] : t === 'sandbox' && version < 2 ? ['sandbox', 'specials'] : [t],
  );
  return [...new Set<OfflineTier>(['core', ...expanded.filter((t): t is OfflineTier => typeof t === 'string' && Object.hasOwn(offlineTiers, t))])];
}
export function tierOf(path: string, catalog: OfflineGame[] = []): OfflineTier {
  if (/^(pocket|mac|win|linux)\//.test(path)) return 'hardware';
  if (/^(tour\/.*\.ogg$|phone\/voice\/.*\.ogg$)/.test(path)) return 'speech';
  if (/^(trinkets|laser|magazine|ultimate|credits|extras|cast|videos)\//.test(path)) return 'feelies';
  if (/^games\/shared\//.test(path)) return 'core';
  if (/^games\/.*(?:\.(zip|zpart|gmpak)$|\/walkthrough\.json\.gz$)/.test(path)) {
    const game = catalog.find((g) => path.startsWith(g.path));
    return game ? gameTier(game) : 'cd';
  }
  return 'core';
}
