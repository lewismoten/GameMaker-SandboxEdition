// Reject a named catalog entry before a native packager starts building it.
import type { CdCatalogEntry } from './cdGames';
import { catalogDownloadable } from '../src/export/downloadable';

export function checkNamedDownload(entry: Pick<CdCatalogEntry, 'id' | 'gam' | 'kind' | 'original' | 'company' | 'series'>): void {
  if (!catalogDownloadable(entry)) throw new Error(`"${entry.id}" is unavailable for download.`);
}
