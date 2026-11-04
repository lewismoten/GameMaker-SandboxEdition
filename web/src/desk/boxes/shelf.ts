// Two shelves on the wall with Sandbox Software's boxes standing on them like books, spines
// out (the felt eggs' shadow box, once there is one, stands at the top shelf's right end). The box whose game is in the drive, or the one last taken down to look at, stands
// face out. Click a box to take it down (the box viewer); in the viewer ◀ ▶ walk along
// the shelf. While one of these games is in drive A: its poster hangs on the wall. Under the
// black light their lettering and stickers glow (boxUv.ts), made the first time the tube is on.
import './shelf.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { boxModel, openBoxViewer, type BoxViewerPage } from './boxViewer';
import { drawBox, releaseFaces, type BoxFaces } from './gameBox';
import { dressUv, releaseUv, uvGame } from './boxUv';
import { hideWallPoster, setPosterWall, showWallPoster } from '../room/wallPoster';
import { shelfLayout } from './shelfLayout';
import { boxIdFromOpen, boxInAddress, dropBoxFromAddress, restorableBox, turnInAddress, type BoxTurn } from './boxAddress';

interface ShelfHooks {
  /** Put the game's disk in drive A:. */
  insert: (id: string) => void;
  /** Open the game's manual (only for games that have one); settles when it is closed. */
  manual?: (entry: CatalogEntry, front: string) => Promise<void> | void;
  /** The box the address asked to have open (a reload or shared link); it is only opened if it is on this shelf. */
  restore?: string;
}

const FRONT_KEY = 'gm-shelf-front';
/** Pixels of each shelf the boxes may use, top first (shelf.css): the bottom one from the wall's
 * edge to the left speaker, which stands in front of the rest; the top one leaves room at its
 * right end for the felt eggs' shadow box (eggs.css). */
