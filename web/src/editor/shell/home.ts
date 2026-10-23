// Home page: one game shown large (a featured one, or the one you chose; see
// homeShowcase.ts) and the library: tabs for the collections (your games, the CD's
// gameware, our Sandbox games, the shareware, and The Bard of Bizarre's once there are enough
// of them, bizarre.ts) with search and "New game" beside them, and
// the chosen collection's games as small picture tiles (homeCards.ts). On a wide window
// the game sits in a column beside the library and the page fits the window, the tiles
// scrolling by themselves when there are many; narrower, everything stacks. A chosen game is
// kept in the address (#/game/cd:<id> or #/game/my:<id>), with the collection and search
// (?tab=sandbox&q=snow), so a reload or a link shows the same.
import { h, clear, modal, toast } from '../core/ui';
import { isSandboxGame, loadGameList, type CatalogEntry } from '../../project/files';
import { byCollection, hasBizarreTab, isBizarreGame } from '../../project/bizarre';
import { listProjects } from '../../project/storage';
import { onCatalogChanged } from '../../project/catalogWatch';
import './home.css';
import { PRODUCT } from '../../edition';
import { catalogGame, gameTile, projectGame, RSD_GAMES, type GameKind, type HomeGame } from './homeCards';
import { showcase } from './homeShowcase';
import { newGame, importPicked, importDropped } from './homeImport';
import { icon, type IconName } from './homeIcons';
import { packCollections } from './homePack';
import { wantsTouchControls } from '../../player/touch';
import { findOriginal, isImported } from './homeOrigin';
import { currentRoute, formatHash, setHashParams, type ParamValue } from '../../urlState';

export interface HomeNav {
  openProject(id: string): void;
}

/** A collection: a kind of game, with your own games split into those made here and those imported. */
type Category = GameKind | 'imported';

/** Each collection: `short` is the one line shown above its games, `lead` the whole of it (More, and the tab's tip). */
const CATEGORIES: { id: Category; icon: IconName; name: string; short: string; lead: string }[] = [
  {
    id: 'mine',
    icon: 'edit',
    name: 'My games',
    short: 'Games you made or copied, kept in this browser.',
    lead: 'Games you made here or copied from the collections, kept in this browser. Download a .zip now and then to keep them safe.',
  },
  {
    id: 'imported',
    icon: 'inbox',
    name: 'Imported',
    short: 'Games brought in from folders, files, .zips or .html exports.',
    lead: 'Games brought in from a folder, files, a .zip or a one-page export, often made by someone else. Kept in this browser; ⋯ More moves one to My games.',
  },
  {
    id: 'gameware',
    icon: 'disk',
    name: 'Gameware',
    short: 'Free games that came with Game-Maker. Play or edit a copy.',
    lead: 'The free “gameware” that came with Game-Maker. Play them, or edit a copy to see how they were made and reuse their pictures, monsters and sounds in your own games.',
  },
  {
    id: 'sandbox',
    icon: 'star',
    name: 'Sandbox',
    short: 'New games in the original formats, so they play in DOS too.',
    lead: 'New games from Sandbox Software, made with Game-Maker in the original formats, so they also play in DOS. Play them, read their manuals, or edit a copy to see how they were made.',
  },
  {
    id: 'shareware',
    icon: 'lock',
    name: 'Shareware',
    short: 'Other people’s games from the CD and BBSes, as released.',
    lead: 'Games other people made with Game-Maker, from the CD and the BBSes. Most are copyrighted shareware that can only be played here, exactly as released; a few are free to share. If you enjoy one, read its notice to see how the author asked to be registered or thanked.',
  },
  {
    id: 'bizarre',
    icon: 'music',
    name: 'Bizarre',
    short: 'Heartfelt songs about all the wrong things, made into games.',
    lead: 'Big, heartfelt songs about all the wrong things (the goat nobody painted, the loaf nobody picked, a fly named Carl, the TV remote), made into games. The Bard of Bizarre is Lewis “Lewie” Moten III, with Doc Leo the hobo clown as his face: he dreams up each song, AI tools shape and record it, and you can play it, read its notice, or edit a copy (they’re MIT) to see how it was made.',
  },
];

