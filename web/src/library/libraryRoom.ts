// The Library's room (libraryPage.ts), at the top of the page: an aisle of stacks in perspective
// leading to the circulation desk, drawn in SVG (roomArt.ts). Every object is a real button:
// the stacks (to the shelves), the card catalog (to its drawers), the copier, Mystery Robot Joe the
// librarian (help), the composition notebook (ratings and notes of imported games here) and the
// trash can (removed games' records, which can be forgotten). Joe is Keep It Brief!'s tin robot,
// drawn by tinHearts/joeArt.ts. On small windows the room is a row of labeled buttons.
import './libraryRoom.css';
import { h, modal } from '../editor/core/ui';
import { drawJoe } from '../tinHearts/joeArt';
import { removedGames } from '../imported/removedGames';
import { aisle, ICONS, svgOf, trashIcon } from './roomArt';

export interface RoomActions {
  /** Takes the visitor to the shelves, the card catalog or the copier. */
  go(where: 'stacks' | 'catalog' | 'copier'): void;
  /** What is on the shelves right now (the count line). */
  status(): string;
}

function joeCanvas(): HTMLCanvasElement {
  const px = 3;
  const c = h('canvas', { class: 'lib-o-joe-art', width: 20 * px, height: 20 * px, 'aria-hidden': 'true' });
  const g = c.getContext('2d');
  if (g) drawJoe(g, 0, 0, px, { frame: 'stand' });
  return c;
}

/** One object: a button with its picture and a visible name. */
function thing(cls: string, name: string, label: string, art: Element, onclick: (from: HTMLButtonElement) => void): HTMLButtonElement {
  const b = h(
    'button',
    { type: 'button', class: `lib-obj ${cls}`, 'aria-label': label, onclick: () => onclick(b) },
    art,
    h('span', { class: 'lib-tag', 'aria-hidden': 'true' }, name),
  );
  return b;
}

async function showNotes(view: 'here' | 'removed', title: string, empty: string, from: HTMLElement): Promise<void> {
  const { notesShelf } = await import('../imported/notesShelf');
  const section = await notesShelf(view);
  await modal<void>(title, (close) => [
    section ?? h('p', { class: 'lead' }, empty),
    h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Close')),
  ]);
  from.focus();
}

function joeHelp(status: string, from: HTMLElement): void {
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
    ),
    h('p', null, `Right now: ${status || 'the shelves are being stocked.'}`),
    h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Thank you, Joe')),
  ]).then(() => from.focus());
}

/** The room, ready to put at the top of the page. */
export function makeRoom(actions: RoomActions): { el: HTMLElement; refresh(): void } {
  const trash = svgOf(trashIcon(false));
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
      ).then(() => refresh()),
  );
  const refresh = () => {
    const full = removedGames().length > 0;
    trashBtn.replaceChildren(svgOf(trashIcon(full)), h('span', { class: 'lib-tag', 'aria-hidden': 'true' }, 'Trash'));
    trashBtn.classList.toggle('full', full);
  };
  refresh();
  const el = h(
    'section',
    { class: 'lib-room', 'aria-label': 'The library room' },
    aisle(),
    thing('lib-o-stacks', 'The stacks', 'The stacks: go to the shelves', svgOf(ICONS.stacks), () => actions.go('stacks')),
    h('div', { class: 'lib-desk', 'aria-hidden': 'true' }),
    thing('lib-o-joe', 'Joe', 'Mystery Robot Joe, the librarian: help with the library', joeCanvas(), (from) => joeHelp(actions.status(), from)),
    thing(
      'lib-o-notebook',
      'Notebook',
      'Composition notebook: ratings and notes of your imported games',
      svgOf(ICONS.notebook),
      (from) =>
        void showNotes(
          'here',
          'Notebook: ratings and notes',
          'Nothing is written in the notebook yet. Rate an imported game, or leave it a note, and it shows up here.',
          from,
        ),
    ),
    trashBtn,
    thing('lib-o-catalog', 'Card catalog', 'Card catalog: open the drawers', svgOf(ICONS.catalog), () => actions.go('catalog')),
    thing('lib-o-copier', 'Copier', 'Copier: print a paper, a mug or stickers', svgOf(ICONS.copier), () => actions.go('copier')),
  );
  return { el, refresh };
}
