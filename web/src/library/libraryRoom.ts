// The Library's room (libraryPage.ts), the page's main view: a small octagonal library drawn in SVG
// (roomArt.ts). Every object is a real button, and each opens a dialog (libraryPage.ts): the stacks,
// the card catalog, the copier, Mystery Robot Joe the librarian behind the circulation desk (help),
// the composition notebook on the desk (ratings and notes of imported games here), the trash can
// (removed games' records, which can be forgotten) and L-Space, a dim gap between two stacks that
// leads somewhere else. The open drawer's items stand on the far wall as spines (buttons). Joe is
// Keep It Brief!'s tin robot, drawn by tinHearts/joeArt.ts. On small windows the room is a row of
// labeled buttons.
import './libraryRoom.css';
import { h, modal } from '../editor/core/ui';
import { drawJoe } from '../tinHearts/joeArt';
import { removedGames } from '../imported/removedGames';
import { aisle, ICONS, lspaceBox, svgOf, trashIcon } from './roomArt';
import { pctX, pctY, proj } from './roomGeo';
import { catalogArt, copierArt, deskArt, DESK, place, spineBox, tableArt, stoolsArt, lampArt, cartArt, type Spot } from './roomObjects';

export interface RoomActions {
  /** Takes the visitor to the shelves, the card catalog or the copier. */
  go(where: 'stacks' | 'catalog' | 'copier' | 'lspace'): void;
  /** The dialog now open (the address keeps it, so a reload opens it again), or none. */
  mark(name: string | undefined): void;
  /** What is on the shelves right now (the count line). */
  status(): string;
}

function joeCanvas(): HTMLCanvasElement {
  const px = 4;
  const c = h('canvas', { class: 'lib-o-joe-art', width: 20 * px, height: 20 * px, 'aria-hidden': 'true' });
  const g = c.getContext('2d');
  if (g) drawJoe(g, 0, 0, px, { frame: 'stand' });
  return c;
}

/** One object: a button with its picture and a visible name (none, for L-Space: its name is only the label). */
function thing(cls: string, name: string, label: string, art: Element | null, onclick: (from: HTMLButtonElement) => void): HTMLButtonElement {
  const b = h(
    'button',
    { type: 'button', class: `lib-obj ${cls}`, 'aria-label': label, onclick: () => onclick(b) },
    ...(art ? [art] : []),
    ...(name ? [h('span', { class: 'lib-tag', 'aria-hidden': 'true' }, name)] : []),
  );
  return b;
}

async function showNotes(view: 'here' | 'removed', title: string, empty: string, from: HTMLElement, mark: RoomActions['mark']): Promise<void> {
  mark(view === 'here' ? 'notebook' : 'trash');
  const { notesShelf } = await import('../imported/notesShelf');
  const section = await notesShelf(view);
  await modal<void>(title, (close) => [
    section ?? h('p', { class: 'lead' }, empty),
    h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Close')),
  ]);
  mark(undefined);
  from.focus();
}

function joeHelp(status: string, from: HTMLElement, mark: RoomActions['mark']): void {
  mark('joe');
  void modal<void>('Mystery Robot Joe, the librarian', (close) => [
    h('p', { class: 'lead' }, 'Hello! I look after the shelves at night. Here is how the library works.'),
    h(
      'ul',
      { class: 'lib-help' },
      h('li', null, 'The card catalog has a drawer for each game (or each kind of paper). Pull one open and its cards stand on the shelves below.'),
      h('li', null, 'The drawers go in call-number order: the three-digit class first, then the three-letter mark of whoever it is from.'),
      h('li', null, 'Pick By game or By type above the catalog to file the same papers the other way.'),
      h('li', null, 'The copier prints a paper from the open drawer. It also does mugs and stickers.'),
      h('li', null, 'The notebook on my desk holds your stars and notes on imported games. The trash can holds the records of ones you removed.'),
      h('li', null, 'The thin dark gap between two shelf ends is L-Space, a nod to Terry Pratchett’s Discworld. It leads somewhere else to read.'),
    ),
    h('p', null, `Right now: ${status || 'the shelves are being stocked.'}`),
    h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Thank you, Joe')),
  ]).then(() => {
    mark(undefined);
    from.focus();
  });
}

/** What the room needs to stand a spine on its far wall. */
export interface RoomShelf {
  items: HTMLElement[];
  /** The last spine: opens the whole list. */
  more(): HTMLElement;
}

const NOTEBOOK = 'Composition notebook: ratings and notes of your imported games';

/** Sets where a piece goes (percent of the room) for the room's stylesheet. */
function box(el: HTMLElement, at: Pick<Spot, 'l' | 't' | 'w' | 'h'>): void {
  el.style.setProperty('--l', `${at.l.toFixed(2)}%`);
  el.style.setProperty('--t', `${at.t.toFixed(2)}%`);
  el.style.setProperty('--w', `${at.w.toFixed(2)}%`);
  el.style.setProperty('--h', `${at.h.toFixed(2)}%`);
}

