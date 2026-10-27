// The Library (#/library): everything on the site to read or print, a card each, sorted by game
// or by the kind of paper (#/library?by=type), narrowed to one game or kind (&only=levelmap) and,
// within a kind, to one game (&game=teddy), all
// remembered per browser (prefs.ts). A card opens its piece
// in the viewer that already shows it: its game's box (manual/gameManual.ts), the Game-Maker
// box (manual/dosManual.ts), TURBO BUTTON, the Guide, the desk's zine (manual/zine), a game's
// walkthrough, or a video's player (videoDialog.ts: nothing comes from YouTube until Play). The
// Game-Maker box's piece and chapter stay in the address (&gm=ultimate&ch=12, readerAddress.ts).
// Opened without a sort in the address just after showing one game (its page, a look inside it,
// or a copy of it being made), it starts on that game's shelf instead (../libraryStart.ts). A
// "Showing: <game> · All games" line says what is picked and goes back to everything.
// Below the shelves, your imported games' ratings and notes (imported/notesShelf.ts).
import './library.css';
import { h, clear } from '../editor/core/ui';
import { viewState } from '../urlState';
import { loadHostedGame, type CatalogEntry } from '../project/files';
import { groupShelf, hms, isShelfOrder, ownersOf, SITE_OWNER, type ShelfGroup, type ShelfItem, type ShelfOrder } from './shelf';
import { loadShelf, type Shelf } from './listing';
import { rememberGame, rememberOnly, rememberOrder, savedGame, savedOnly, savedOrder } from './prefs';
import { forgetThumbs, lazyThumb } from './thumbs';
import { tally, unlockAchievement } from '../achievements';
import { openFromLibrary, readerOpen } from './readerAddress';
import { onCatalogChanged } from '../project/catalogWatch';
import { originId } from '../editor/shell/homeOrigin';
import { libraryStartGame } from '../libraryStart';

/** Stops the last Library page's watch on the catalog (a secret game revealed or hidden again). */
let unwatchShelf: (() => void) | undefined;

const ORDERS: [ShelfOrder, string][] = [
  ['game', 'By game'],
  ['type', 'By type'],
];

/** A group's name in the address and the picker: a game's id, "other", or a kind of paper. */
const pickOf = (g: ShelfGroup) => g.key.replace(/^(game|type)-/, '');

/** Waits for a box viewer to be on screen (or `done` to settle), for a card's "Opening…". */
function whenShown(done: Promise<unknown>, shown = '.gmb'): Promise<void> {
  return new Promise((resolve) => {
    const watch = new MutationObserver(() => document.querySelector(shown) && finish());
    const finish = () => (watch.disconnect(), resolve());
    watch.observe(document.body, { childList: true });
    done.then(finish, finish);
  });
}

