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
import { CATEGORIES, CATEGORY_KEY, FIRST_CATEGORY, oldCategory, pickFeatured, savedCategory, type Category } from './homeCategories';
import { shelfList } from './deletedShelf';
import { importHistory } from '../../imported/importHistory';
import { batchOf } from './importBatch';
import { lastUsed } from '../../project/projectUse';
import { NOTES_CHANGED } from '../../imported/gameNotes';
import { ratingFilterBox, savedRatingFilter } from './homeRatings';
import { doneFilterBox, loadFinished, savedDoneFilter } from './homeDone';
import { loadGrades } from '../../achievements/courseGrades';
import { currentRoute, formatHash, setHashParams, type ParamValue } from '../../urlState';
import { libraryCards } from './homeLibraryCards';
import { tilePacker } from './homeTilePack';
import { tileArrowKeys } from './homeTileKeys';
import { gettingStarted } from './homeGettingStarted';
import { homeImport, importTile, libraryDrops } from './homeDrop';

export interface HomeNav {
  openProject(id: string): void;
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
/** Ends with the last home page: what it listens for on window goes with it. */
let homeLife = new AbortController();

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  unwatchHome?.();
  unwatchHome = undefined;
  homeLife.abort(null);
  homeLife = new AbortController();
  const life = homeLife.signal;
  /** When this page is replaced (or at once, if another render already replaced it while this one was loading). */
  const atEnd = (f: () => void) => (life.aborted ? f() : life.addEventListener('abort', f, { once: true }));
  const catNav = h('div', { class: 'lib-cats', role: 'tablist', 'aria-label': 'Game collections' });
  // hidden until a category names it (an empty heading is a screen-reader and axe finding while the page draws)
  const libTitle = h('h2', { id: 'lib-title', hidden: true });
  const howDoI = h('div', { class: 'lib-hdi', hidden: true });
  // the collection in a line (cut short with … if it must be); More shows all of it
  const libLeadText = h('span', { class: 'lib-lead-text' });
  const leadMore = h(
    'button',
    {
      type: 'button',
      class: 'lib-lead-more',
      'aria-expanded': 'false',
      'aria-controls': 'lib-lead',
      // named from the start: showLead fills in the collection once the tabs are drawn
      'aria-label': 'More about this collection',
      onclick: () => showLead(leadMore.getAttribute('aria-expanded') !== 'true'),
    },
    'More',
  );
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
    // the deeper search (words inside games) starts reading when the box is first used, never at load
    onfocus: () => deep.focus(),
    oninput: () => {
      filterTiles();
      keep({ q: search.value.trim() });
    },
  });
  // where games come in, as one more tile: drop them on it (or anywhere in the library), or pick them
  const dropTile = importTile(nav, () => void refreshProjects());
  const lib = homeLibrary();
  const newGameBtn = h('button', { class: 'primary lib-new', type: 'button', onclick: () => void homeImport().then((m) => m.newGame(nav)) }, '+ New game');
  const communityBtn = h(
    'button',
    {
      class: 'primary',
      type: 'button',
      hidden: true,
      onclick: () => void import('../../community/submit').then((m) => m.submitCommunityGame()),
    },
    'Add your game',
  );
  // an import can bring in hundreds: all of them go at once (importRemove.ts, loaded when used)
  const removeAllBtn = h(
    'button',
    { type: 'button', class: 'lib-remove-all', hidden: true, onclick: () => void import('./importRemove').then((m) => m.removeImported(refreshProjects)) },
    'Remove all imported…',
  );
  const historyBtn = h(
    'button',
    { type: 'button', class: 'lib-remove-all', hidden: true, onclick: () => void import('./importHistoryDialog').then((m) => m.showImportHistory()) },
    'Import history…',
  );
  // the Starters' transcript (grades by course) and honors, one dialog with two tabs (transcriptDialog.ts)
  const transcriptBtn = h(
    'button',
    { type: 'button', class: 'lib-remove-all', hidden: true, onclick: () => void import('./transcriptDialog').then((m) => m.showTranscript()) },
    'Transcript',
  );
  const recentBtn = h(
    'button',
    {
      type: 'button',
      class: 'lib-remove-all',
      hidden: true,
      onclick: () => void import('./recentlyDeletedDialog').then((m) => m.showRecentlyDeleted(refreshProjects)),
    },
    'Recently deleted…',
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
      h('option', { value: 'walk', selected: lib.sort === 'walk' }, 'Walkthrough % (Imported)'),
    ),
  );
  // Imported narrowed to one rating, or Unrated (homeRatings.ts)
  let ratingFilter = savedRatingFilter();
  const ratingBox = ratingFilterBox(ratingFilter, (f) => {
    ratingFilter = f;
    void select(current);
  });
  // Starters narrowed to the ones not played to the ending yet, or the ones that were (homeDone.ts)
  let doneFilter = savedDoneFilter();
  const doneBox = doneFilterBox(doneFilter, (f) => {
    doneFilter = f;
    void select(current);
  });
  let current: Category = savedCategory() ?? FIRST_CATEGORY;

  // games found by words inside them (file names, text screens, the blurb…), with where: they join as the background read goes
  let deepHits = new Map<string, string>();
  // loaded with the first focus of the search box, so the page's first load carries none of it
  type Deep = ReturnType<Awaited<typeof import('./homeDeepSearch')>['homeDeepSearch']>;
  let deepNow: Deep | undefined;
  const deep = {
    focus: () =>
      void import('./homeDeepSearch').then((m) => {
        deepNow ??= m.homeDeepSearch({
          games: () => lib.shownCats().flatMap((c) => lib.gamesOf(c.id)),
          onMore: () => filterTiles(true),
        });
        return deepNow.focus();
      }),
    find: (q: string) => deepNow?.find(q) ?? new Map<string, string>(),
    stop: () => deepNow?.stop(),
  };
  atEnd(() => deep.stop());
  let lastShown = 0;
  let countTimer: ReturnType<typeof setTimeout> | undefined;

  const filterTiles = (fromDeep = false) => {
    const q = search.value.trim().toLowerCase();
    deepHits = deep.find(q);
    let shown = 0;
    for (const t of tiles.querySelectorAll<HTMLElement>('.card:not(.lib-drop-tile)')) {
      const byName = !q || (t.dataset.search ?? '').includes(q);
      const found = !byName ? deepHits.get(t.dataset.key ?? '') : undefined;
      const hit = byName || !!found;
      t.hidden = !hit;
      const hint = t.querySelector('.tile-hint');
      if (found) {
        if (hint) hint.textContent = found;
        else t.querySelector('.tile-select')?.append(h('span', { class: 'tile-hint meta' }, found));
      } else hint?.remove();
      if (hit) shown++;
    }
    // a screen reader hears when the background read added games to the list
    if (fromDeep && shown > lastShown && q) announce(`${shown} ${shown === 1 ? 'game matches' : 'games match'} “${search.value.trim()}”`);
    lastShown = shown;
    // typing says how many games match, once the typing pauses (the background read speaks for itself above)
    clearTimeout(countTimer);
    if (!fromDeep && q && shown)
      countTimer = setTimeout(() => announce(`${shown} ${shown === 1 ? 'game matches' : 'games match'} “${search.value.trim()}”`), 800);
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
      .map((c) => ({ c, n: lib.gamesOf(c.id).filter((g) => g.search.includes(q) || deepHits.has(g.key)).length }))
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

  // a polite live region: choosing a game says so once, for screen readers
  const live = h('p', { class: 'vh', role: 'status', 'aria-live': 'polite' });
  const announce = (text: string) => {
    live.textContent = '';
    setTimeout(() => (live.textContent = text), 50);
  };
  const packer = tilePacker(tiles);
  const pack = () => packer.pack(isByMaker(current), !!search.value.trim(), current === 'imported' || current === 'starter');
  const packWatch = new ResizeObserver(() => pack());
  packWatch.observe(tiles);
  atEnd(() => packWatch.disconnect()); // or it holds this page for good

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
    top.focusPlay();
    announce(`${game.title} featured`);
  };

  /** The games a collection can feature: its finished ones (all of yours). */
  const featurable = (c: Category) => lib.gamesOf(c).filter((g) => g.gam || g.community || isOwn(c));
  /**
   * Shows a game of collection `c` picked at random (homeCategories.ts pickFeatured), or of
   * Sandbox while `c` has none; its Another button picks again from the same collection.
   */
  const feature = (c: Category = current) => {
    // this collection's, else Sandbox's, else any collection that has a game (a removed game must not stay on show)
    const from = [c, FIRST_CATEGORY, ...CATEGORIES.map((x) => x.id)].find((x) => featurable(x).length) ?? c;
    const pick = pickFeatured(featurable(from), top.game?.key, (g) => !!g.entry?.files.some((f) => f.endsWith('.rec')));
    if (!pick) return;
    top.show(pick, { featured: true, onAnother: () => feature(from) });
    showPath([]);
    markSelected();
  };

  /**
   * On My games or Imported, your game played or opened last (to carry on with); on another tab
   * (Sandbox after a reload, say), or with none of your own, a game featured from that tab.
   */
  const showStart = () => {
    // not the game an import of several saved last (projectUse.ts)
    const last = isOwn(current) ? lastUsed(lib.projects, (id) => !!batchOf(id)) : undefined;
    if (!last) return feature();
    top.show(lib.mine(last), { resume: true });
    showPath([]);
    markSelected();
  };

  // The collections are tabs: arrow keys move between them, Tab goes on to the games.
  const renderCats = () => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, lib.gamesOf(c.id).length]));
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
      // until the catalog is in, Bizarre's tab may be coming: its place is kept so the rows below don't drop
      ...(lib.catalog.length || lib.catalogError
        ? []
        : [
            h(
              'span',
              { class: 'lib-cat', 'aria-hidden': 'true', style: 'visibility:hidden' },
              icon('help'),
              h('span', { class: 'lib-cat-name' }, 'Bizarre'),
              h('span', { class: 'lib-cat-count' }, '00'),
            ),
          ]),
    );
  };
  // Arrow keys move between the tiles (Tab stops once per tile); Home and End go to the ends.
  tileArrowKeys(tiles, () => CATEGORIES.find((c) => c.id === current)?.name ?? '');

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
    if (c === 'bizarre' && !hasBizarreTab(lib.catalog)) c = 'cd';
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
    libTitle.hidden = false;
    showLead(false);
    sortBox.hidden = !isOwn(c) || lib.own(c).length < 2;
    removeAllBtn.hidden = c !== 'imported' || !lib.own(c).length;
    historyBtn.hidden = c !== 'imported' || !importHistory().length;
    // games deleted in the last 7 days (deletedShelf.ts) can come back from My games and Imported
    if (!isOwn(c)) recentBtn.hidden = true;
    else
      void shelfList()
        .then((l) => (recentBtn.hidden = !isOwn(current) || !l.length))
        .catch(() => undefined);
    // the Starters' "How do I…?" questions, loaded when that tab is first shown
    howDoI.hidden = c !== 'starter';
    if (c === 'starter' && !howDoI.firstChild && !howDoI.dataset.loading) {
      howDoI.dataset.loading = '1'; // choosing the tab again before the index is in must not add a second one
      void import('./howDoIIndex').then((m) => howDoI.append(m.howDoIIndex({ compact: true })));
    }
    ratingBox.hidden = c !== 'imported' || !lib.own(c).length;
    doneBox.hidden = c !== 'starter';
    transcriptBtn.hidden = c !== 'starter';
    const finished = c === 'starter' ? await loadFinished() : new Set<string>();
    if (current !== c) return; // another collection was chosen while the record loaded
    newGameBtn.hidden = c === 'community';
    communityBtn.hidden = c !== 'community';
    const cards = libraryCards(
      lib,
      c,
      ratingFilter,
      {
        choose,
        more: (game, anchor) => void import('./homeTileMenu').then((m) => m.homeTileMenu(anchor, game, refreshProjects)),
        browse: (to) => void select(to, true).then(() => document.getElementById(`lib-tab-${to}`)?.focus()),
        newGame: () => void homeImport().then((m) => m.newGame(nav)),
      },
      { finished, filter: doneFilter, grades: c === 'starter' ? loadGrades() : {} },
    );
    // The import target stays first, including after sorting or filtering the games.
    if (isOwn(c)) {
      dropTile.classList.remove('over');
      cards.unshift(dropTile);
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
    await lib.loadWalkBadges();
    // renamed or saved since: made afresh
    lib.forgetOwn();
    const key = top.game?.key;
    const now = key && lib.findGame(key);
    if (!now) showStart();
    else if (now.kind === 'mine') top.show(now, {});
    await select(current);
  };

  const top = showcase(nav, refreshProjects, life);
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
        h('div', { class: 'lib-bar' }, catNav, h('div', { class: 'lib-find' }, search, newGameBtn, communityBtn)),
        h('div', { class: 'lib-about' }, libTitle, libLead, sortBox, ratingBox, doneBox, transcriptBtn, historyBtn, recentBtn, removeAllBtn, start.howBtn),
        howDoI,
        tiles,
        live,
      ),
      start.section(),
    ),
  );

  // On a wide window Getting started fills the space under the game only when it fits there.
  start.fit(root.querySelector<HTMLElement>('.home-start')!, top.el, life);

  // on My games and Imported, files dropped anywhere in the library come in (the tile lights up)
  libraryDrops(
    root.querySelector<HTMLElement>('#library')!,
    dropTile,
    () => isOwn(current),
    nav,
    () => void refreshProjects(),
  );

  // the tabs stand in their place before the lists load, so the page below them doesn't jump
  renderCats();
  lib.projects = await listProjects().catch(() => []);
  await lib.loadWalkBadges();
  if (!savedCategory() && lib.projects.length) current = lib.own('mine').length ? 'mine' : 'imported';
  renderCats();
  try {
    lib.catalog = await loadGameList();
  } catch {
    lib.catalogError = 'These games are unavailable offline until they have been opened once.';
  }
  // the collection in the address (#/?tab=sandbox) comes back, before a game is featured from it
  const { tab, q } = currentRoute().params;
  const tabbed = CATEGORIES.find((c) => c.id === oldCategory(tab))?.id;
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
  // Getting started shows once the game above it and the tabs are in place (it may turn out clipped)
  root.querySelector('.home-start')?.classList.add('ready');

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
  atEnd(unwatch); // not only at the next page: two renders can overlap, and the first one's watch would be lost
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
  addEventListener(NOTES_CHANGED, onNotes, { signal: life });
}
