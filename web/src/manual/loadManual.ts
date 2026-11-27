// Load the manual pages before opening a booklet or a Starter lesson.
import { confirmDialog } from '../editor/core/ui';
import { withDetails, type CatalogEntry } from '../project/files';

export async function loadManual(listed: CatalogEntry): Promise<CatalogEntry | undefined> {
  do {
    try {
      return await withDetails(listed, undefined, { requireManual: true });
    } catch {
      // A retry fetches this game's details again.
    }
  } while (await confirmDialog(listed.title, 'Could not load the manual pages.', 'Retry'));
}