const CATEGORY_KEY = 'gm-home-category';
const SORT_KEY = 'gm-home-sort';
type MySort = 'edited' | 'name';

function savedSort(): MySort {
  try {
    return localStorage.getItem(SORT_KEY) === 'name' ? 'name' : 'edited';
  } catch {
    return 'edited';
  }
}

function savedCategory(): Category | undefined {
  try {
    const c = localStorage.getItem(CATEGORY_KEY) as Category | null;
    return c && CATEGORIES.some((x) => x.id === c) ? c : undefined;
  } catch {
    return undefined;
  }
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
  const leadMore = h('button', { type: 'button', class: 'lib-lead-more', 'aria-expanded': 'false', 'aria-controls': 'lib-lead', onclick: () => showLead(leadMore.getAttribute('aria-expanded') !== 'true') });
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
  }) as HTMLInputElement;
  // where games come in, as one more tile: drop them on it (or anywhere in the library), or pick them
  const dropTile = h(
    'div',
    { class: 'card dropzone lib-drop-tile' },
    h(
      'button',
      { type: 'button', class: 'lib-drop-pick', 'aria-describedby': 'lib-drop-hint', onclick: () => void importPicked(nav, {}) },
      h('span', { class: 'lib-drop-art', 'aria-hidden': 'true' }, icon('inbox')),
      h('span', { class: 'tile-title' }, 'Drop files or click to import'),
    ),
    h('span', { class: 'vh', id: 'lib-drop-hint' }, 'A game’s files, a .zip or a one-page .html export'),
    h(
      'p',
      { class: 'lib-drop-hint' },
      h('button', { type: 'button', class: 'lib-drop-folder', 'aria-label': 'Open a game folder to import', onclick: () => void importPicked(nav, { directory: true }) }, 'or open a folder…'),
    ),
  );

  let catalog: CatalogEntry[] = [];
  let catalogError = '';
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  /** The collections this catalog has: Bizarre only with enough of the Bard's games. */
  const shownCats = () => CATEGORIES.filter((c) => c.id !== 'bizarre' || hasBizarreTab(catalog));
  // RSD's own games first
  const gameware = () =>
    catalog
      .filter((g) => g.kind !== 'shareware' && !g.original)
      .sort((a, b) => (RSD_GAMES.includes(b.id) ? 1 : 0) - (RSD_GAMES.includes(a.id) ? 1 : 0) || RSD_GAMES.indexOf(a.id) - RSD_GAMES.indexOf(b.id));
  const entriesOf = (c: Category): CatalogEntry[] =>
    c === 'gameware'
      ? gameware()
      : c === 'sandbox'
        ? catalog.filter((g) => isSandboxGame(g) && g.gam)
        : c === 'shareware'
          ? catalog.filter((g) => g.kind === 'shareware' && !isSandboxGame(g) && g.gam && !(isBizarreGame(g) && hasBizarreTab(catalog)))
          : c === 'bizarre' && hasBizarreTab(catalog)
            ? byCollection(catalog.filter((g) => isBizarreGame(g) && g.gam)).flatMap((s) => s.games)
            : [];
  // one HomeGame per game for the page's life, so files load once
  const games = new Map<string, HomeGame>();
  const remember = (g: HomeGame) => games.get(g.key) ?? (games.set(g.key, g), g);
  let sort = savedSort();
  const sorted = () => (sort === 'name' ? [...projects].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })) : projects);
  const mine = (p: (typeof projects)[number]) => remember(projectGame(p, findOriginal(p, catalog)));
  /** Your games made here (My games) or imported. */
  const own = (c: Category) => (c === 'mine' || c === 'imported' ? projects.filter((p) => isImported(p.id) === (c === 'imported')) : []);
  const isOwn = (c: Category) => c === 'mine' || c === 'imported';
  const gamesOf = (c: Category): HomeGame[] =>
    isOwn(c) ? sorted().filter((p) => isImported(p.id) === (c === 'imported')).map(mine) : entriesOf(c).map((e) => remember(catalogGame(e, c as GameKind)));
  /** The collection a game is listed in. */
  const categoryOf = (g: HomeGame): Category => (g.project && isImported(g.project.id) ? 'imported' : g.kind);
  // My games in the order you like: the one edited last first, or by name
  const sortBox = h(
    'label',
    { class: 'lib-sort' },
    'Sort by ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          sort = (e.target as HTMLSelectElement).value as MySort;
          try {
            localStorage.setItem(SORT_KEY, sort);
          } catch {
            /* not remembered */
          }
          void select(current);
        },
      },
      h('option', { value: 'edited', selected: sort === 'edited' }, 'Last edited'),
      h('option', { value: 'name', selected: sort === 'name' }, 'Name'),
    ),
  );
  const findGame = (key: string): HomeGame | undefined => {
    for (const c of CATEGORIES) {
      const g = gamesOf(c.id).find((x) => x.key === key);
      if (g) return g;
    }
    return undefined;
  };

  let current: Category = savedCategory() ?? 'gameware';

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
      for (let e = sub.nextElementSibling as HTMLElement | null; e && !e.classList.contains('lib-sub'); e = e.nextElementSibling as HTMLElement | null) any ||= e.classList.contains('card') && !e.hidden;
      sub.hidden = !any;
    }
    tiles.querySelector('.lib-none')?.remove();
    pack();
    if (!q || shown) return;
    // nothing here: point to the collections that have it
    const elsewhere = shownCats().filter((c) => c.id !== current)
      .map((c) => ({ c, n: gamesOf(c.id).filter((g) => g.search.includes(q)).length }))
      .filter((x) => x.n);
    tiles.append(
      h(
        'div',
        { class: 'meta lib-none', role: 'status' },
        `No game in ${CATEGORIES.find((c) => c.id === current)!.name} matches “${search.value.trim()}”.`,
        ...elsewhere.map(({ c, n }) =>
          h('button', { type: 'button', class: 'lib-elsewhere', onclick: () => void select(c.id, true).then(() => document.getElementById(`lib-tab-${c.id}`)?.focus()) }, `${c.name} has ${n} →`),
        ),
      ),
    );
  };

  /** The grid's columns when the collections were last packed into it (0: not packed). */
  let packedCols = 0;
  /**
   * The Bard's collections packed into as few rows as they fit (homePack.ts), the page in the
   * same order as the rows; while searching, back in the plain flow, a heading over each.
   */
  const pack = () => {
    const heads = [...tiles.querySelectorAll<HTMLElement>(':scope > .lib-sub')];
    if (!heads.length || search.value.trim()) {
      if (packedCols) for (const el of tiles.children) (el as HTMLElement).style.gridArea = '';
      packedCols = 0;
      return;
    }
    const cols = getComputedStyle(tiles).gridTemplateColumns.split(' ').filter(Boolean).length;
    if (!cols || cols === packedCols) return;
    packedCols = cols;
    const groups = heads.map((head) => ({ head, items: [...tiles.querySelectorAll<HTMLElement>(`:scope > .card[data-group="${head.dataset.group}"]`)] }));
    const order: HTMLElement[] = [];
    for (const p of packCollections(groups.map((g) => g.items.length), cols)) {
      const { head, items } = groups[p.index];
      head.style.gridArea = `${p.head.row} / ${p.head.col} / auto / span ${p.head.span}`;
      items.forEach((el, i) => (el.style.gridArea = `${p.tiles[i].row} / ${p.tiles[i].col}`));
      order.push(head, ...items);
    }
    if (order.every((el, i) => tiles.children[i] === el)) return;
    const focused = document.activeElement;
    tiles.append(...order);
    if (focused instanceof HTMLElement && tiles.contains(focused)) focused.focus({ preventScroll: true });
  };
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

  /** Shows a game picked at random, one with a demo when there are some. */
  const feature = () => {
    const pool = [...gamesOf('sandbox'), ...gamesOf('gameware').filter((g) => g.entry && RSD_GAMES.includes(g.entry.id))].filter((g) => g.gam);
    const withDemo = pool.filter((g) => g.entry?.files.some((f) => f.endsWith('.rec')));
    const choices = (withDemo.length ? withDemo : pool).filter((g) => g.key !== top.game?.key);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    if (!pick) return;
    top.show(pick, { featured: true, onAnother: feature });
    showPath([]);
    markSelected();
  };

  /** With games of your own, the one edited last (to carry on with); otherwise a featured game. */
  const showStart = () => {
    if (!projects.length) return feature();
    top.show(mine(projects[0]), { resume: true });
    showPath([]);
    markSelected();
  };

  // The collections are tabs: arrow keys move between them, Tab goes on to the games.
  const renderCats = () => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, isOwn(c.id) ? own(c.id).length : entriesOf(c.id).length]));
    clear(
      catNav,
      ...shownCats().map((c) =>
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
  tiles.addEventListener('keydown', (e) => {
    const from = (e.target as HTMLElement).closest<HTMLElement>('.tile-select, .lib-drop-pick');
    if (!from || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const all = [...tiles.querySelectorAll<HTMLElement>('.game-tile:not([hidden]) .tile-select, .lib-drop-pick')];
    const i = all.indexOf(from);
    const box = (el: HTMLElement) => el.closest('.card')!.getBoundingClientRect();
    // up and down: the tile in the next row that way nearest straight above or below (the
    // Bard's collections share rows, so the tiles' order is not always row by row)
    const vertical = (down: boolean) => {
      const r = box(from);
      const x = r.left + r.width / 2;
      const way = all.map((el) => ({ el, b: box(el) })).filter(({ b }) => (down ? b.top > r.top + 4 : b.top < r.top - 4));
      if (!way.length) return -1;
      const row = down ? Math.min(...way.map(({ b }) => b.top)) : Math.max(...way.map(({ b }) => b.top));
      const near = way.filter(({ b }) => Math.abs(b.top - row) < 4).sort((a, b) => Math.abs(a.b.left + a.b.width / 2 - x) - Math.abs(b.b.left + b.b.width / 2 - x));
      return all.indexOf(near[0].el);
    };
    const j =
      e.key === 'ArrowUp' || e.key === 'ArrowDown' ? vertical(e.key === 'ArrowDown') : { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: all.length - 1 }[e.key]!;
    if (j < 0 || j >= all.length) return;
    e.preventDefault();
    all[j].focus();
    all[j].scrollIntoView({ block: 'nearest' });
  });

  catNav.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -99, End: 99 }[e.key];
    if (!step) return;
    e.preventDefault();
    const cats = shownCats();
    const i = cats.findIndex((c) => c.id === current);
    const next = cats[Math.max(0, Math.min(cats.length - 1, Math.abs(step) > 1 ? (step < 0 ? 0 : 99) : (i + step + cats.length) % cats.length))];
    void select(next.id, true).then(() => catNav.querySelector<HTMLElement>(`#lib-tab-${next.id}`)?.focus());
  });

  /** Shows a collection; remembered when the visitor picked it. */
  const select = async (c: Category, picked = false) => {
    // a Bizarre tab remembered from a catalog that had one: its games are with the shareware now
    if (c === 'bizarre' && !hasBizarreTab(catalog)) c = 'shareware';
    current = c;
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
    sortBox.hidden = !isOwn(c) || own(c).length < 2;
    let cards: HTMLElement[];
    if (!isOwn(c) && catalogError) cards = [h('p', { class: 'meta' }, catalogError)];
    else {
      const tile = (g: HomeGame) => gameTile(g, { onSelect: choose, onMore: (game) => (choose(game), top.openMore()) });
      // the Bard's games under his collections, in the flyer's order
      // (packed into as few rows as they fit, pack() above), each tile telling its collection
      const sections = c === 'bizarre' ? byCollection(gamesOf(c).map((g) => ({ id: g.entry?.id ?? '', g }))) : [];
      cards =
        sections.length > 1
          ? sections.flatMap((sec, n) => [
              h('h3', { class: `lib-sub${sec.games.length === 1 ? ' lib-sub-one' : ''}`, id: `lib-sub-${n}`, dataset: { group: String(n) } }, sec.name),
              ...sec.games.map((x) => {
                const t = tile(x.g);
                t.dataset.group = String(n);
                t.querySelector('.tile-select')?.setAttribute('aria-describedby', `lib-sub-${n}`);
                return t;
              }),
            ])
          : gamesOf(c).map(tile);
    }
    if (!cards.length)
      cards = [
        c === 'mine'
          ? h(
              'div',
              { class: 'lib-empty' },
              h('p', { class: 'lib-empty-title' }, 'No games here yet'),
              h('p', { class: 'meta' }, 'Start a new one, or edit a copy of a finished game to see how it was made.'),
              h(
                'div',
                { class: 'toolbar' },
                h('button', { class: 'primary', type: 'button', onclick: () => void newGame(nav) }, '+ Make a new game'),
                h('button', { type: 'button', onclick: () => void select('gameware', true).then(() => document.getElementById('lib-tab-gameware')?.focus()) }, 'Browse Gameware'),
                h('button', { type: 'button', onclick: () => void select('sandbox', true).then(() => document.getElementById('lib-tab-sandbox')?.focus()) }, 'Browse Sandbox'),
              ),
            )
          : c === 'imported'
            ? h(
                'div',
                { class: 'lib-empty' },
                h('p', { class: 'lib-empty-title' }, 'No imported games yet'),
                h('p', { class: 'meta' }, 'A game someone sends you (a folder, its files, a .zip or a one-page .html export) is listed here when you drop it on the import tile or open it.'),
              )
            : h('p', { class: 'meta' }, 'No games of this kind were bundled with this build.'),
      ];
    // your own collections take more games in: the import tile, first while there are none
    if (isOwn(c)) {
      dropTile.classList.remove('over');
      if (cards.some((el) => el.classList.contains('game-tile'))) cards.push(dropTile);
      else cards.unshift(dropTile);
    }
    // Keep the page from jumping while the tiles are swapped.
    tiles.style.minHeight = `${tiles.offsetHeight}px`;
    packedCols = 0;
    clear(tiles, ...cards);
    filterTiles();
    markSelected();
    requestAnimationFrame(() => (tiles.style.minHeight = ''));
  };

  const refreshProjects = async () => {
    projects = await listProjects().catch(() => []);
    // renamed or saved since: made afresh
    for (const k of [...games.keys()]) if (k.startsWith('my:')) games.delete(k);
    const key = top.game?.key;
    const now = key && findGame(key);
    if (!now) showStart();
    else if (now.kind === 'mine') top.show(now, {});
    await select(current);
  };

  const top = showcase(nav, refreshProjects);
  const touch = wantsTouchControls();
  /** What Getting started says: on the page, or in a dialog when there is no room for it. */
  const startBody = (onGuide?: () => void) => [
    h(
      'ul',
      null,
      h('li', null, h('b', null, icon('play'), 'Play'), touch ? ' right here, with on-screen controls or a gamepad' : ' right here, with keyboard or gamepad'),
      h('li', null, h('b', null, icon('edit'), 'Edit a copy'), ' to see how a game was made'),
      h('li', null, h('b', null, icon('plus'), 'New game'), ' to start your own'),
    ),
    h(
      'p',
      { class: 'meta' },
      // a touch screen has no F-keys: the player's on-screen pad has the ones that matter
      touch
        ? 'Playing: slide a thumb around the pad to move and tap the buttons to act; Esc, F1 help and F2 status have buttons too. '
        : // each key with its word, the dot after it, so a line never starts with one
          `Playing: ${['F1 help', 'F2 status', 'F3 music', 'F4 sound', 'F5 save', 'F6 load', 'Esc leaves a level'].map((k) => k.replace(/ /g, '\u00a0')).join('\u00a0· ')}. `,
      h('a', { href: '#/help', onclick: onGuide }, 'Read the Guide\u00a0→'),
      ' · ',
      h('a', { href: '#/cast' }, 'Meet the cast\u00a0→'),
      ' · ',
      h('a', { href: '#/achievements' }, 'What you’ve done\u00a0→'),
    ),
  ];
  // when Getting started has no room beside the library, a link in the library's header opens it
  const howBtn = h(
    'button',
    {
      type: 'button',
      class: 'lib-how',
      hidden: true,
      onclick: () =>
        void modal('Getting started', (close) => [
          h('div', { class: 'home-start-dialog' }, ...startBody(() => close(undefined))),
          h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
        ]),
    },
    icon('help'),
    'How it works',
  );

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
          h('div', { class: 'lib-find' }, search, h('button', { class: 'primary lib-new', type: 'button', onclick: () => void newGame(nav) }, '+ New game')),
        ),
        h('div', { class: 'lib-about' }, libTitle, libLead, sortBox, howBtn),
        tiles,
      ),
      h(
        'section',
        { class: 'home-start', 'aria-labelledby': 'home-start-title' },
        h('h2', { id: 'home-start-title' }, 'Getting started'),
        ...startBody(),
      ),
    ),
  );

  // On a wide window Getting started fills the space under the game only when it fits there.
  const start = root.querySelector<HTMLElement>('.home-start')!;
  const fitStart = () => {
    start.classList.remove('clipped');
    start.classList.toggle('clipped', start.scrollHeight > start.clientHeight + 1);
    howBtn.hidden = !start.classList.contains('clipped');
  };
  new ResizeObserver(fitStart).observe(start.parentElement!);
  new ResizeObserver(fitStart).observe(top.el);

  // on My games and Imported, files dropped anywhere in the library come in (the tile lights up)
  const library = root.querySelector<HTMLElement>('#library')!;
  const takesDrop = (e: DragEvent) => isOwn(current) && !!e.dataTransfer?.types.includes('Files');
  library.addEventListener('dragover', (e) => {
    if (!takesDrop(e)) return;
    e.preventDefault();
    dropTile.classList.add('over');
  });
  library.addEventListener('dragleave', (e) => {
    if (!library.contains(e.relatedTarget as Node | null)) dropTile.classList.remove('over');
  });
  library.addEventListener('drop', (e) => {
    if (!takesDrop(e)) return;
    e.preventDefault();
    dropTile.classList.remove('over');
    void importDropped(nav, e.dataTransfer!);
  });

  projects = await listProjects().catch(() => []);
  if (!savedCategory() && projects.length) current = own('mine').length ? 'mine' : 'imported';
  renderCats();
  try {
    catalog = await loadGameList();
  } catch {
    catalogError = 'These games are unavailable offline until they have been opened once.';
  }
  // a link to a game shows it, in its own collection
  const chosen = findGame(hashKey());
  if (chosen) {
    top.show(chosen, {});
    current = categoryOf(chosen);
    // …and its Saves & scores, when the address had it open (#/game/<key>?saves=3)
    const saves = currentRoute().params.saves;
    if (saves) top.openSaves(saves);
  } else {
    // your own games live in the browser that made them: a link to one opens only there
    if (hashKey().startsWith('my:')) toast('That game was made in another browser (or deleted), so it isn’t here. Ask for the game itself: its Download button saves it.');
    showStart();
  }
  // …and the collection and search in the address (#/?tab=sandbox&q=snow) come back too
  const { tab, q } = currentRoute().params;
  if (CATEGORIES.some((c) => c.id === tab)) current = tab as Category;
  if (q) search.value = q;
  await select(current);

  // a secret game revealed or hidden again (the felt eggs, EGG.EXE): the collections, their
  // counts and the game at the top follow without a reload
  const page = root.querySelector<HTMLElement>('main.home')!;
  const unwatch = (unwatchHome = onCatalogChanged(async () => {
    if (!page.isConnected) return unwatch();
    try {
      catalog = await loadGameList();
    } catch {
      return;
    }
    if (!page.isConnected) return;
    for (const k of [...games.keys()]) if (k.startsWith('cd:') && !catalog.some((g) => `cd:${g.id}` === k)) games.delete(k);
    const key = top.game?.key;
    if (key && !findGame(key)) showStart();
    await select(current);
  }));
}
