// Pieces that are the same in every box they come in (the Library lists each once, with how many
// boxes it is in, and opens the first). Decided per piece by what it is drawn from, not by its
// kind: of the paper every Sandbox Software box gets (manual/printables/gen.ts), only these use
// nothing of the game they are packed with.
// - The BBS ad: bbsAd() takes no game at all.
// - The Sandbox Software catalog: catalog(ctx) lists the whole family; the game it is packed with
//   only gets its entry marked (the `this` class), so the words and pictures are the same.
// The Game-Maker box packs the same two (gmItems.ts). Everything else names its game: the key
// card its keys, the registration card and the license its title, the newsletter its issue, the
// sticker sheet and hint book postcard its own art and book. shared.test.ts checks the claim
// against gen.ts.
import { SHARED_OWNER, type ShelfItem } from './shelf';

/** Box pieces (by id, in a game's box or the Game-Maker box) that are the same in every box. */
export const SAME_IN_EVERY_BOX: ReadonlySet<string> = new Set(['catalog', 'bbs']);

/** The piece's id in its box: the part of its key after the owner. */
const pieceId = (i: ShelfItem) => i.key.slice(i.key.indexOf(':') + 1);

/**
 * The shelf with each piece that is the same in several boxes listed once, where it is first
 * listed (and opened from there), counting the boxes it is in.
 */
export function mergeShared(items: readonly ShelfItem[]): ShelfItem[] {
  const first = new Map<string, ShelfItem>();
  const count = new Map<string, number>();
  for (const i of items) {
    if (i.open.via !== 'box' && i.open.via !== 'gm') continue;
    const id = pieceId(i);
    if (!SAME_IN_EVERY_BOX.has(id)) continue;
    if (!first.has(id)) first.set(id, i);
    count.set(id, (count.get(id) ?? 0) + 1);
  }
  const out: ShelfItem[] = [];
  for (const i of items) {
    const id = pieceId(i);
    const n = count.get(id) ?? 0;
    if (n < 2 || (i.open.via !== 'box' && i.open.via !== 'gm')) out.push(i);
    else if (first.get(id) === i) out.push({ ...i, owner: SHARED_OWNER, ownerTitle: 'In every box', boxes: n });
  }
  return out;
}