/** Opens a card's piece where the site already shows it. */
async function openPiece(item: ShelfItem, games: Map<string, CatalogEntry>, from: HTMLElement): Promise<void> {
  const o = item.open;
  if (o.via === 'href' || from.hasAttribute('aria-busy')) return; // a link, or opening already
  tally('library-kinds', item.type);
  from.setAttribute('aria-busy', 'true');
  from.classList.add('opening');
  try {
    if (o.via === 'box') {
      const entry = games.get(o.game);
      if (!entry) return;
      const m = await import('../manual/gameManual');
      const done = o.maps ? m.openGameMaps(entry, undefined, o.start) : m.openGameManual(entry, undefined, undefined, o.start);
      await whenShown(done);
    } else if (o.via === 'print') {
      const entry = o.game ? games.get(o.game) : undefined;
      if (o.game && !entry) return;
      const { openPrintShop } = await import('../manual/printables/printShop');
      await whenShown(openPrintShop(o.start, entry));
    } else if (o.via === 'gm') {
      await whenShown(openFromLibrary(o.start, undefined, true));
    } else if (o.via === 'walk') {
      const entry = games.get(o.game);
      if (!entry) return;
      const { watchWalkthrough } = await import('../walkthrough/player');
      await whenShown(
        watchWalkthrough(entry, () => loadHostedGame(entry)),
        '.wt-screen',
      );
    } else if (o.via === 'video') {
      const { openVideo } = await import('./videoDialog');
      await whenShown(openVideo(o.id, item.title, item.picture), '.lib-video');
    } else {
      const { openZine } = await import('../manual/zine/zineItem');
      await whenShown(openZine());
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
    bookCover(item, entry) ??
      (item.picture
        ? h('img', { class: 'lib-picture', src: item.picture, alt: '', loading: 'lazy', decoding: 'async' })
        : h('span', { class: 'lib-icon' }, item.icon)),
  );
  const make = shelf.thumbs.get(item.key);
  if (make) lazyThumb(frame, item.key, make);
  // by type, a game's or the Game-Maker box's card says whose it is; by game, the heading does, so it says what it is
  const sub = order === 'type' && item.owner !== SITE_OWNER && !item.boxes && !item.title.startsWith(item.ownerTitle) ? item.ownerTitle : item.note;
  // an issue's number over its picture, readable at a glance (the card's text says it too)
  const length = item.seconds !== undefined ? hms(item.seconds) : undefined;
  const badgeText = item.issue ? `No. ${item.issue.no}` : length;
  const badge = badgeText ? h('span', { class: `lib-badge${length ? ' lib-length' : ''}`, 'aria-hidden': 'true' }, badgeText) : null;
  const body = [
    frame,
    badge,
    h(
      'span',
      { class: 'lib-name' },
      h('strong', null, item.title),
      sub ? h('small', null, sub) : null,
      // the same in several boxes: listed once, opened from the first
      item.boxes ? h('small', { class: 'lib-boxes' }, `In ${item.boxes} boxes`) : null,
      item.issue ? h('small', { class: 'lib-boxes' }, item.issue.line) : null,
      // a video plays from YouTube: not in the offline copy
      item.open.via === 'video' ? h('small', { class: 'lib-boxes' }, 'Needs the internet') : null,
      // the badge over the picture shows the length; this says it to a screen reader
      length ? h('span', { class: 'sr-only' }, `Length ${length}`) : null,
    ),
  ];
  const el =
    item.open.via === 'href'
      ? h('a', { class: 'lib-card', href: item.open.href, onclick: () => tally('library-kinds', item.type) }, ...body)
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
  unlockAchievement('library-visit');
  const state = viewState(['library']);
  // the address only moved within the Game-Maker box (a chapter, Back, closing it): the shelves stay
  const shelfKey = () => ['by', 'only', 'game'].map((k) => state.get(k) ?? '').join('|');
  const gm = state.get('gm');
  if (el.dataset.library === shelfKey() && el.querySelector(':scope > .library')) {
    if (gm && !readerOpen()) void openFromLibrary(gm, state.get('ch'), false); // Forward, back into it
    return;
  }
  const asked = state.get('by');
  let order: ShelfOrder = isShelfOrder(asked) ? asked : (savedOrder() ?? 'game');
  // the address's pick when it named the sort, else the one last picked for this sort
  let only = isShelfOrder(asked) ? state.get('only') : savedOnly(order);
  // within a kind, one game's pieces (By type only)
  let game = isShelfOrder(asked) ? state.get('game') : savedGame();
  let shelf: Shelf | undefined;
  const list = h('div', { class: 'lib-shelf', id: 'lib-shelf' }, h('p', { class: 'lib-loading' }, 'Taking everything off the shelves…'));
  const count = h('p', { class: 'lib-count', role: 'status' });
  // what is picked, said plainly, with the way back to everything beside it
  const showingName = h('strong');
  const showAll = h('button', {
    type: 'button',
    class: 'lib-show-all',
    'aria-controls': 'lib-shelf',
    onclick: () => {
      only = undefined;
      rememberOnly(order, only);
      keepAddress();
      show();
      picker.focus();
    },
  });
  const showing = h('p', { class: 'lib-showing', hidden: true }, 'Showing: ', showingName, h('span', { 'aria-hidden': 'true' }, ' · '), showAll);
  const pickLabel = h('label', { for: 'lib-only', class: 'lib-only-label' });
  const picker = h('select', {
    id: 'lib-only',
    class: 'lib-only',
    'aria-controls': 'lib-shelf',
    onchange: () => {
      only = picker.value || undefined;
      rememberOnly(order, only);
      keepAddress();
      show();
    },
  });
  const gamePicker = h('select', {
    id: 'lib-game',
    class: 'lib-only',
    'aria-controls': 'lib-shelf',
    onchange: () => {
      game = gamePicker.value || undefined;
      rememberGame(game);
      keepAddress();
      show();
    },
  });
  const gamePick = h('span', { class: 'lib-pick', hidden: true }, h('label', { for: 'lib-game', class: 'lib-only-label' }, 'Game'), gamePicker);
  const keepAddress = () => {
    state.set({ by: order === 'game' && !only ? undefined : order, only, game: order === 'type' && only ? game : undefined });
    el.dataset.library = shelfKey();
  };
  const buttons = ORDERS.map(([o, label]) =>
    h(
      'button',
      {
        type: 'button',
        class: 'lib-order',
        'aria-controls': 'lib-shelf',
        onclick: () => {
          if (o === order) return;
          order = o;
          only = savedOnly(o);
          rememberOrder(o);
          keepAddress();
          show();
        },
      },
      label,
    ),
  );
  const show = () => {
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(ORDERS[i][0] === order)));
    pickLabel.textContent = order === 'game' ? 'Game' : 'Kind';
    if (!shelf) return;
    const groups = groupShelf(shelf.items, order);
    // a pick this shelf doesn't have (a game gone, an old link) shows everything
    if (only && !groups.some((g) => pickOf(g) === only)) only = undefined;
    picker.replaceChildren(
      h('option', { value: '' }, order === 'game' ? 'All games' : 'All kinds'),
      ...groups.map((g) => h('option', { value: pickOf(g) }, g.heading)),
    );
    picker.value = only ?? '';
    showing.hidden = !only;
    showingName.textContent = groups.find((g) => pickOf(g) === only)?.heading ?? '';
    showAll.textContent = order === 'game' ? 'All games' : 'All kinds';
    let shown = only ? groups.filter((g) => pickOf(g) === only) : groups;
    // one kind (By type) from several games: a second picker for the game
    const owners = order === 'type' && only && shown[0] ? ownersOf(shown[0].parts[0].items) : [];
    gamePick.hidden = owners.length < 2;
    const pickedGame = !gamePick.hidden && owners.some((o) => o.owner === game) ? game : undefined;
    gamePicker.replaceChildren(h('option', { value: '' }, 'All games'), ...owners.map((o) => h('option', { value: o.owner }, o.title)));
    gamePicker.value = pickedGame ?? '';
    if (pickedGame) shown = shown.map((g) => ({ ...g, parts: g.parts.map((p) => ({ ...p, items: p.items.filter((i) => i.owner === pickedGame) })) }));
    forgetThumbs(list.querySelectorAll('.lib-thumb')); // the old cards' pictures are no longer wanted
    list.replaceChildren(...shown.map((g) => groupSection(g, shelf!, order)));
    const n = shown.reduce((sum, g) => sum + g.parts.reduce((k, p) => k + p.items.length, 0), 0);
    count.textContent = only
      ? `${n} of ${shelf.items.length} things to read and print`
      : `${shelf.items.length} things to read and print, in ${groups.length} ${order === 'game' ? 'groups' : 'kinds'}`;
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
        'Every manual, map, newsletter, sticker sheet and card that comes in the boxes, with TURBO BUTTON magazine, the Guide, each game’s walkthrough and videos touring the site. Open one to read it on screen, print it or watch it.',
      ),
      h(
        'div',
        { class: 'lib-bar' },
        h('div', { class: 'lib-orders', role: 'group', 'aria-label': 'Sort the library' }, buttons),
        h('span', { class: 'lib-pick' }, pickLabel, picker),
        gamePick,
        count,
      ),
      showing,
      list,
    ),
  );
  el.dataset.library = shelfKey();
  // the imported games' ratings and notes, removed ones too (imported/notesShelf.ts), when there are any
  const page = el.querySelector<HTMLElement>(':scope > .library');
  void import('../imported/notesShelf')
    .then((m) => m.notesShelf())
    .then((notes) => notes && page?.isConnected && page.append(notes))
    .catch(() => undefined);
  // a link to a piece of the Game-Maker box, at a chapter (#/library?gm=ultimate&ch=12)
  if (gm) void openFromLibrary(gm, state.get('ch'), false);
  void loadShelf()
    .then((s) => {
      shelf = s;
      if (!list.isConnected) return;
      // no sort in the address, just after showing one game with paper here: start on its shelf, as if picked
      const start = isShelfOrder(asked) ? undefined : libraryStartGame((id) => groupShelf(s.items, 'game').some((g) => pickOf(g) === id), originId);
      if (start) {
        order = 'game';
        only = start;
        rememberOrder(order);
        rememberOnly(order, only);
        keepAddress();
      }
      show();
    })
    .catch(() => list.replaceChildren(h('p', { class: 'lib-loading' }, 'The shelves could not be loaded. Try reloading the page.')));
  // a secret game revealed or hidden again (the felt eggs, the tin hearts, EGG.EXE): its pieces join or leave without a reload
  unwatchShelf?.();
  const unwatch = (unwatchShelf = onCatalogChanged(() => {
    if (!list.isConnected) return unwatch();
    void loadShelf()
      .then((s) => {
        if (!list.isConnected) return;
        shelf = s;
        show();
      })
      .catch(() => undefined); // the shelf as it was
  }));
}
