// A game's version, "major.minor": games/<id>/about.json "version", which scripts/cdGames.ts copies
// into its catalog entry. Only the games made for this project have one (games/kit/versionCheck.ts
// keeps it bumped); the CD's gameware and the shareware don't.
import type { CatalogEntry } from './files';

/** The game's version ("2.0"), or undefined when its entry has none. */
export function gameVersion(g: CatalogEntry): string | undefined {
  const v = (g as { version?: unknown }).version;
  return typeof v === 'string' && /^\d+\.\d+$/.test(v) ? v : undefined;
}
