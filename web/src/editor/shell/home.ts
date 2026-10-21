// Home page: your projects, importing original game folders, and the CD's sample games.
import { h, clear } from '../core/ui';
import { loadCatalog, type CatalogEntry } from '../../project/files';
import { listProjects } from '../../project/storage';
import './home.css';
import { FORK_NOTE, NOTICE_URL } from '../../edition';
import { shotObserver, projectCard, sampleCard, originalCard, sharewareCard } from './homeCards';
import { newGame, importPicked, importDropped } from './homeImport';

export interface HomeNav {
  openProject(id: string): void;
}

type Category = 'mine' | 'gameware' | 'sandbox' | 'shareware';

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

function savedCategory(): Category | undefined {
  try {
    return (localStorage.getItem(CATEGORY_KEY) as Category | null) ?? undefined;
  } catch {
    return undefined;
  }
}

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  const heroShot = h('canvas', { class: 'pixel', width: 320, height: 200 });
  const catNav = h('nav', { class: 'lib-cats', 'aria-label': 'Game collections' });
  const libTitle = h('h2', null);
  const libLead = h('p', { class: 'lead' });
  const libTools = h('div', { class: 'lib-tools' });
  const tiles = h('div', { class: 'cards lib-tiles' }, h('p', { class: 'meta' }, 'Loading…'));
  const search = h('input', {
    type: 'search',
    class: 'lib-search',
    placeholder: 'Find a game…',
    'aria-label': 'Find a game',
    oninput: () => filterTiles(),
  }) as HTMLInputElement;
  const drop = h('div', { class: 'dropzone' }, 'Drop a game folder, its files, a .zip, or a game exported as one web page (.html) here');

  let catalog: CatalogEntry[] = [];
  let catalogError = '';
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  const lists = (): Record<Category, number> => ({
    mine: projects.length,
    gameware: gameware().length,
    sandbox: catalog.filter((g) => g.original && g.gam).length,
    shareware: catalog.filter((g) => g.kind === 'shareware' && !g.original && g.gam).length,
  });
  // Recreational Software Designs' own games first.
  const rsd = ['sample', 'pipemare', 'nebula'];
  const gameware = () =>
    catalog
      .filter((g) => g.kind !== 'shareware' && !g.original)
      .sort((a, b) => (rsd.includes(b.id) ? 1 : 0) - (rsd.includes(a.id) ? 1 : 0) || rsd.indexOf(a.id) - rsd.indexOf(b.id));

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

  const renderCats = () => {
    const counts = lists();
    clear(
      catNav,
      ...CATEGORIES.map((c) =>
        h(
          'button',
          { class: `lib-cat${c.id === current ? ' active' : ''}`, 'aria-pressed': String(c.id === current), onclick: () => void select(c.id) },
          h('span', { class: 'lib-cat-icon', 'aria-hidden': 'true' }, c.icon),
          h('span', { class: 'lib-cat-name' }, c.name),
          h('span', { class: 'lib-cat-count' }, String(counts[c.id])),
        ),
      ),
    );
  };

  const select = async (c: Category) => {
    current = c;
    try {
      localStorage.setItem(CATEGORY_KEY, c);
    } catch {
      /* not remembered */
    }
    renderCats();
    const info = CATEGORIES.find((x) => x.id === c)!;
    libTitle.textContent = info.name;
    libLead.textContent = info.lead;
    clear(
      libTools,
      c === 'mine'
        ? h(
            'div',
            { class: 'toolbar' },
            h('button', { class: 'primary', onclick: () => void newGame(nav) }, '+ New game'),
            h('button', { onclick: () => void importPicked(nav, { directory: true }) }, 'Open game folder…'),
            h('button', { onclick: () => void importPicked(nav, {}) }, 'Open files, .zip or .html…'),
          )
        : null,
      c === 'mine' ? drop : null,
    );
    let cards: HTMLElement[];
    if (c === 'mine') {
      cards = projects.map((p) => projectCard(p, nav, refreshProjects));
      if (!cards.length)
        cards = [h('p', { class: 'meta' }, 'No games yet. Create one, open an original game folder, or copy a game from Gameware or Sandbox.')];
    } else if (catalogError) cards = [h('p', { class: 'meta' }, catalogError)];
    else if (c === 'gameware') cards = gameware().map((g) => sampleCard(g, nav));
    else if (c === 'sandbox') cards = catalog.filter((g) => g.original && g.gam).map((g) => originalCard(g, nav));
    else cards = catalog.filter((g) => g.kind === 'shareware' && !g.original && g.gam).map(sharewareCard);
    if (!cards.length && c !== 'mine') cards = [h('p', { class: 'meta' }, 'No games of this kind were bundled with this build.')];
    // Keep the page from jumping while the tiles are swapped.
    tiles.style.minHeight = `${tiles.offsetHeight}px`;
    clear(tiles, ...cards);
    filterTiles();
    requestAnimationFrame(() => (tiles.style.minHeight = ''));
  };

  const refreshProjects = async () => {
    projects = await listProjects().catch(() => []);
    await select(current);
  };

  clear(
    root,
    h(
      'main',
      { class: 'home' },
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          { class: 'hero-text' },
          h('em', null, 'Computer-aided design tools'),
          h('h1', { class: 'hero-logo' }, 'GAME-MAKER'),
          h('strong', { class: 'hero-edition' }, 'Sandbox Edition'),
          h(
            'p',
            null,
            'Make your own arcade and adventure games — blocks, monsters, heroes, maps, music and sound — in the original 1994 file formats. No programming.',
          ),
          h('p', { class: 'hero-fork' }, h('a', { href: NOTICE_URL, target: '_blank', rel: 'noopener' }, FORK_NOTE), '.'),
          h(
            'div',
            { class: 'hero-actions' },
            h('button', { class: 'primary big', onclick: () => void newGame(nav) }, '+ Make a new game'),
            h(
              'button',
              {
                class: 'big',
                onclick: () => {
                  if (current === 'mine') void select('gameware');
                  document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
                },
              },
              '▶ Play a game',
            ),
          ),
        ),
        h('div', { class: 'hero-screen', 'aria-hidden': 'true' }, heroShot),
      ),
      h(
        'section',
        { id: 'library', class: 'library' },
        catNav,
        h('div', { class: 'lib-main' }, h('div', { class: 'lib-head' }, libTitle, search), libLead, libTools, tiles),
      ),
      h(
        'section',
        null,
        h('h2', null, 'Keys while playing'),
        h(
          'p',
          { class: 'lead' },
          'Each game defines its own keys (usually the arrows plus a few others). F1 help · F2 status · F3 music · F4 sound · F5 save · F6 load · Esc leaves a level. Gamepads work as joysticks.',
        ),
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
  // Once there are games of your own, the banner steps back so they show without scrolling.
  root.querySelector('.hero')?.classList.toggle('hero-compact', projects.length > 0);
  renderCats();
  try {
    catalog = await loadCatalog();
    // the banner's screen: a level from one of RSD's own games
    const show = catalog.find((g) => g.id === ['pipemare', 'sample', 'houses'][Math.floor(Math.random() * 3)]);
    if (show) {
      (heroShot as HTMLCanvasElement & { game?: CatalogEntry }).game = show;
      shotObserver.observe(heroShot);
    }
  } catch {
    catalogError = 'These games are unavailable offline until they have been opened once.';
  }
  await select(current);
}
