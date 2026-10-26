// The honest note beside this project's own games (the Sandbox and Bard of Bizarre games,
// `original` in the catalog, as downloadable.ts decides): they were made in 2026 and are
// presented as 1990s releases. Only the web side says so (the home page's panel, the
// downloads' About text and page, the web manual); the games' own screens, boxes and disks
// keep their 1990s story. The CD's games by other authors and RSD's samples really are from
// the 1990s and get no note.
import type { CatalogEntry } from '../project/files';

/** The year the Sandbox Edition's own games were made. */
const MADE_YEAR = 2026;

/** "Made in 2026 for Game-Maker: Sandbox Edition; presented as a fictional 1995 release." */
export function fictionNote(e: Pick<CatalogEntry, 'original' | 'year'>): string | undefined {
  if (!e.original) return undefined;
  return `Made in ${MADE_YEAR} for Game-Maker: Sandbox Edition; presented as a fictional ${e.year ?? '1990s'} release.`;
}
