// The shelf on the wall with Sandbox Software's boxes standing on it like books, spines
// out. The box whose game is in the drive, or the one last taken down to look at, stands
// face out. Click a box to take it down (the box viewer); in the viewer ◀ ▶ walk along
// the shelf. While one of these games is in drive A: its poster hangs on the wall.
import { sandboxBoxContents } from './gameBoxContents';
import './shelf.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { boxModel, openBoxViewer, type BoxViewerPage } from './boxViewer';
import { drawBox, type BoxFaces } from './gameBox';
import { hideWallPoster, setPosterWall, showWallPoster } from '../room/wallPoster';

export interface ShelfHooks {
  /** Put the game's disk in drive A:. */
  insert: (id: string) => void;
  /** Open the game's manual (only for games that have one). */
  manual?: (entry: CatalogEntry, front: string) => void;
}

const FRONT_KEY = 'gm-shelf-front';
/** Inches of shelf the boxes may use, at 16px an inch (shrinks the boxes when it fills up). */
const SHELF_PX = 318;

function remembered(): string | undefined {
  try {
    return localStorage.getItem(FRONT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function remember(id: string): void {
  try {
    localStorage.setItem(FRONT_KEY, id);
  } catch {
    /* private window: just don't remember */
  }
}

export interface Shelf {
  element: HTMLElement;
  /** Turns a game's box face out. */
  face: (id: string) => void;
  dispose: () => void;
}

/** Fills the shelf on the wall of `scene` with the games' boxes. */
export async function gameShelf(scene: HTMLElement, games: CatalogEntry[], hooks: ShelfHooks): Promise<Shelf | undefined> {
  if (!games.length) return undefined;
  setPosterWall(scene, games);
  const shelf = h('div', { class: 'game-shelf', role: 'list', 'aria-label': 'Game boxes on the shelf' });
  // a spine is 2" wide and a box face 7.5": shrink them all when the shelf fills up
  const u = Math.min(16, SHELF_PX / ((games.length - 1) * 2.2 + 7.5));
  shelf.style.setProperty('--shelf-u', `${u.toFixed(2)}px`);
  scene.append(shelf);
  const faces = new Map<string, BoxFaces>();
  const slots = new Map<string, HTMLElement>();
  let front = remembered() ?? games[0].id;
  if (!games.some((g) => g.id === front)) front = games[0].id;

  const face = (id: string) => {
    if (!slots.has(id)) return;
    front = id;
    remember(id);
    for (const [gid, el] of slots) el.classList.toggle('face-out', gid === id);
  };

  const onShelf = () => games.filter((g) => faces.has(g.id));
  const page = (g: CatalogEntry): BoxViewerPage => {
    const f = faces.get(g.id)!;
    return {
      entry: g,
      faces: f,
      actions: {
        manual: g.original?.manual && hooks.manual ? () => hooks.manual!(g, f.front) : undefined,
        insert: () => hooks.insert(g.id),
        // beside the box: the disks, the manual and the paper that came in it
        extras: sandboxBoxContents(g, f.front, { insert: () => hooks.insert(g.id), open: () => hooks.manual?.(g, f.front) }),
        step: async (dir) => {
          const list = onShelf();
          if (list.length < 2) return undefined;
          const i = list.findIndex((x) => x.id === front);
          const next = list[(i + dir + list.length) % list.length];
          face(next.id);
          return page(next);
        },
      },
    };
  };
  const open = (g: CatalogEntry) => {
    face(g.id);
    const p = page(g);
    void openBoxViewer(p.entry, p.faces, p.actions);
  };

  // draw the boxes one by one, so the first ones appear while the rest are drawn
  for (const g of games) {
    const f = await drawBox(g).catch(() => undefined);
    if (!f) continue;
    faces.set(g.id, f);
    const slot = h(
      'button',
      {
        class: `shelf-box${g.id === front ? ' face-out' : ''}`,
        role: 'listitem',
        title: `${g.title} — take it off the shelf`,
        'aria-label': `${g.title} box`,
        onclick: () => open(g),
      },
      boxModel(f),
    );
    slots.set(g.id, slot);
    shelf.append(slot);
  }
  if (!slots.has(front) && slots.size) face([...slots.keys()][0]);

  // follow drive A: — the desk lists "<title> in A:" beside the drive
  const desk = scene.closest('.desk') ?? scene;
  let inDrive: string | undefined;
  const watch = () => {
    const label = desk.querySelector('.drive-actions-title')?.textContent ?? '';
    const drive = desk.querySelector<HTMLElement>('.drive-actions');
    const g = drive && !drive.hidden ? games.find((x) => label === `${x.title} in A:`) : undefined;
    if (g?.id === inDrive) return;
    inDrive = g?.id;
    if (g) {
      face(g.id);
      void showWallPoster(g.id);
    } else hideWallPoster();
  };
  const observer = new MutationObserver(watch);
  observer.observe(desk, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  watch();
  return {
    element: shelf,
    face,
    dispose: () => {
      observer.disconnect();
      hideWallPoster();
    },
  };
}
