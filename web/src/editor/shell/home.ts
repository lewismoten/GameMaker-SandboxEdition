// Home page: one game shown large (a featured one, or the one you chose; see
// homeShowcase.ts) and the library: tabs for the collections (your games, the CD's
// gameware, our Sandbox games, the shareware) with search and "New game" beside them, and
// the chosen collection's games as small picture tiles (homeCards.ts). On a wide window
// the game sits in a column beside the library and the page fits the window, the tiles
// scrolling by themselves when there are many; narrower, everything stacks. A chosen game is
// kept in the address (#/game/cd:<id> or #/game/my:<id>) so a reload or a link shows it.
import { h, clear } from '../core/ui';
import { loadCatalog, type CatalogEntry } from '../../project/files';
import { listProjects } from '../../project/storage';
import './home.css';
import { FORK_NOTE, NOTICE_URL, PRODUCT } from '../../edition';
import { catalogGame, gameTile, projectGame, RSD_GAMES, type GameKind, type HomeGame } from './homeCards';
import { showcase } from './homeShowcase';
import { newGame, importPicked, importDropped } from './homeImport';

export interface HomeNav {
  openProject(id: string): void;
}

type Category = GameKind;

const CATEGORIES: { id: Category; icon: string; name: string; lead: string }[] = [
  {
    id: 'mine',
    icon: '✎',
    name: 'My games',
    lead: 'Games you are making or have copied, kept in this browser. Download a .zip now and then to keep them safe.',
  },
  {
    id: 'gameware',
    icon: '💾',
    name: 'Gameware',
    lead: 'The free “gameware” that came with Game-Maker. Play them, or edit a copy to see how they were made and reuse their pictures, monsters and sounds in your own games.',
  },
  {
    id: 'sandbox',
    icon: '★',
    name: 'Sandbox',
    lead: 'New games from Sandbox Software, made with Game-Maker in the original formats, so they also play in DOS. Play them, read their manuals, or edit a copy to see how they were made.',
  },
  {
    id: 'shareware',
    icon: '🔒',
    name: 'Shareware',
    lead: 'Games other people made with Game-Maker, as distributed on the CD. They are copyrighted by their authors and can only be played here, exactly as released. If you enjoy one, read its notice to see how the author asked to be registered or thanked.',
  },
];

const CATEGORY_KEY = 'gm-home-category';
const GAME_HASH = '#/game/';

function savedCategory(): Category | undefined {
  try {
    const c = localStorage.getItem(CATEGORY_KEY) as Category | null;
    return c && CATEGORIES.some((x) => x.id === c) ? c : undefined;
  } catch {
    return undefined;
  }
}