const SHELF_PX = [146, 300];
/** Where the bottom shelf's plank is, and the room between a shelf's boxes and the plank above (shelf.css). */
const BOTTOM_Y = 426;
const PLANK_PX = 12;
const HEADROOM_PX = 6;

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
  const shelf = h('div', { class: 'game-shelf', role: 'group', 'aria-label': 'Game boxes on the shelves' });
  // as big as they fit, the top shelf filled first
  const layout = shelfLayout(games.length, SHELF_PX);
  const rows = layout.rows.map((_, i) => h('div', { class: `shelf-row ${i ? 'bottom' : 'top'}` }));
  shelf.append(...rows);
  shelf.style.setProperty('--shelf-u', `${layout.u.toFixed(2)}px`);
  // the top shelf's plank, for whatever stands on it (the eggs' shadow box)
  scene.style.setProperty('--shelf-top-y', `${BOTTOM_Y - 9.25 * layout.u - PLANK_PX - HEADROOM_PX}px`);
  scene.append(shelf);
  const rowOf = (i: number) => {
    let k = i;
    for (let r = 0; r < rows.length; r++) {
      if (k < layout.rows[r]) return rows[r];
      k -= layout.rows[r];
    }
    return rows[rows.length - 1];
  };
  const faces = new Map<string, BoxFaces>();
  const slots = new Map<string, HTMLElement>();
  const desk = scene.closest<HTMLElement>('.desk') ?? scene;
  // under the black light: what shows of each box on the shelf (its spine, or its front face out)
  let uv = false;
  const glow = (id: string) => {
    const f = faces.get(id);
    const model = slots.get(id)?.querySelector<HTMLElement>('.box3d');
    if (uv && f && model) dressUv(model, f, id === front ? ['front', 'left'] : ['left', 'front']);
  };
  const tube = () => {
    if (uv || !desk.classList.contains('bl-uv')) return;
    uv = true;
    // the box face out first, then along the shelf
    for (const id of [front, ...slots.keys()]) glow(id);
  };
  let front = remembered() ?? games[0].id;
  if (!games.some((g) => g.id === front)) front = games[0].id;

  // Boxes spine out are drawn without their cover painting or screenshots (no cover code or
  // game files to load); a box gets them when it is turned face out or taken down, its cover
  // first (quick), then the screenshots.
  const releaseFacesOf = (id: string) => {
    const old = faces.get(id);
    if (old) {
      releaseFaces(old);
      releaseUv(old);
    }
  };
  const complete = new Map<string, Promise<BoxFaces | undefined>>();
  const whole = new Set<string>();
  const covered = new Set<string>();
  const completed = (g: CatalogEntry): Promise<BoxFaces | undefined> => {
    let p = complete.get(g.id);
    if (!p) {
      // the cover first; not for the box already drawn with it (the one face out as the shelf went up)
      if (!covered.has(g.id))
        void drawBox(g, { shots: false }).then(
          (f) => {
            if (!f || whole.has(g.id)) return;
            releaseFacesOf(g.id);
            faces.set(g.id, f);
            slots.get(g.id)?.replaceChildren(boxModel(f));
          },
          () => undefined,
        );
      p = drawBox(g)
        .catch(() => undefined)
        .then((f) => {
          if (!f) return faces.get(g.id);
          whole.add(g.id);
          releaseFacesOf(g.id);
          faces.set(g.id, f);
          uvGame(f, g);
          slots.get(g.id)?.replaceChildren(boxModel(f));
          glow(g.id);
          return f;
        });
      complete.set(g.id, p);
    }
    return p;
  };

  const face = (id: string) => {
    if (!slots.has(id)) return;
    const g = games.find((x) => x.id === id);
    if (g) void completed(g);
    front = id;
    remember(id);
    for (const [gid, el] of slots) el.classList.toggle('face-out', gid === id);
  };

  const onShelf = () => games.filter((g) => faces.has(g.id));
  const page = (g: CatalogEntry): BoxViewerPage => {
    const f = faces.get(g.id)!;
    // the manual or a piece of paper read from the box: put it down and the box is back in hand
    const read =
      g.original?.manual && hooks.manual
        ? () =>
            void Promise.resolve(hooks.manual!(g, f.front)).then(() => {
              if (!shelf.isConnected) return;
              slots.get(g.id)?.focus({ preventScroll: true });
              void open(g);
            })
        : undefined;
    return {
      id: g.id,
      entry: g,
      faces: f,
      actions: {
        manual: read,
        insert: () => hooks.insert(g.id),
        uv: (model) => dressUv(model, f, ['front', 'left', 'back', 'right', 'top', 'bottom']),
        // beside the box: the disks, the manual and the paper that came in it
        extras: boxContents(g, f.front, { insert: () => hooks.insert(g.id), open: () => read?.() }),
        step: async (dir) => {
          const list = onShelf();
          if (list.length < 2) return undefined;
          const i = list.findIndex((x) => x.id === front);
          const next = list[(i + dir + list.length) % list.length];
          face(next.id);
          await completed(next);
          return page(next);
        },
      },
    };
  };
  const open = async (g: CatalogEntry, restored?: { turn?: BoxTurn }) => {
    face(g.id);
    await completed(g);
    const p = page(g);
    void openBoxViewer(p.entry, p.faces, p.actions, { id: g.id, restored: !!restored, turn: restored?.turn });
  };

  // draw the boxes one by one, so the first ones appear while the rest are drawn
  for (const [i, g] of games.entries()) {
    // let the page paint and answer between boxes: drawing one is most of a frame's worth of work
    if (i) await new Promise<void>((r) => setTimeout(r));
    // the box face out gets its cover painting now and its screenshots after the shelf is up
    const withCover = g.id === front;
    const f = await drawBox(g, { shots: false, cover: withCover, blobs: true }).catch(() => undefined);
    if (!f) continue;
    if (withCover) covered.add(g.id);
    faces.set(g.id, f);
    uvGame(f, g);
    const slot = h(
      'button',
      {
        class: `shelf-box${g.id === front ? ' face-out' : ''}`,
        title: `${g.title} — take it off the shelf`,
        'aria-label': `${g.title} box`,
        onclick: () => void open(g),
      },
      boxModel(f),
    );
    slots.set(g.id, slot);
    rowOf(i).append(slot);
    glow(g.id);
  }
  if (!slots.has(front) && slots.size) face([...slots.keys()][0]);
  else face(front);

  const tubeWatch = new MutationObserver(tube);
  tubeWatch.observe(desk, { attributes: true, attributeFilter: ['class'] });
  tube();

  // a reload or shared link names a box: open it if it stands on this shelf; any other id
  // (not on the shelf yet, a secret game not found, a typo) opens nothing and shows nothing
  if (hooks.restore) {
    const id = restorableBox(boxIdFromOpen(hooks.restore), faces.keys());
    const g = games.find((x) => x.id === id);
    if (g) {
      slots.get(g.id)?.focus({ preventScroll: true });
      void open(g, { turn: turnInAddress() });
    } else dropBoxFromAddress();
  }

  // Forward onto a box's history entry (after Back closed its viewer) takes it down again
  const onPop = () => {
    const g = games.find((x) => x.id === restorableBox(boxInAddress(), faces.keys()));
    if (g && shelf.isConnected && !document.querySelector('.box-viewer')) void open(g, { turn: turnInAddress() });
  };
  window.addEventListener('popstate', onPop);

  // follow drive A: — the desk lists "<title> in A:" beside the drive
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
      window.removeEventListener('popstate', onPop);
      tubeWatch.disconnect();
      hideWallPoster();
      // the shelf's page-only picture addresses (gameBox.ts drawBox `blobs`) go with it
      for (const f of faces.values()) {
        releaseFaces(f);
        releaseUv(f);
      }
      faces.clear();
    },
  };
}

/** What came in the box (gameBoxContents.ts, with the printed paper's code): loaded when a box is first opened. */
function boxContents(...args: Parameters<typeof import('./gameBoxContents').sandboxBoxContents>): HTMLElement {
  const slot = h('div', { style: 'display: contents' });
  void import('./gameBoxContents').then(({ sandboxBoxContents }) => slot.append(sandboxBoxContents(...args)));
  return slot;
}
