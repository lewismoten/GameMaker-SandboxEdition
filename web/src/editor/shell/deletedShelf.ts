// The home page's side of Recently deleted (project/recentlyDeleted.ts): putting a game on the
// shelf just before it is deleted, bringing one back with what the home page remembers about it
// (where it came from, Imported or My games, its import, its rating and note), and the count that
// shows or hides the "Recently deleted…" button.
import { loadRecord, putRecord } from '../../project/storage';
import { browserShelf, keepDeleted, listDeleted, restoreDeleted } from '../../project/recentlyDeleted';
import { secretsRevealed } from '../../project/secretGames';
import { isImported, originId, rememberOrigin, setImported } from './homeOrigin';
import { batchOf, markBatch } from './importBatch';

/** Keeps the game on the shelf; call before deleting it. Never throws: the game is then deleted as before. */
export async function shelve(id: string): Promise<void> {
  try {
    const record = await loadRecord(id);
    if (!record) return;
    await keepDeleted(browserShelf, { id, record, imported: isImported(id), origin: originId(id), batch: batchOf(id) });
  } catch {
    /* no room, or no storage: deleted without a week's grace */
  }
}

/** The games on the shelf that may be listed now. */
export async function shelfList() {
  return listDeleted(browserShelf, await secretsRevealed().catch(() => 0));
}

/** Brings a game back as it was, with what the home page remembered of it. Resolves to its name; undefined when not kept. */
export async function bringBack(id: string): Promise<string | undefined> {
  const g = await restoreDeleted(browserShelf, id, async (kept) => {
    await putRecord(kept.record);
    rememberOrigin(id, kept.origin);
    setImported(id, kept.imported);
    if (kept.batch) markBatch([id], kept.batch);
    if (kept.imported) (await import('../../imported/noteMoves')).undoRemoval(id);
  });
  return g?.name;
}