/** The room, ready to put at the top of the page. */
export function makeRoom(actions: RoomActions): { el: HTMLElement; refresh(): void; setShelf(s: RoomShelf): void; open(name: string): boolean } {
  const mark = (name: string | undefined) => actions.mark(name);
  const trash = svgOf(trashIcon(false));
  const openers = new Map<string, (from: HTMLButtonElement) => void>();
  const trashBtn = thing(
    'lib-o-trash',
    'Trash',
    'Trash can: removed games, with their ratings and notes',
    trash,
    (from) =>
      void showNotes(
        'removed',
        'Trash can: removed games',
        'The trash can is empty. Games you remove keep a record here, with their rating and note, until you forget it.',
        from,
        mark,
      ).then(() => refresh()),
  );
  const refresh = () => {
    const full = removedGames().length > 0;
    trashBtn.replaceChildren(svgOf(trashIcon(full)), h('span', { class: 'lib-tag', 'aria-hidden': 'true' }, 'Trash'));
    trashBtn.classList.toggle('full', full);
  };
  refresh();
  const notebook = thing(
    'lib-o-notebook',
    'Notebook',
    NOTEBOOK,
    svgOf(ICONS.notebook),
    (from) =>
      void showNotes(
        'here',
        'Notebook: ratings and notes',
        'Nothing is written in the notebook yet. Rate an imported game, or leave it a note, and it shows up here.',
        from,
        mark,
      ),
  );
  const joe = thing('lib-o-joe', 'Joe', 'Mystery Robot Joe, the librarian: help with the library', joeCanvas(), (from) =>
    joeHelp(actions.status(), from, mark),
  );
  openers.set('trash', () => trashBtn.click());
  openers.set('notebook', () => notebook.click());
  openers.set('joe', () => joe.click());
  const sides = [h('div', { class: 'lib-spines lib-spines-l' }), h('div', { class: 'lib-spines lib-spines-r' })];
  sides.forEach((side, i) => {
    const b = spineBox(i === 0);
    box(side, b);
    side.style.setProperty('--gap', `${b.gap}%`);
  });
  let shelf: RoomShelf | undefined;
  // as many spines as fit the two runs of shelf on the far wall (two rows each), the last one "more on this shelf"
  const layout = () => {
    if (!shelf) return;
    const cols = Math.max(1, Math.floor((sides[0].clientWidth + 2) / 26)) || 5;
    sides.forEach((s) => s.style.setProperty('--cols', String(cols)));
    const cap = cols * 2 * 2;
    const list = shelf.items.length <= cap ? shelf.items : [...shelf.items.slice(0, cap - 1), shelf.more()];
    sides[0].replaceChildren(...list.slice(0, cols * 2));
    sides[1].replaceChildren(...list.slice(cols * 2));
  };
  const catalogSpot = catalogArt();
  const copierSpot = copierArt();
  const deskSpot = deskArt();
  const tableSpot = tableArt();
  const catalog = thing('lib-o-catalog', 'Card catalog', 'Card catalog: open the drawers', catalogSpot.svg, () => actions.go('catalog'));
  const copier = thing('lib-o-copier', 'Copier', 'Copier: print a paper, a mug or stickers', copierSpot.svg, () => actions.go('copier'));
  const lspace = thing('lib-o-lspace', '', 'L-Space: a thin gap between two bookshelves that leads somewhere else to read', null, () => actions.go('lspace'));
  const desk = h('div', { class: 'lib-desk', 'aria-hidden': 'true' }, deskSpot.svg, h('span', { class: 'lib-brb' }, 'Back in a moment'));
  box(catalog, catalogSpot);
  box(copier, copierSpot);
  box(desk, deskSpot);
  const table = h('div', { class: 'lib-table', 'aria-hidden': 'true' }, tableSpot.svg);
  box(table, tableSpot);
  const props = [stoolsArt(), lampArt(), cartArt()].map((p) => {
    const d = h('div', { class: 'lib-table', 'aria-hidden': 'true' }, p.svg);
    box(d, p);
    return d;
  });
  const gap = lspaceBox();
  box(lspace, gap);
  // flat pictures stand on the floor (or the desk) at their depth: Joe behind the desk, the trash can beside it
  place(joe, DESK.x, DESK.z + 0.85, 1.6);
  // where the tour has him step out: on the floor just past the desk's back corner, in the clear (tourEngine.ts)
  const [outX, outY] = proj(DESK.x + DESK.w / 2 + 0.35, 0, DESK.z + 0.85);
  joe.dataset.out = `${pctX(outX).toFixed(2)},${pctY(outY).toFixed(2)}`;
  place(trashBtn, DESK.x + 1.35, DESK.z - 0.05, 0.5);
  place(notebook, DESK.x - 0.35, DESK.z - 0.02, 0.42, DESK.h);
  const el = h(
    'section',
    { class: 'lib-room', 'aria-label': 'The library room' },
    aisle(),
    thing('lib-o-stacks', 'The stacks', 'The stacks: open the shelf in a list', null, () => actions.go('stacks')),
    ...sides,
    lspace,
    joe,
    table,
    ...props,
    desk,
    notebook,
    trashBtn,
    h('div', { class: 'lib-visitors', 'aria-hidden': 'true' }),
    catalog,
    copier,
  );
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(sides[0]);
  return {
    el,
    refresh,
    setShelf: (s) => {
      shelf = s;
      layout();
    },
    open: (name) => {
      const f = openers.get(name);
      if (!f) return false;
      f(el.querySelector('.lib-o-' + name) as HTMLButtonElement);
      return true;
    },
  };
}
