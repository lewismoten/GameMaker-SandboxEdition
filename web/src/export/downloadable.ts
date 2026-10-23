// Which of the catalog's games may be downloaded (Download → Windows, Mac, Linux, Web or
// DOS), in one place for the web app's Download button (editor/shell/download.ts) and the
// release scripts (scripts/macDmg.ts, winExe.ts, linuxTar.ts), so they cannot drift apart:
//
// - this project's own games (the Sandbox and Bard of Bizarre games, `original`), which are
//   free to share (MIT License);
// - the samples Recreational Software Designs made for Game-Maker itself.
//
// The other authors' games on the CD (A-J Games, GameLynk, KD Software and the shareware)
// remain theirs and are offered play-only, so they have no download.
import type { CatalogEntry } from '../project/files';

export const RSD_COMPANY = 'Recreational Software Designs';

export function catalogDownloadable(e: Pick<CatalogEntry, 'gam' | 'kind' | 'original' | 'company'>): boolean {
  if (!e.gam) return false;
  if (e.original) return true;
  return e.kind === 'gameware' && e.company === RSD_COMPANY;
}
