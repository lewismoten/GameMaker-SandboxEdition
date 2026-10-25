// The Library (#/library): everything on the site to read or print, a card each, sorted by game
// or by the kind of paper (#/library?by=type, remembered per browser). A card opens its piece
// in the viewer that already shows it: its game's box (manual/gameManual.ts), the Game-Maker
// box (manual/dosManual.ts), TURBO BUTTON, the Guide, or the desk's zine.
import './library.css';
import { h, clear } from '../editor/core/ui';
import { viewState } from '../urlState';
import type { CatalogEntry } from '../project/files';
import { groupShelf, isShelfOrder, SITE_OWNER, type ShelfGroup, type ShelfItem, type ShelfOrder } from './shelf';
import { loadShelf, type Shelf } from './listing';
import { lazyThumb } from './thumbs';

const ORDER_KEY = 'gm-library-by';
const ORDERS: [ShelfOrder, string][] = [
  ['game', 'By game'],
  ['type', 'By type'],
];

function savedOrder(): ShelfOrder | undefined {
  try {
    const v = localStorage.getItem(ORDER_KEY);
    return isShelfOrder(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function rememberOrder(order: ShelfOrder): void {
  try {
    localStorage.setItem(ORDER_KEY, order);
  } catch {
    /* private mode: the address still has it */
  }
}

/** Waits for a box viewer to be on screen (or `done` to settle), for a card's "Opening…". */
function whenShown(done: Promise<unknown>): Promise<void> {
  return new Promise((resolve) => {
    const watch = new MutationObserver(() => document.querySelector('.gmb, .zine-overlay') && finish());
    const finish = () => (watch.disconnect(), resolve());
    watch.observe(document.body, { childList: true });
    done.then(finish, finish);
  });
}

/** Opens a card's piece where the site already shows it. */
async function openPiece(item: ShelfItem, games: Map<string, CatalogEntry>, from: HTMLElement): Promise<void> {
  const o = item.open;
  if (o.via === 'href' || from.hasAttribute('aria-busy')) return; // a link, or opening already
  from.setAttribute('aria-busy', 'true');
  from.classList.add('opening');
  try {
    if (o.via === 'box') {
      const entry = games.get(o.game);
      if (!entry) return;
      const m = await import('../manual/gameManual');
      const done = o.maps ? m.openGameMaps(entry, undefined, o.start) : m.openGameManual(entry, undefined, undefined, o.start);
      await whenShown(done);
    } else if (o.via === 'gm') {
      const { openDosManual } = await import('../manual/dosManual');
      await whenShown(openDosManual(o.start));
    } else {
      const { openZine } = await import('../desk/props/zine/zine');
      void openZine(from);
    }
  } finally {
    from.removeAttribute('aria-busy');
    from.classList.remove('opening');
  }
}

/** A manual's card picture: a little booklet in its box's colors. */
function bookCover(item: ShelfItem, entry: CatalogEntry | undefined): HTMLElement | undefined {
  if (item.type !== 'manual' || item.open.via === 'href') return undefined;
  const box = entry?.original?.box;
  const style = box ? `--lib-bg:${box.background};--lib-band:${box.accent};--lib-ink:${box.ink}` : undefined;
  return h(
    'span',
    { class: `lib-book${box ? '' : ' lib-book-gm'}`, style },
    h('span', { class: 'lib-book-band' }),
    h('span', { class: 'lib-book-title' }, item.title),
  );
}

function card(item: ShelfItem, shelf: Shelf, order: ShelfOrder): HTMLElement {
  const entry = shelf.games.get(item.owner);
  const frame = h(
    'span',
    { class: `lib-thumb lib-t-${item.type}`, 'aria-hidden': 'true' },
    bookCover(item, entry) ?? h('span', { class: 'lib-icon' }, item.icon),
  );
  const make = shelf.thumbs.get(item.key);
  if (make) lazyThumb(frame, item.key, make);
  // by type, a game's or the Game-Maker box's card says whose it is; by game, the heading does, so it says what it is
  const sub = order === 'type' && item.owner !== SITE_OWNER && !item.title.startsWith(item.ownerTitle) ? item.ownerTitle : item.note;
  const body = [frame, h('span', { class: 'lib-name' }, h('strong', null, item.title), sub ? h('small', null, sub) : null)];
  const el =
    item.open.via === 'href'
      ? h('a', { class: 'lib-card', href: item.open.href }, ...body)
      : h('button', { type: 'button', class: 'lib-card', onclick: () => void openPiece(item, shelf.games, el) }, ...body);
  return h('li', null, el);
}

function groupSection(g: ShelfGroup, shelf: Shelf, order: ShelfOrder): HTMLElement {
  const id = `lib-${g.key}`;
  return h(
    'section',
    { class: 'lib-group', 'aria-labelledby': id },
    h('h2', { id }, g.heading),
    ...g.parts.flatMap((p) => [p.heading ? h('h3', null, p.heading) : null, h('ul', { class: 'lib-grid' }, ...p.items.map((it) => card(it, shelf, order)))]),
  );
}

/** The Library page into `el`. */
export function renderLibrary(el: HTMLElement): void {
  const state = viewState(['library']);
  const asked = state.get('by');
  let order: ShelfOrder = isShelfOrder(asked) ? asked : (savedOrder() ?? 'game');
  let shelf: Shelf | undefined;
  const list = h('div', { class: 'lib-shelf', id: 'lib-shelf' }, h('p', { class: 'lib-loading' }, 'Taking everything off the shelves…'));
  const count = h('p', { class: 'lib-count', role: 'status' });
  const buttons = ORDERS.map(([o, label]) =>
    h(
      'button',
      {
        type: 'button',
        class: 'lib-order',
        'aria-controls': 'lib-shelf',
        onclick: () => {
          order = o;
          rememberOrder(o);
          state.set({ by: o === 'game' ? undefined : o });
          show();
        },
      },
      label,
    ),
  );
  const show = () => {
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(ORDERS[i][0] === order)));
    if (!shelf) return;
    const groups = groupShelf(shelf.items, order);
    list.replaceChildren(...groups.map((g) => groupSection(g, shelf!, order)));
    count.textContent = `${shelf.items.length} things to read and print, in ${groups.length} ${order === 'game' ? 'groups' : 'kinds'}`;
  };
  show();
  clear(
    el,
    h(
      'main',
      { class: 'library', 'aria-labelledby': 'lib-h' },
      h('p', { class: 'lib-kicker' }, 'Everything to read and print'),
      h('h1', { id: 'lib-h' }, 'Library'),
      h(
        'p',
        { class: 'lead' },
        'Every manual, map, newsletter, sticker sheet and card that comes in the boxes, with TURBO BUTTON magazine and the Guide. Open one to read it on screen or print it.',
      ),
      h('div', { class: 'lib-bar' }, h('div', { class: 'lib-orders', role: 'group', 'aria-label': 'Sort the library' }, buttons), count),
      list,
    ),
  );
  void loadShelf()
    .then((s) => {
      shelf = s;
      if (list.isConnected) show();
    })
    .catch(() => list.replaceChildren(h('p', { class: 'lib-loading' }, 'The shelves could not be loaded. Try reloading the page.')));
}
