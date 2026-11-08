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
import { h, clear, modal } from '../editor/core/ui';
import { viewState } from '../urlState';
import { loadHostedGame, type CatalogEntry } from '../project/files';
import {
  groupShelf,
  hms,
  inSeries,
  isSeries,
  isShelfOrder,
  ownersOf,
  SITE_OWNER,
  type ShelfGroup,
  type ShelfItem,
  type Series,
  type ShelfOrder,
} from './shelf';
import { loadShelf, type Shelf } from './listing';
import { rememberGame, rememberOnly, rememberOrder, rememberSeries, savedGame, savedSeries, savedOnly, savedOrder } from './prefs';
import { forgetThumbs, lazyThumb } from './thumbs';
import { tally, unlockAchievement } from '../achievements';
import { openFromLibrary, readerOpen } from './readerAddress';
import { onCatalogChanged } from '../project/catalogWatch';
import { originId } from '../editor/shell/homeOrigin';
import { libraryStartGame } from '../libraryStart';
import { drawerId, makeCabinet, plaque } from './cabinet';
import { inCallOrder } from './callOrder';
import { makeCopier } from './copier';
import { makeRoom } from './libraryRoom';
import { callNumber } from './tinyShelf';
import { makeSpine } from './spines';
import { lSpaceTrip } from './lSpace';
import { startAmbience } from './ambience';
import { startLibraryMusic } from './libraryMusic';

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

/** Closes the dialog open now, if any (a piece opens in its own viewer, which must not sit behind it). */
let closeDialog: () => void = () => undefined;

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

function card(item: ShelfItem, shelf: Shelf, order: ShelfOrder, oneGame: boolean): HTMLElement {
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
  // by type, a game's or the Game-Maker box's card says whose it is; by game, or with one game picked, the heading or
  // picker does, so it says what it is
  const sub = order === 'type' && !oneGame && item.owner !== SITE_OWNER && !item.boxes && !item.title.startsWith(item.ownerTitle) ? item.ownerTitle : item.note;
  // an issue's number over its picture, readable at a glance (said to a screen reader in the card's text)
  const length = item.seconds !== undefined ? hms(item.seconds) : undefined;
  const badgeText = item.issue ? `No. ${item.issue.no}` : length;
  const badge = badgeText ? h('span', { class: `lib-badge${length ? ' lib-length' : ''}`, 'aria-hidden': 'true' }, badgeText) : null;
  // a game's walkthrough video on its game's shelf, with no Videos heading over it, is marked as YouTube's
  const yt =
    item.open.via === 'video' && order === 'game' && item.owner !== SITE_OWNER
      ? h('span', { class: 'lib-badge lib-yt', 'aria-hidden': 'true' }, '▶ YouTube')
      : null;
  const body = [
    frame,
    badge,
    yt,
    h(
      'span',
      { class: 'lib-name' },
      h('strong', null, item.title),
      sub ? h('small', null, sub) : null,
      // the same in several boxes: listed once, opened from the first
      item.boxes ? h('small', { class: 'lib-boxes' }, `In ${item.boxes} boxes`) : null,
      item.issue ? h('span', { class: 'sr-only' }, `Issue ${item.issue.no}`) : null,
      // a video plays from YouTube, not in the offline copy: its heading says so (onlineNote); this says it to a screen reader
      item.open.via === 'video' ? h('span', { class: 'sr-only' }, 'Plays from YouTube: needs the internet') : null,
      // the badge over the picture shows the length; this says it to a screen reader
      length ? h('span', { class: 'sr-only' }, `Length ${length}`) : null,
    ),
    // the spine label, over the picture's foot
    h('span', { class: 'lib-spine', title: 'Tiny Shelf call number' }, callNumber(item)),
  ];
  const el =
    item.open.via === 'href'
      ? h('a', { class: 'lib-card', href: item.open.href, onclick: () => tally('library-kinds', item.type) }, ...body)
      : h('button', { type: 'button', class: 'lib-card', onclick: () => (closeDialog(), void openPiece(item, shelf.games, el)) }, ...body);
  return h('li', null, el);
}

