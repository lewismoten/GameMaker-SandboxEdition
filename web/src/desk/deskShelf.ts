// The shelf on the desk's wall, a box for each original game (desk/boxes/shelf.ts, loaded when
// first filled). Filled again when the list of games changes: the latest fill wins.
import type { CatalogEntry } from '../project/files';
import { dropBoxFromAddress } from './boxes/boxAddress';
import type { Shelf } from './boxes/shelf';

interface ShelfActions {
  /** Puts the game's disk in drive A: and plays it. */
  insert(id: string): void;
  manual(g: CatalogEntry, front?: string): Promise<void>;
  /** The box the address asks to have open (open=box:<id>), opened once the shelf stands. */
  restoreBox?: string;
}

export function deskShelf(desk: HTMLElement, on: ShelfActions): { fill(games: CatalogEntry[]): Promise<void>; dispose(): void } {
  let shelf: Shelf | undefined;
  let shelfFill = 0;
  let restore = on.restoreBox;
  async function fill(games: CatalogEntry[]): Promise<void> {
    const fill = ++shelfFill;
    const scene = desk.querySelector<HTMLElement>('.desk-scene');
    shelf?.dispose();
    shelf = undefined;
    scene?.querySelectorAll('.game-shelf').forEach((el) => el.remove());
    const { gameShelf } = await import('./boxes/shelf');
    if (fill !== shelfFill) return;
    if (!games.length && restore) {
      restore = undefined; // nothing stands on the shelf: the box in the address can't be shown
      dropBoxFromAddress();
    }
    const made = scene
      ? await gameShelf(scene, games, {
          insert: (id) => on.insert(id),
          manual: (g, front) => on.manual(g, front),
          restore: (() => {
            const r = restore;
            restore = undefined; // only the first shelf opens it
            return r;
          })(),
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
  return {
    fill,
    dispose: () => {
      // a shelf still being drawn is let go as soon as it is done (its picture addresses would never be released)
      shelfFill++;
      shelf?.dispose();
      shelf = undefined;
    },
  };
}
