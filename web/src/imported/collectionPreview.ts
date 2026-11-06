// The counts the import chooser shows before anything is imported: how many games, files and
// bytes a collection holds, and for the ticked ones. No DOM.

export interface PreviewGame {
  fileCount: number;
  bytes?: number;
  /** Files its .gam names that are not here. */
  missing?: number;
}

export interface Totals {
  games: number;
  files: number;
  bytes: number;
  /** Games with files missing, and how many files in all. */
  gamesMissing: number;
  filesMissing: number;
}

/** The totals of some games. */
export function totalsOf(games: PreviewGame[]): Totals {
  const t: Totals = { games: games.length, files: 0, bytes: 0, gamesMissing: 0, filesMissing: 0 };
  for (const g of games) {
    t.files += g.fileCount;
    t.bytes += g.bytes ?? 0;
    if (g.missing) {
      t.gamesMissing++;
      t.filesMissing += g.missing;
    }
  }
  return t;
}

/** "3.4 MB", "820 KB", "512 bytes". */
export function sizeText(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "12 games, 480 files, 6.2 MB; 2 are missing files". */
export function totalsText(t: Totals): string {
  const base = `${plural(t.games, 'game')}, ${plural(t.files, 'file')}, ${sizeText(t.bytes)}`;
  return t.gamesMissing ? `${base}; ${t.gamesMissing} ${t.gamesMissing === 1 ? 'is' : 'are'} missing files (${plural(t.filesMissing, 'file')} in all)` : base;
}
