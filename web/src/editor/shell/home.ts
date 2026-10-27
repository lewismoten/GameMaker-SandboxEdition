// Home page: one game shown large (a featured one, or the one you chose; see
// homeShowcase.ts) and the library: tabs for the collections (your games, the Sandbox games,
// The Bard of Bizarre's once there are enough of them (bizarre.ts), the CD's gameware and the
// shareware; homeCategories.ts) with search and "New game" beside them, and the chosen
// collection's games as small picture tiles (homeCards.ts, laid out by homeLibraryCards.ts
// from homeLibrary.ts's lists). Choosing a collection features
// one of its games at random. On a wide window
// the game sits in a column beside the library and the page fits the window, the tiles
// scrolling by themselves when there are many; narrower, everything stacks. A chosen game is
// kept in the address (#/game/cd:<id> or #/game/my:<id>), with the collection and search
// (?tab=sandbox&q=snow), so a reload or a link shows the same.
import { h, clear, toast } from '../core/ui';
import { loadGameList } from '../../project/files';
import { hasBizarreTab } from '../../project/bizarre';
import { listProjects } from '../../project/storage';
import { onCatalogChanged } from '../../project/catalogWatch';
import './home.css';
import { PRODUCT } from '../../edition';
import type { HomeGame } from './homeCards';
// the lists before the showcase, as the tiles' styles (homeCards.ts) come first
import { categoryOf, homeLibrary, isByMaker, isOwn, SORT_KEY, type MySort } from './homeLibrary';
import { showcase } from './homeShowcase';
import { icon } from './homeIcons';
import { CATEGORIES, CATEGORY_KEY, FIRST_CATEGORY, pickFeatured, savedCategory, type Category } from './homeCategories';
import { batchOf } from './importBatch';
import { lastUsed } from '../../project/projectUse';
import { NOTES_CHANGED } from '../../imported/gameNotes';
import { ratingFilterBox, savedRatingFilter } from './homeRatings';
import { currentRoute, formatHash, setHashParams, type ParamValue } from '../../urlState';
import { libraryCards } from './homeLibraryCards';
import { tilePacker } from './homeTilePack';
import { tileArrowKeys } from './homeTileKeys';
import { gettingStarted } from './homeGettingStarted';
import { homeImport, importTile, libraryDrops } from './homeDrop';

export interface HomeNav {
  openProject(id: string): void;
}

/** "Describe a game…": the Assistant chat builds a new game from a description (assistant/chat/homeDescribe.ts, loaded when pressed). */
function describeButton(nav: HomeNav): HTMLElement {
  return h(
    'button',
    {
      class: 'lib-describe',
      type: 'button',
      title: 'Say what the game should be, and your own AI (Ollama or OpenAI) builds a first level',
      onclick: () => void import('../../assistant/chat/homeDescribe').then((m) => m.describeGame(nav)),
    },
    h('span', { 'aria-hidden': 'true' }, '✦ '),
    'Describe',
    h('span', { class: 'lib-describe-more' }, ' a game…'),
  );
}

/** The game named in the address (#/game/<key>), if any. */
const hashKey = () => {
  const { path } = currentRoute();
  return path[0] === 'game' ? (path[1] ?? '') : '';
};

/** Still on the home page (#/ or #/game/…): a late change must not touch another page's address. */
const onHome = () => [undefined, 'game'].includes(currentRoute().path[0]);

/** Keeps the home page's choices (collection, search) in the address, as #/…?tab=…&q=…. */
const keep = (changes: Record<string, ParamValue>) => onHome() && setHashParams(changes);