/** A heading's words, and for a shelf of videos alone, once, that they play from the internet. */
function onlineNote(heading: string, items: readonly ShelfItem[]): (string | HTMLElement)[] {
  return items.length && items.every((i) => i.open.via === 'video') ? [heading, ' ', h('span', { class: 'lib-net' }, '(needs the internet)')] : [heading];
}

/** A drawer's case: its brass plate with how many it holds (and `aside`, the game picker, across from it), then its shelves. */
function groupSection(g: ShelfGroup, shelf: Shelf, order: ShelfOrder, of: number, aside: HTMLElement, oneGame: boolean): HTMLElement {
  const id = `lib-${g.key}`;
  const n = g.parts.reduce((k, p) => k + p.items.length, 0);
  return h(
    'section',
    { class: 'lib-group', 'aria-labelledby': id },
    h(
      'div',
      { class: 'lib-plate-row' },
      h(
        'h2',
        { id },
        ...onlineNote(
          g.heading,
          g.parts.flatMap((p) => p.items),
        ),
        h('span', { class: 'lib-plate-n' }, n < of ? `${n} of ${of}` : String(n)),
      ),
      aside,
    ),
    ...g.parts.flatMap((p) => [
      p.heading ? h('h3', null, ...onlineNote(p.heading, p.items)) : null,
      h('ul', { class: 'lib-grid' }, ...p.items.map((it) => card(it, shelf, order, oneGame))),
    ]),
  );
}

