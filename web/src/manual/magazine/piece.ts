// A piece of the paper in a game's box, drawn small for the magazine's `piece` block: for now a
// hint book's cover, made by the same code the box viewer uses (printables/story.ts). Loaded
// when a page with a piece is drawn, so the magazine's own chunk stays light.
import '../printables/paper.css';
import '../printables/items.css';
import { withDetails, type CatalogEntry } from '../../project/files';
import { shotCache, type PrintContext } from '../printables/kit';
import { hintBookCover } from '../printables/story';
import type { HintBookItem } from '../printables/types';

/** The piece's printed sheet (sized by its container), or undefined when the game has none. */
export async function pieceSheet(listed: CatalogEntry, piece: 'hintbook'): Promise<HTMLElement | undefined> {
  const entry = await withDetails(listed);
  const printables = entry.original?.printables ?? {};
  const book = printables.items?.find((i): i is HintBookItem => i.kind === piece);
  if (!book) return undefined;
  const ctx: PrintContext = { entry, family: [], printables, manual: { title: '', pages: [] }, shot: shotCache(entry) };
  return hintBookCover(ctx, book).el;
}
