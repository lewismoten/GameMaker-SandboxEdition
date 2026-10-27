// The shelf on the desk's wall, a box for each original game (desk/boxes/shelf.ts, loaded when
// first filled). Filled again when the list of games changes: the latest fill wins.
import type { CatalogEntry } from '../project/files';
import type { Shelf } from './boxes/shelf';

interface ShelfActions {
  /** Puts the game's disk in drive A: and plays it. */
  insert(id: string): void;
  manual(g: CatalogEntry, front?: string): Promise<void>;
}

export function deskShelf(desk: HTMLElement, on: ShelfActions): { fill(games: CatalogEntry[]): Promise<void>; dispose(): void } {
  let shelf: Shelf | undefined;
  let shelfFill = 0;
  async function fill(games: CatalogEntry[]): Promise<void> {
    const fill = ++shelfFill;
    const scene = desk.querySelector<HTMLElement>('.desk-scene');
    shelf?.dispose();
    shelf = undefined;
    scene?.querySelectorAll('.game-shelf').forEach((el) => el.remove());
    const { gameShelf } = await import('./boxes/shelf');
    if (fill !== shelfFill) return;
    const made = scene
      ? await gameShelf(scene, games, {
          insert: (id) => on.insert(id),
          manual: (g, front) => on.manual(g, front),
        })
      : undefined;
    if (fill !== shelfFill) {
      made?.dispose();
      made?.element.remove();
      return;
    }
    shelf = made;
    // on the wall under the poster, so it comes next when you Tab along the wall
    const el = scene?.querySelector('.game-shelf');
    if (el) desk.querySelector('.news-clipping')?.after(el);
  }
  return { fill, dispose: () => shelf?.dispose() };
}