/** The Library page into `el`. */
export function renderLibrary(el: HTMLElement): void {
  unlockAchievement('library-visit');
  const state = viewState(['library']);
  // the address only moved within the Game-Maker box (a chapter, Back, closing it): the shelves stay
  const shelfKey = () => ['by', 'only', 'game', 'series'].map((k) => state.get(k) ?? '').join('|');
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
  // By type: all the games' papers, or the Sandbox ones, or the Bizarre ones
  const askedSeries = state.get('series');
  let series: Series = isShelfOrder(asked) ? (isSeries(askedSeries) ? askedSeries : 'all') : savedSeries();
  let shelf: Shelf | undefined;
  const list = h('div', { class: 'lib-shelf', id: 'lib-shelf', role: 'tabpanel' }, h('p', { class: 'lib-loading' }, 'Taking everything off the shelves…'));
  // said, not shown: the plate shows how many (the room's Joe reads this too)
  const count = h('p', { class: 'lib-count sr-only', role: 'status' });
  const cabinet = makeCabinet((key) => {
    only = key.replace(/^(game|type)-/, '');
    rememberOnly(order, only);
    keepAddress();
    show();
    closeDialog();
  });
  const copier = makeCopier(
    (item, from) => openPiece(item, shelf?.games ?? new Map(), from),
    () => {
      order = 'type';
      only = 'stickers';
      rememberOrder(order);
      rememberOnly(order, only);
      keepAddress();
      show();
      closeDialog();
      void showStacks();
    },
  );
  list.tabIndex = -1;
  const root = h('main', { class: 'library', 'aria-labelledby': 'lib-h' });
  let busy = false;
  const mark = (name: string | undefined) => state.set({ open: name });
  /** Shows nodes in a dialog (the address keeps its name so a reload reopens it), then returns focus to `from`. */
  const dialog = async (name: string, title: string, nodes: Node[], from?: HTMLElement, cls = '') => {
    if (busy) return;
    busy = true;
    mark(name);
    const away = () => {
      if (!location.hash.startsWith('#/library')) closeDialog();
    };
    window.addEventListener('hashchange', away);
    await modal<void>(title, (close) => {
      closeDialog = () => close(undefined);
      return [
        h('div', { class: `lib-dlg ${cls}`.trim(), dataset: { listArea: '' } }, ...nodes),
        // a long shelf starts at its top: there the dialog's own × takes the focus, not Close at the foot
        h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: !cls, onclick: () => close(undefined) }, 'Close')),
      ];
    });
    window.removeEventListener('hashchange', away);
    closeDialog = () => undefined;
    busy = false;
    mark(undefined);
    from?.focus();
  };
  const fromRoom = (cls: string) => root.querySelector<HTMLElement>(`.lib-o-${cls}`) ?? undefined;
  // the drawer's name is on the case's plate, so the dialog's title is only said
  const showStacks = () =>
    dialog('stacks', `The stacks: ${list.getAttribute('data-name') ?? 'the open drawer'}`, [count, list], fromRoom('stacks'), 'lib-stacks');
  const showCatalog = () =>
    dialog(
      'catalog',
      'Card catalog',
      [
        h('div', { class: 'lib-bar' }, h('div', { class: 'lib-orders', role: 'group', 'aria-label': 'Sort the library' }, buttons)),
        h('div', { class: 'lib-case' }, plaque(), cabinet.el),
      ],
      fromRoom('catalog'),
    );
  const showCopier = () => dialog('copier', 'Copier', [copier.el], fromRoom('copier'));
  // the toy box (toyBox.ts) loads when opened
  const showToyBox = async () => {
    const { makeToyBox } = await import('./toyBox');
    return dialog('toybox', 'Toy box: 3D-printable trinkets', [makeToyBox()], fromRoom('toybox'), 'lib-toy');
  };
  // the TV: the site's videos, then every listed game's walkthroughs (by length) and walkthrough videos, the same cards as the shelves
  const showTv = () => {
    const items = (shelf?.items ?? []).filter((i) => i.type === 'video' || i.type === 'walkthrough');
    const section = (heading: string, of: ShelfItem[]) =>
      of.length
        ? h(
            'section',
            { class: 'lib-group' },
            h('div', { class: 'lib-plate-row' }, h('h2', null, ...onlineNote(heading, of))),
            h('ul', { class: 'lib-grid' }, ...of.map((it) => card(it, shelf!, 'type', false))),
          )
        : null;
    const groups = groupShelf(items, 'type');
    const parts = groups.flatMap((g) => g.parts.map((p) => section(p.heading ?? g.heading, p.items)));
    return dialog(
      'tv',
      'TV: videos and walkthroughs',
      [h('div', { class: 'lib-shelf' }, ...(parts.some(Boolean) ? parts : [h('p', { class: 'lead' }, 'Nothing is on the TV yet.')]))],
      fromRoom('tv'),
      'lib-stacks lib-tv',
    );
  };
  const dialogs: Record<string, () => unknown> = { stacks: showStacks, catalog: showCatalog, copier: showCopier, toybox: showToyBox, tv: showTv };
  const room = makeRoom({
    status: () => count.textContent ?? '',
    mark,
    go: (where) => {
      if (where === 'stacks') void showStacks();
      else if (where === 'catalog') void showCatalog();
      else if (where === 'copier') void showCopier();
      else if (where === 'toybox') void showToyBox();
      else if (where === 'tv') void showTv();
      else if (shelf)
        void lSpaceTrip(groupShelf(shelf.items, 'game').map(pickOf), (id) => {
          order = 'game';
          only = id;
          rememberOrder(order);
          rememberOnly(order, only);
          keepAddress();
          show();
          void showStacks();
        });
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
  const SERIES_LABELS: [Series, string][] = [
    ['all', 'All'],
    ['sandbox', 'Sandbox'],
    ['bizarre', 'Bizarre'],
  ];
  const seriesRadios = SERIES_LABELS.map(([v, label]) =>
    h(
      'label',
      { class: 'lib-seg' },
      h('input', {
        type: 'radio',
        name: 'lib-series',
        value: v,
        onchange: () => {
          series = v;
          rememberSeries(series);
          keepAddress();
          show();
        },
      }),
      h('span', null, label),
    ),
  );
  const seriesPick = h('fieldset', { class: 'lib-series', hidden: true }, h('legend', { class: 'lib-only-label' }, 'Show'), ...seriesRadios);
  const keepAddress = () => {
    state.set({
      by: order === 'game' && !only ? undefined : order,
      only,
      game: order === 'type' && only ? game : undefined,
      series: order === 'type' && series !== 'all' ? series : undefined,
    });
    el.dataset.library = shelfKey();
  };
  const buttons = ORDERS.map(([o, label]) =>
    h(
      'button',
      {
        type: 'button',
        class: 'lib-order',
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
    if (!shelf) return;
    seriesPick.hidden = order !== 'type';
    seriesRadios.forEach((l, i) => (l.querySelector('input')!.checked = SERIES_LABELS[i][0] === (order === 'type' ? series : 'all')));
    const items = order === 'type' ? inSeries(shelf.items, series, shelf.games) : shelf.items;
    const groups = inCallOrder(groupShelf(items, order), order);
    // a pick this shelf doesn't have (a game gone, an old link), or none, opens the first drawer
    if (only && !groups.some((g) => pickOf(g) === only)) only = undefined;
    const open = groups.find((g) => pickOf(g) === only) ?? groups[0];
    cabinet.update(groups, open?.key ?? '', order);
    copier.update(open ? open.parts.flatMap((p) => p.items) : []);
    if (open) {
      list.setAttribute('aria-labelledby', drawerId(open.key));
      list.setAttribute('data-name', open.heading);
    }
    let shown = open ? [open] : [];
    // one kind (By type) from several games: a second picker for the game
    const owners = order === 'type' && shown[0] ? ownersOf(shown[0].parts[0].items) : [];
    gamePick.hidden = owners.length < 2;
    const pickedGame = !gamePick.hidden && owners.some((o) => o.owner === game) ? game : undefined;
    gamePicker.replaceChildren(h('option', { value: '' }, 'All games'), ...owners.map((o) => h('option', { value: o.owner }, o.title)));
    gamePicker.value = pickedGame ?? '';
    if (pickedGame) shown = shown.map((g) => ({ ...g, parts: g.parts.map((p) => ({ ...p, items: p.items.filter((i) => i.owner === pickedGame) })) }));
    forgetThumbs(list.querySelectorAll('.lib-thumb')); // the old cards' pictures are no longer wanted
    const whole = open ? open.parts.reduce((k, p) => k + p.items.length, 0) : 0;
    const aside = h('span', { class: 'lib-aside' }, seriesPick, gamePick);
    list.replaceChildren(...shown.map((g) => groupSection(g, shelf!, order, whole, aside, !!pickedGame)));
    room.setShelf({
      items: shown.flatMap((g) => g.parts.flatMap((p) => p.items)).map((it) => makeSpine(it, (from) => void openPiece(it, shelf!.games, from))),
      more: () => makeSpine(undefined, () => void showStacks()),
    });
    const n = shown.reduce((sum, g) => sum + g.parts.reduce((k, p) => k + p.items.length, 0), 0);
    count.textContent = `${n} of ${items.length} things to read and print, in ${groups.length} ${order === 'game' ? 'drawers' : 'kinds'}`;
  };
  show();
  root.append(h('h1', { id: 'lib-h' }, 'Library'), room.el);
  clear(el, root);
  startAmbience(room.el);
  startLibraryMusic(room.el);
  el.dataset.library = shelfKey();
  // a link to a piece of the Game-Maker box, at a chapter (#/library?gm=ultimate&ch=12)
  if (gm) void openFromLibrary(gm, state.get('ch'), false);
  void loadShelf()
    .then((s) => {
      shelf = s;
      if (!root.isConnected) return;
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
      const want = state.get('open');
      if (want && dialogs[want]) void dialogs[want]();
      else if (want) room.open(want);
    })
    .catch(() => list.replaceChildren(h('p', { class: 'lib-loading' }, 'The shelves could not be loaded. Try reloading the page.')));
  // a secret game revealed or hidden again (the felt eggs, the tin hearts, EGG.EXE): its pieces join or leave without a reload
  unwatchShelf?.();
  const unwatch = (unwatchShelf = onCatalogChanged(() => {
    if (!root.isConnected) return unwatch();
    void loadShelf()
      .then((s) => {
        if (!root.isConnected) return;
        shelf = s;
        show();
      })
      .catch(() => undefined); // the shelf as it was
  }));
}
