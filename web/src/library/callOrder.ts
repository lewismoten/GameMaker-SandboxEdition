// The Library's order: drawers and the cards in them by call number (tinyShelf.ts), first by the
// three-digit class, then by the author mark (TED before TED2). Cards with the same call number keep
// the order shelf.ts gave them (issues by number, walkthroughs shortest first).
import type { ShelfGroup, ShelfItem, ShelfOrder } from './shelf';
import { callNumber, drawerCall } from './tinyShelf';

/** Compares "614-MAH TED" with "660-GAM TED2": class number, then the mark, digits as numbers. */
export function compareCall(a: string, b: string): number {
  const [ac = '', am = ''] = a.split(' ');
  const [bc = '', bm = ''] = b.split(' ');
  return parseInt(ac, 10) - parseInt(bc, 10) || ac.localeCompare(bc, 'en') || am.localeCompare(bm, 'en', { numeric: true });
}

const sortItems = (items: readonly ShelfItem[]) => {
  const keyed = items.map((it) => [callNumber(it), it] as const);
  return keyed.sort((x, y) => compareCall(x[0], y[0])).map(([, it]) => it); // Array sort is stable
};

/** The groups from `groupShelf`, drawers and then each card in call-number order. */
export function inCallOrder(groups: readonly ShelfGroup[], order: ShelfOrder): ShelfGroup[] {
  const sorted = groups.map((g) => ({ ...g, parts: g.parts.map((p) => ({ ...p, items: sortItems(p.items) })) }));
  const keyed = sorted.map((g) => [drawerCall(g, order), g] as const);
  return keyed.sort((x, y) => compareCall(x[0], y[0])).map(([, g]) => g);
}