/** Shows `path` (a game, or none) in the address, keeping the settings. */
function showPath(path: string[]): void {
  if (!onHome()) return;
  const { params } = currentRoute();
  const next = formatHash(path, params);
  if (next !== location.hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${next}`);
}

/** The last home page's watch on the catalog (one home page at a time). */
let unwatchHome: (() => void) | undefined;

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  unwatchHome?.();
  unwatchHome = undefined;
  const catNav = h('div', { class: 'lib-cats', role: 'tablist', 'aria-label': 'Game collections' });
  const libTitle = h('h2', { id: 'lib-title' });
  // the collection in a line (cut short with … if it must be); More shows all of it
  const libLeadText = h('span', { class: 'lib-lead-text' });
  const leadMore = h('button', {
    type: 'button',
    class: 'lib-lead-more',
    'aria-expanded': 'false',
    'aria-controls': 'lib-lead',
    onclick: () => showLead(leadMore.getAttribute('aria-expanded') !== 'true'),
  });
  const libLead = h('p', { class: 'lead', id: 'lib-lead' }, libLeadText, leadMore);
  const showLead = (all: boolean) => {
    const info = CATEGORIES.find((x) => x.id === current)!;
    libLeadText.textContent = all ? info.lead : info.short;
    libLead.title = all ? '' : info.lead;
    libLead.classList.toggle('open', all);
    leadMore.setAttribute('aria-expanded', String(all));
    leadMore.textContent = all ? 'Less' : 'More';
    leadMore.setAttribute('aria-label', all ? `Less about ${info.name}` : `More about ${info.name}`);
  };
  const tiles = h('div', { id: 'lib-panel', class: 'cards lib-tiles', role: 'tabpanel' }, h('p', { class: 'meta' }, 'Loading…'));
  const search = h('input', {
    type: 'search',
    class: 'lib-search',
    placeholder: 'Find a game…',
    'aria-label': 'Find a game',
    oninput: () => {
      filterTiles();
      keep({ q: search.value.trim() });
    },
  });
  // where games come in, as one more tile: drop them on it (or anywhere in the library), or pick them
  const dropTile = importTile(nav, () => void refreshProjects());
  const lib = homeLibrary();
  // an import can bring in hundreds: all of them go at once (importRemove.ts, loaded when used)
  const removeAllBtn = h(
    'button',
    { type: 'button', class: 'lib-remove-all', hidden: true, onclick: () => void import('./importRemove').then((m) => m.removeImported(refreshProjects)) },
    'Remove all imported…',
  );
  const sortBox = h(
    'label',
    { class: 'lib-sort' },
    'Sort by ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          lib.sort = (e.target as HTMLSelectElement).value as MySort;
          try {
            localStorage.setItem(SORT_KEY, lib.sort);
          } catch {
            /* not remembered */
          }
          void select(current);
        },
      },
      h('option', { value: 'edited', selected: lib.sort === 'edited' }, 'Last edited'),
      h('option', { value: 'name', selected: lib.sort === 'name' }, 'Name'),
      h('option', { value: 'rating', selected: lib.sort === 'rating' }, 'Rating (Imported)'),
    ),
  );
  // Imported narrowed to one rating, or Unrated (homeRatings.ts)
  let ratingFilter = savedRatingFilter();
  const ratingBox = ratingFilterBox(ratingFilter, (f) => {
    ratingFilter = f;
    void select(current);
  });
  let current: Category = savedCategory() ?? FIRST_CATEGORY;

  const filterTiles = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const t of tiles.querySelectorAll<HTMLElement>('.card:not(.lib-drop-tile)')) {
      const hit = !q || (t.dataset.search ?? '').includes(q);
      t.hidden = !hit;
      if (hit) shown++;
    }
    // a collection's heading only while one of its games shows
    for (const sub of tiles.querySelectorAll<HTMLElement>('.lib-sub')) {
      let any = false;
      for (let e = sub.nextElementSibling as HTMLElement | null; e && !e.classList.contains('lib-sub'); e = e.nextElementSibling as HTMLElement | null)
        any ||= e.classList.contains('card') && !e.hidden;
      sub.hidden = !any;
    }
    tiles.querySelector('.lib-none')?.remove();
    pack();
    if (!q || shown) return;
    // nothing here: point to the collections that have it
    const elsewhere = lib
      .shownCats()
      .filter((c) => c.id !== current)
      .map((c) => ({ c, n: lib.gamesOf(c.id).filter((g) => g.search.includes(q)).length }))
      .filter((x) => x.n);
    tiles.append(
      h(
        'div',
        { class: 'meta lib-none', role: 'status' },
        `No game in ${CATEGORIES.find((c) => c.id === current)!.name} matches “${search.value.trim()}”.`,
        ...elsewhere.map(({ c, n }) =>
          h(
            'button',
            { type: 'button', class: 'lib-elsewhere', onclick: () => void select(c.id, true).then(() => document.getElementById(`lib-tab-${c.id}`)?.focus()) },
            `${c.name} has ${n} →`,
          ),
        ),
      ),
    );
  };

  const packer = tilePacker(tiles);
  const pack = () => packer.pack(isByMaker(current), !!search.value.trim(), current === 'imported');
  new ResizeObserver(() => pack()).observe(tiles);

  const markSelected = () => {
    const key = top.game?.key;
    for (const t of tiles.querySelectorAll<HTMLElement>('.game-tile')) {
      const on = t.dataset.key === key;
      t.classList.toggle('selected', on);
      t.querySelector('.tile-select')?.setAttribute('aria-current', on ? 'true' : 'false');
    }
  };

  /** Shows a game at the top because the visitor chose it. */
  const choose = (game: HomeGame) => {
    top.show(game, {});
    showPath(['game', game.key]);
    markSelected();
    const r = top.el.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.5)
      top.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    top.el.querySelector<HTMLElement>('.sc-title')?.focus({ preventScroll: true });
  };

  /** The games a collection can feature: its finished ones (all of yours). */
  const featurable = (c: Category) => lib.gamesOf(c).filter((g) => g.gam || isOwn(c));
  /**
   * Shows a game of collection `c` picked at random (homeCategories.ts pickFeatured), or of
   * Sandbox while `c` has none; its Another button picks again from the same collection.
   */
  const feature = (c: Category = current) => {
    const from = featurable(c).length ? c : FIRST_CATEGORY;
    const pick = pickFeatured(featurable(from), top.game?.key, (g) => !!g.entry?.files.some((f) => f.endsWith('.rec')));
    if (!pick) return;
    top.show(pick, { featured: true, onAnother: () => feature(from) });
    showPath([]);
    markSelected();
  };

  /** With games of your own, the one played or opened last (to carry on with); otherwise a featured game. */
  const showStart = () => {
    // not the game an import of several saved last (projectUse.ts)
    const last = lastUsed(lib.projects, (id) => !!batchOf(id));
    if (!last) return feature();
    top.show(lib.mine(last), { resume: true });
    showPath([]);
    markSelected();
  };

  // The collections are tabs: arrow keys move between them, Tab goes on to the games.
  const renderCats = () => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, isOwn(c.id) ? lib.own(c.id).length : lib.entriesOf(c.id).length]));
    clear(
      catNav,
      ...lib.shownCats().map((c) =>
        h(
          'button',
          {
            id: `lib-tab-${c.id}`,
            class: `lib-cat${c.id === current ? ' active' : ''}`,
            type: 'button',
            role: 'tab',
            'aria-selected': String(c.id === current),
            'aria-controls': 'lib-panel',
            tabindex: c.id === current ? 0 : -1,
            title: c.lead,
            onclick: () => void select(c.id, true),
          },
          icon(c.icon),
          h('span', { class: 'lib-cat-name' }, c.name),
          h('span', { class: 'lib-cat-count' }, String(counts[c.id]), h('span', { class: 'vh' }, ` game${counts[c.id] === 1 ? '' : 's'}`)),
        ),
      ),
    );
  };
  // Arrow keys move between the tiles (Tab stops once per tile); Home and End go to the ends.
  tileArrowKeys(tiles);

  catNav.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -99, End: 99 }[e.key];
    if (!step) return;
    e.preventDefault();
    const cats = lib.shownCats();
    const i = cats.findIndex((c) => c.id === current);
    const next = cats[Math.max(0, Math.min(cats.length - 1, Math.abs(step) > 1 ? (step < 0 ? 0 : 99) : (i + step + cats.length) % cats.length))];
    void select(next.id, true).then(() => catNav.querySelector<HTMLElement>(`#lib-tab-${next.id}`)?.focus());
  });

  /** Shows a collection; remembered when the visitor picked it. */
  const select = async (c: Category, picked = false) => {
    // a Bizarre tab remembered from a catalog that had one: its games are with the shareware now
    if (c === 'bizarre' && !hasBizarreTab(lib.catalog)) c = 'shareware';
    const changed = c !== current;
    current = c;
    // another collection chosen: one of its games is featured at the top (an empty one keeps the game shown)
    if (picked && changed && featurable(c).length) feature(c);
    if (picked) {
      keep({ tab: c });
      try {
        localStorage.setItem(CATEGORY_KEY, c);
      } catch {
        /* not remembered */
      }
    }
    renderCats();
    tiles.setAttribute('aria-labelledby', `lib-tab-${c}`);
    const info = CATEGORIES.find((x) => x.id === c)!;
    libTitle.textContent = info.name;
    showLead(false);
    sortBox.hidden = !isOwn(c) || lib.own(c).length < 2;
    removeAllBtn.hidden = c !== 'imported' || !lib.own(c).length;
    ratingBox.hidden = c !== 'imported' || !lib.own(c).length;
    const cards = libraryCards(lib, c, ratingFilter, {
      choose,
      more: (game) => (choose(game), top.openMore()),
      browse: (to) => void select(to, true).then(() => document.getElementById(`lib-tab-${to}`)?.focus()),
      newGame: () => void homeImport().then((m) => m.newGame(nav)),
    });
    // your own collections take more games in: the import tile, first while there are none
    if (isOwn(c)) {
      dropTile.classList.remove('over');
      if (cards.some((el) => el.classList.contains('game-tile'))) cards.push(dropTile);
      else cards.unshift(dropTile);
    }
    // Keep the page from jumping while the tiles are swapped.
    tiles.style.minHeight = `${tiles.offsetHeight}px`;
    packer.reset();
    clear(tiles, ...cards);
    filterTiles();
    markSelected();
    requestAnimationFrame(() => (tiles.style.minHeight = ''));
  };

  const refreshProjects = async () => {
    lib.projects = await listProjects().catch(() => []);
    // renamed or saved since: made afresh
    lib.forgetOwn();
    const key = top.game?.key;
    const now = key && lib.findGame(key);
    if (!now) showStart();
    else if (now.kind === 'mine') top.show(now, {});
    await select(current);
  };

  const top = showcase(nav, refreshProjects);
  const start = gettingStarted();

  clear(
    root,
    h(
      'main',
      { class: 'home' },
      h('h1', { class: 'sr-only' }, PRODUCT),
      top.el,
      h(
        'section',
        { id: 'library', class: 'library', 'aria-labelledby': 'lib-title' },
        h(
          'div',
          { class: 'lib-bar' },
          catNav,
          h(
            'div',
            { class: 'lib-find' },
            search,
            h('button', { class: 'primary lib-new', type: 'button', onclick: () => void homeImport().then((m) => m.newGame(nav)) }, '+ New game'),
            describeButton(nav),
          ),
        ),
        h('div', { class: 'lib-about' }, libTitle, libLead, sortBox, ratingBox, removeAllBtn, start.howBtn),
        tiles,
      ),
      start.section(),
    ),
  );

  // On a wide window Getting started fills the space under the game only when it fits there.
  start.fit(root.querySelector<HTMLElement>('.home-start')!, top.el);

  // on My games and Imported, files dropped anywhere in the library come in (the tile lights up)
  libraryDrops(
    root.querySelector<HTMLElement>('#library')!,
    dropTile,
    () => isOwn(current),
    nav,
    () => void refreshProjects(),
  );

  lib.projects = await listProjects().catch(() => []);
  if (!savedCategory() && lib.projects.length) current = lib.own('mine').length ? 'mine' : 'imported';
  renderCats();
  try {
    lib.catalog = await loadGameList();
  } catch {
    lib.catalogError = 'These games are unavailable offline until they have been opened once.';
  }
  // the collection in the address (#/?tab=sandbox) comes back, before a game is featured from it
  const { tab, q } = currentRoute().params;
  const tabbed = CATEGORIES.find((c) => c.id === tab)?.id;
  if (tabbed) current = tabbed;
  // a link to a game shows it, in its own collection
  const chosen = lib.findGame(hashKey());
  if (chosen) {
    top.show(chosen, {});
    current = categoryOf(chosen);
    // …and its Saves & scores, when the address had it open (#/game/<key>?saves=3)
    const saves = currentRoute().params.saves;
    if (saves) top.openSaves(saves);
  } else {
    // your own games live in the browser that made them: a link to one opens only there
    if (hashKey().startsWith('my:'))
      toast('That game was made in another browser (or deleted), so it isn’t here. Ask for the game itself: its Download button saves it.');
    // …and a link to a game the catalog doesn't list says so, rather than quietly showing another
    else if (hashKey() && !lib.catalogError) toast('That game isn’t in the catalog (the link may be old). Here are all the games.');
    showStart();
  }
  // …and the collection and search in the address (#/?tab=sandbox&q=snow) come back too
  if (tabbed) current = tabbed;
  if (q) search.value = q;
  await select(current);

  // a secret game revealed or hidden again (the felt eggs, EGG.EXE): the collections, their
  // counts and the game at the top follow without a reload
  const page = root.querySelector<HTMLElement>('main.home')!;
  const unwatch = (unwatchHome = onCatalogChanged(async () => {
    if (!page.isConnected) return unwatch();
    try {
      lib.catalog = await loadGameList();
    } catch {
      return;
    }
    if (!page.isConnected) return;
    lib.forgetUnlisted();
    const key = top.game?.key;
    if (key && !lib.findGame(key)) showStart();
    await select(current);
  }));
  // a rating or note changed (the panel's stars, the note dialog): Imported's tiles redraw, once a frame at most
  let redraw = 0;
  const onNotes = () => {
    if (!page.isConnected) return removeEventListener(NOTES_CHANGED, onNotes);
    if (current !== 'imported' || redraw) return;
    redraw = requestAnimationFrame(() => {
      redraw = 0;
      // the tile with the keyboard on it keeps it
      const key = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.game-tile')?.dataset.key;
      void select(current).then(() => key && tiles.querySelector<HTMLElement>(`.game-tile[data-key="${CSS.escape(key)}"] .tile-select`)?.focus());
    });
  };
  addEventListener(NOTES_CHANGED, onNotes);
}
