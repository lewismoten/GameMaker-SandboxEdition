// A piece of the paper in a box, drawn small for the magazine's `piece` block: a game's hint
// book cover, made by the same code the box viewer uses (printables/story.ts), or The Ultimate
// Owner's Guide's black and gold cover (ultimate/ultimateItem.ts). Loaded when a page with a
// piece is drawn, so the magazine's own chunk stays light.
import '../printables/paper.css';
import '../printables/items.css';
import { withDetails, type CatalogEntry } from '../../project/files';
import { sheet, shotCache, type PrintContext } from '../printables/kit';
import { hintBookCover } from '../printables/story';
import type { HintBookItem } from '../printables/types';
import { ultimateCover } from '../ultimate/ultimateItem';

/** The piece's printed sheet (sized by its container), or undefined when the game has none. */
export async function pieceSheet(listed: CatalogEntry | undefined, piece: 'hintbook' | 'ultimate'): Promise<HTMLElement | undefined> {
  if (piece === 'ultimate') return sheet(5.5, 8.5, 'ug-thumb', ultimateCover()).el;
  if (!listed) return undefined;
  const entry = await withDetails(listed);
  const printables = entry.original?.printables ?? {};
  const book = printables.items?.find((i): i is HintBookItem => i.kind === piece);
  if (!book) return undefined;
  const ctx: PrintContext = { entry, family: [], printables, manual: { title: '', pages: [] }, shot: shotCache(entry) };
  return hintBookCover(ctx, book).el;
}