/** The game named in the address, if any. */
const hashKey = () => (location.hash.startsWith(GAME_HASH) ? decodeURIComponent(location.hash.slice(GAME_HASH.length)) : '');

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  const catNav = h('div', { class: 'lib-cats', role: 'tablist', 'aria-label': 'Game collections' });
  const libTitle = h('h2', { id: 'lib-title' });
  const libLead = h('p', { class: 'lead' });
  const libTools = h('div', { class: 'lib-tools' });
  const tiles = h('div', { id: 'lib-panel', class: 'cards lib-tiles', role: 'tabpanel' }, h('p', { class: 'meta' }, 'Loading…'));
  const search = h('input', {
    type: 'search',
    class: 'lib-search',
    placeholder: 'Find a game…',
    'aria-label': 'Find a game',
    oninput: () => filterTiles(),
  }) as HTMLInputElement;
  // where games come in: drop them, or pick them
  const drop = h(
    'div',
    { class: 'dropzone lib-drop' },
    h('span', null, 'Drop a game folder, its files, a .zip or a one-page .html export here, or'),
    h('button', { type: 'button', onclick: () => void importPicked(nav, { directory: true }) }, 'Open a game folder…'),
    h('button', { type: 'button', onclick: () => void importPicked(nav, {}) }, 'Open files, .zip or .html…'),
  );

  let catalog: CatalogEntry[] = [];
  let catalogError = '';
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  // RSD's own games first
  const gameware = () =>
    catalog
      .filter((g) => g.kind !== 'shareware' && !g.original)
      .sort((a, b) => (RSD_GAMES.includes(b.id) ? 1 : 0) - (RSD_GAMES.includes(a.id) ? 1 : 0) || RSD_GAMES.indexOf(a.id) - RSD_GAMES.indexOf(b.id));
  const entriesOf = (c: Category): CatalogEntry[] =>
    c === 'gameware'
      ? gameware()
      : c === 'sandbox'
        ? catalog.filter((g) => g.original && g.gam)
        : c === 'shareware'
          ? catalog.filter((g) => g.kind === 'shareware' && !g.original && g.gam)
          : [];
  // one HomeGame per game for the page's life, so files load once
  const games = new Map<string, HomeGame>();
  const remember = (g: HomeGame) => games.get(g.key) ?? (games.set(g.key, g), g);
  const gamesOf = (c: Category): HomeGame[] =>
    c === 'mine' ? projects.map((p) => remember(projectGame(p))) : entriesOf(c).map((e) => remember(catalogGame(e, c)));
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
    for (const t of tiles.querySelectorAll<HTMLElement>('.card')) {
      const hit = !q || (t.dataset.search ?? '').includes(q);
      t.hidden = !hit;
      if (hit) shown++;
    }
    tiles.querySelector('.lib-none')?.remove();
    if (q && !shown) tiles.append(h('p', { class: 'meta lib-none' }, `No game here matches “${search.value.trim()}”.`));
  };

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
    history.replaceState(null, '', `${GAME_HASH}${game.key}`);
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
    if (location.hash.startsWith(GAME_HASH)) history.replaceState(null, '', '#/');
    markSelected();
  };

  // The collections are tabs: arrow keys move between them, Tab goes on to the games.
  const renderCats = () => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.id === 'mine' ? projects.length : entriesOf(c.id).length]));
    clear(
      catNav,
      ...CATEGORIES.map((c) =>
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
          h('span', { class: 'lib-cat-icon', 'aria-hidden': 'true' }, c.icon),
          h('span', { class: 'lib-cat-name' }, c.name),
          h('span', { class: 'lib-cat-count' }, String(counts[c.id]), h('span', { class: 'vh' }, ` game${counts[c.id] === 1 ? '' : 's'}`)),
        ),
      ),
    );
  };
  // Arrow keys move between the tiles (Tab stops once per tile); Home and End go to the ends.
  tiles.addEventListener('keydown', (e) => {
    const from = (e.target as HTMLElement).closest('.tile-select');
    if (!from || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const all = [...tiles.querySelectorAll<HTMLElement>('.game-tile:not([hidden]) .tile-select')];
    const i = all.indexOf(from as HTMLElement);
    const top = (el: HTMLElement) => el.closest('.game-tile')!.getBoundingClientRect().top;
    const cols = Math.max(1, all.filter((el) => top(el) === top(all[0])).length);
    const j = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - cols, ArrowDown: i + cols, Home: 0, End: all.length - 1 }[e.key]!;
    if (j < 0 || j >= all.length) return;
    e.preventDefault();
    all[j].focus();
    all[j].scrollIntoView({ block: 'nearest' });
  });

  catNav.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -99, End: 99 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = CATEGORIES.findIndex((c) => c.id === current);
    const next = CATEGORIES[Math.max(0, Math.min(CATEGORIES.length - 1, Math.abs(step) > 1 ? (step < 0 ? 0 : 99) : (i + step + CATEGORIES.length) % CATEGORIES.length))];
    void select(next.id, true).then(() => catNav.querySelector<HTMLElement>(`#lib-tab-${next.id}`)?.focus());
  });

  /** Shows a collection; remembered when the visitor picked it. */
  const select = async (c: Category, picked = false) => {
    current = c;
    if (picked)
      try {
        localStorage.setItem(CATEGORY_KEY, c);
      } catch {
        /* not remembered */
      }
    renderCats();
    tiles.setAttribute('aria-labelledby', `lib-tab-${c}`);
    const info = CATEGORIES.find((x) => x.id === c)!;
    libTitle.textContent = info.name;
    libLead.textContent = info.lead;
    clear(
      libTools,
      c === 'mine' ? drop : null,
    );
    let cards: HTMLElement[];
    if (c !== 'mine' && catalogError) cards = [h('p', { class: 'meta' }, catalogError)];
    else cards = gamesOf(c).map((g) => gameTile(g, { onSelect: choose }));
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
          : h('p', { class: 'meta' }, 'No games of this kind were bundled with this build.'),
      ];
    // Keep the page from jumping while the tiles are swapped.
    tiles.style.minHeight = `${tiles.offsetHeight}px`;
    clear(tiles, ...cards);
    filterTiles();
    markSelected();
    requestAnimationFrame(() => (tiles.style.minHeight = ''));
  };

  const refreshProjects = async () => {
    projects = await listProjects().catch(() => []);
    const key = top.game?.key;
    if (key && !findGame(key)) feature();
    await select(current);
  };

  const top = showcase(nav, refreshProjects);

  clear(
    root,
    h(
      'main',
      { class: 'home' },
      h(
        'header',
        { class: 'home-intro' },
        h('h1', null, PRODUCT),
        h(
          'p',
          null,
          'Make your own arcade and adventure games — blocks, monsters, heroes, maps, music and sound — in the original 1994 file formats. No programming. ',
          h('a', { href: NOTICE_URL, target: '_blank', rel: 'noopener', class: 'home-fork' }, FORK_NOTE),
          '.',
        ),
      ),
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
        h('div', { class: 'lib-about' }, libTitle, libLead),
        libTools,
        tiles,
      ),
    ),
  );

  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    void importDropped(nav, e.dataTransfer!);
  });

  projects = await listProjects().catch(() => []);
  if (!savedCategory() && projects.length) current = 'mine';
  renderCats();
  try {
    catalog = await loadCatalog();
  } catch {
    catalogError = 'These games are unavailable offline until they have been opened once.';
  }
  const chosen = findGame(hashKey());
  if (chosen) top.show(chosen, {});
  else feature();
  if (!top.game && projects.length) top.show(remember(projectGame(projects[0])), {});
  await select(current);
}
