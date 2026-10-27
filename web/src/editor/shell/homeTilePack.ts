// The home page's grouped tiles packed into as few rows as they fit (homePack.ts): the Bard's
// collections, and Gameware and Shareware under who made them, the page in the same order as
// the rows; while searching, back in the plain flow, a heading over each.
import { packCollections, packGroups } from './homePack';

export function tilePacker(tiles: HTMLElement) {
  /** The grid's columns when the collections were last packed into it (0: not packed). */
  let packedCols = 0;
  return {
    /** `byMaker`: the groups are makers; `plain`: no packing (a search, or Imported by rating). */
    pack(byMaker: boolean, searching: boolean, plain: boolean): void {
      const heads = [...tiles.querySelectorAll<HTMLElement>(':scope > .lib-sub')];
      // the makers' names are in their headings, so the tiles leave them out (back in a search's plain list)
      tiles.classList.toggle('lib-by-maker', !!heads.length && byMaker && !searching);
      // Imported grouped by rating stays in the plain flow, a heading over each group (the import tile after them)
      if (!heads.length || searching || plain) {
        if (packedCols) for (const el of tiles.children) (el as HTMLElement).style.gridArea = '';
        packedCols = 0;
        return;
      }
      const cols = getComputedStyle(tiles).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (!cols || cols === packedCols) return;
      packedCols = cols;
      const groups = heads.map((head) => ({ head, items: [...tiles.querySelectorAll<HTMLElement>(`:scope > .card[data-group="${head.dataset.group}"]`)] }));
      const order: HTMLElement[] = [];
      const sizes = groups.map((g) => g.items.length);
      for (const p of byMaker ? packGroups(sizes, cols) : packCollections(sizes, cols)) {
        const { head, items } = groups[p.index];
        head.style.gridArea = `${p.head.row} / ${p.head.col} / auto / span ${p.head.span}`;
        items.forEach((el, i) => (el.style.gridArea = `${p.tiles[i].row} / ${p.tiles[i].col}`));
        order.push(head, ...items);
      }
      if (order.every((el, i) => tiles.children[i] === el)) return;
      const focused = document.activeElement;
      tiles.append(...order);
      if (focused instanceof HTMLElement && tiles.contains(focused)) focused.focus({ preventScroll: true });
    },
    /** New tiles: pack them afresh. */
    reset(): void {
      packedCols = 0;
    },
  };
}
