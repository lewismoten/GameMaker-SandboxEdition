// Game-Maker: Sandbox Edition (index.html): the mid-90s desk, or today's web interface.
//
// Each is its own download: this entry holds only the switch between them, and the desk
// (desk/, retro/, vga/) or today's web (editor/shell, the editors) is imported when it is
// first shown. The editors themselves load when a game is opened (or the desk's PC opens one).
import './editor/shell/editor.css';
import { h, clear } from './editor/core/ui';
import type { Workspace } from './editor/shell/workspace';
import { watchForUpdates } from './devReload';
import { registerServiceWorker } from './offline';
import { EDITION, FORK_NOTE, PRODUCT, SHORT } from './edition';
import './edition.css';
import { settingsItems, settingsMenu } from './settingsMenu';
import { viewSwitch } from './viewSwitch';
import { parseHash } from './urlState';
import { noteLibraryContext } from './libraryStart';
import { parseLinkRequest, type LinkRequest } from './linkIn/protocol';

const modernUi = () => import('./modernUi');

type Ui = 'desk' | 'modern';
const UI_KEY = 'gm-ui';

const app = document.querySelector<HTMLElement>('#app')!;
const titleSlot = h('span');
const content = h('div', { class: 'content', id: 'content' });
let workspace: Workspace | undefined;
let disposeDesk: (() => void) | undefined;
let ui: Ui = 'desk';
/** The magazine at #/magazine, put away when the route moves on. */
let disposeMagazine: (() => void) | undefined;

function savedUi(): Ui {
  try {
    return localStorage.getItem(UI_KEY) === 'modern' ? 'modern' : 'desk';
  } catch {
    return 'desk';
  }
}

function rememberUi(next: Ui): void {
  try {
    localStorage.setItem(UI_KEY, next);
  } catch {
    /* private mode */
  }
}

// ---- the 90s desk ---------------------------------------------------------------------

/** What today's web shows (a catalog game cd:<id>, or your own project:<id>), for the view switch. */
function webShowing(): string | undefined {
  const [kind, id] = parseHash(location.hash).path;
  if (kind === 'game' && id?.startsWith('cd:')) return id;
  if (kind === 'p' && id) return id.startsWith('look:') ? `cd:${id.slice(5)}` : `project:${id}`;
  return undefined;
}

/** The desk; `hash` (#/desk?disk=…) says what to put in its drive. */
async function startDesk(hash?: string): Promise<void> {
  ui = 'desk';
  rememberUi('desk');
  document.documentElement.dataset.ui = 'desk'; // the page background (index.html)
  app.classList.remove('modern');
  workspace?.dispose();
  workspace = undefined;
  disposeMagazine?.();
  disposeMagazine = undefined;
  document.title = 'Game-Maker 1994';
  // the desk keeps its own state in the address (#/desk?disk=…&run=…, see desk.ts)
  const deskHash = hash ?? (parseHash(location.hash).path[0] === 'desk' ? location.hash : '#/desk');
  history.replaceState(null, '', location.pathname + location.search + deskHash);
  const { renderDesk } = await import('./desk/desk');
  if (ui !== 'desk') return;
  const toModern = (hash: string) => {
    disposeDesk?.();
    disposeDesk = undefined;
    startModern(hash);
  };
  disposeDesk = renderDesk(app, {
    toModern: (projectId, file) => toModern(projectId ? `#/p/${projectId}${file ? `/${encodeURIComponent(file)}` : ''}` : '#/'),
    toModernAt: toModern,
  });
}

// ---- today's web ---------------------------------------------------------------------

function startModern(hash?: string): void {
  ui = 'modern';
  rememberUi('modern');
  document.documentElement.dataset.ui = 'modern';
  app.classList.add('modern');
  clear(
    app,
    h('a', { class: 'skip-link', href: '#content', onclick: skipToContent }, 'Skip to content'),
    h(
      'header',
      { class: 'topbar' },
      h('a', { href: '#/', title: FORK_NOTE }, h('span', { class: 'brand-title' }, 'GAME-MAKER', h('small', { class: 'edition' }, EDITION))),
      titleSlot,
      h('span', { class: 'spacer' }),
      h(
        'nav',
        { class: 'topbar-nav', 'aria-label': 'Site pages' },
        h('a', { class: 'nav-link nav-games', href: '#/', title: 'All the games: play one, edit a copy, or make your own' }, 'Games'),
        h('a', { class: 'nav-link hide-tiny', href: '#/help', title: `How to use ${PRODUCT}` }, 'Guide'),
        h(
          'a',
          {
            class: 'hide-narrow nav-link nav-library',
            href: '#/library',
            title: 'Everything to read and print: manuals, maps, newsletters, sticker sheets, TURBO BUTTON magazine and more',
          },
          'Library',
        ),
        h(
          'a',
          { class: 'hide-narrow nav-link', href: '#/achievements', title: 'What you’ve done: your achievements, here and on the 1994 desk' },
          'Achievements',
        ),
        h('a', { class: 'hide-narrow nav-link', href: '#/cast', title: 'Who’s who in the new games, and the kinds of games' }, 'Cast'),
        h('a', { class: 'hide-narrow nav-link', href: '#/credits', title: `Who and what made ${PRODUCT}` }, 'Credits'),
      ),
      // Desk | DOS | Web, at the top right in every view; the game in front of you comes along
      // (viewSwitch.ts)
      viewSwitch('web', webShowing, { desk: (href) => void startDesk(href.slice(href.indexOf('#'))) }),
      // after it, ⚙ Settings (offline, the source, the theme, AI setup; settingsMenu.ts), or on
      // phones and tablets the ⋯ menu with the pages the bar has no room for and the settings
      settingsMenu(),
      h(
        'details',
        { class: 'topbar-more show-narrow' },
        h(
          'summary',
          {
            'aria-label': 'More: the guide on small screens, the library, achievements, the cast, the credits, and settings',
            title: 'More',
          },
          '⋯',
        ),
        h(
          'div',
          { class: 'topbar-menu' },
          h('a', { class: 'show-tiny', href: '#/help' }, '📖 Guide'),
          h('a', { class: 'nav-library', href: '#/library' }, '📚 Library'),
          h('a', { href: '#/achievements' }, '🏆 What you’ve done'),
          h('a', { href: '#/cast' }, '🎭 The cast'),
          h('a', { href: '#/credits' }, '📜 Credits'),
          h('hr'),
          ...settingsItems(),
        ),
      ),
    ),
    content,
  );
  if (hash !== undefined && location.hash !== hash) location.hash = hash;
  else void route();
}

// The header's ⋯ menu closes when something else is clicked or a choice is made.
document.addEventListener('click', (e) => {
  const open = document.querySelector<HTMLDetailsElement>('.topbar-more[open]');
  const t = e.target as Element;
  // Theme stays open, to show the theme it changed to
  if (open && (!open.contains(t) || (t.closest('.topbar-menu') && !t.closest('.theme-item')))) open.open = false;
});

/** The skip link moves focus to the page's main area without changing the route. */
function skipToContent(e: Event): void {
  e.preventDefault();
  const target = content.querySelector<HTMLElement>('main, [role="main"]') ?? content;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus();
}

const nav = {
  openProject: (id: string) => {
    location.hash = `#/p/${id}`;
  },
};

async function route(): Promise<void> {
  if (ui !== 'modern') return;
  // #/p/<project>/<file>?<the part being edited>, #/game/<key>?…, #/help/<section>, #/?tab=…
  const {
    path: [kind, id, file],
  } = parseHash(location.hash);
  // a game's page, a look inside one or a project: the Library may start on that game (libraryStart.ts)
  noteLibraryContext(kind, id);
  // and its Library links open By game on that game's shelf (the Library shows everything if it has none)
  const shown = kind === 'game' && id?.startsWith('cd:') ? id.slice(3) : kind === 'p' && id?.startsWith('look:') ? id.slice(5) : undefined;
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a.nav-library')) {
    a.href = shown ? `#/library?by=game&only=${encodeURIComponent(shown)}` : '#/library';
  }
  content.removeAttribute('role');
  const { renderHome, openStored } = await modernUi();
  if (ui !== 'modern') return;
  if (kind === 'p' && id) {
    if (workspace?.project.id === id) {
      if (file && file !== workspace.currentFile) workspace.open(file);
      return;
    }
    workspace?.dispose();
    workspace = undefined;
    const opened = await openStored(id, content, file);
    if (!opened) {
      notHere();
      return;
    }
    workspace = opened;
    clear(titleSlot, ` · ${opened.project.name}`);
    document.title = `${opened.currentFile ? `${opened.currentFile} · ` : ''}${opened.project.name} · ${SHORT}`;
    return;
  }
  workspace?.dispose();
  workspace = undefined;
  disposeMagazine?.();
  disposeMagazine = undefined;
  clear(titleSlot);
  if (kind === 'magazine') {
    const { renderMagazinePage } = await import('./manual/magazine/viewer');
    if (ui !== 'modern') return;
    document.title = `TURBO BUTTON magazine · ${PRODUCT}`;
    disposeMagazine = renderMagazinePage(content, parseHash(location.hash).params.page);
    return;
  }
  if (kind === 'library') {
    const { renderLibrary } = await import('./library/libraryPage');
    if (ui !== 'modern') return;
    document.title = `Library · ${PRODUCT}`;
    renderLibrary(content);
    return;
  }
  if (kind === 'cast') {
    const { renderCast } = await import('./cast/castPage');
    if (ui !== 'modern') return;
    document.title = `The cast · ${PRODUCT}`;
    renderCast(content);
    return;
  }
  if (kind === 'credits') {
    const { renderCredits } = await import('./credits/creditsPage');
    if (ui !== 'modern') return;
    document.title = `Credits · ${PRODUCT}`;
    renderCredits(content);
    return;
  }
  if (kind === 'achievements') {
    const { renderAchievements } = await import('./achievements/page');
    if (ui !== 'modern') return;
    document.title = `What you’ve done · ${PRODUCT}`;
    renderAchievements(content);
    return;
  }
  if (kind === 'mac') {
    const { renderMacHelp } = await import('./macHelp/macPage');
    if (ui !== 'modern') return;
    document.title = `Playing the games on a Mac · ${PRODUCT}`;
    renderMacHelp(content);
    return;
  }
  if (kind === 'windows') {
    const { renderWinHelp } = await import('./winHelp/winPage');
    if (ui !== 'modern') return;
    document.title = `Playing the games on Windows · ${PRODUCT}`;
    renderWinHelp(content);
    return;
  }
  if (kind === 'linux') {
    const { renderLinuxHelp } = await import('./linuxHelp/linuxPage');
    if (ui !== 'modern') return;
    document.title = `Playing the games on Linux · ${PRODUCT}`;
    renderLinuxHelp(content);
    return;
  }
  if (kind === 'help') {
    content.setAttribute('role', 'main');
    const { renderWebManual } = await import('./manual/webManual');
    if (ui !== 'modern') return;
    renderWebManual(content, id);
    // named after the section shown (its heading), after it is drawn so seo/route.ts can read it
    const title = id ? content.querySelector('.guide article h1')?.textContent?.trim() : '';
    document.title = `${title ? `${title} · ` : ''}Guide · ${PRODUCT}`;
    return;
  }
  document.title = PRODUCT;
  // on the game list, the bar carries the short tagline (the page's own heading is for screen readers)
  clear(titleSlot, h('span', { class: 'topbar-tagline hide-narrow', title: FORK_NOTE }, 'Make 1994 DOS games. No programming.'));
  await renderHome(content, nav);
}

/**
 * A link to a game being made in someone else's browser (or one deleted since): games of your
 * own live only in the browser that made them, so say so kindly and offer the way home.
 */
function notHere(): void {
  clear(titleSlot);
  document.title = `Game not in this browser · ${SHORT}`;
  clear(
    content,
    h(
      'main',
      { class: 'not-here', style: 'max-width:42rem;margin:48px auto;padding:0 16px' },
      h('h1', null, 'That game is not in this browser'),
      h(
        'p',
        null,
        'Games you make are kept in the browser that made them, so a link to one only opens there. If someone shared this link, ask them to send the game itself: its Download button saves its files as a .zip, or a one-page .html you can open here.',
      ),
      h('p', null, 'Links to the finished games on the home page work everywhere.'),
      h('p', null, h('a', { class: 'button primary', href: '#/' }, 'See all games')),
    ),
  );
}

window.addEventListener('hashchange', () => {
  // a link from one interface to the other (the magazine's, say): #/desk from today's web, or a
  // page of today's web from the desk (the desk itself never changes the hash with a hashchange)
  const [kind] = parseHash(location.hash).path;
  if (ui === 'modern' && kind === 'desk') void startDesk(location.hash);
  else if (ui === 'desk' && kind !== 'desk' && (/^#\/?$/.test(location.hash) || MODERN_PATHS.includes(kind ?? ''))) {
    disposeDesk?.();
    disposeDesk = undefined;
    startModern();
  } else void route();
});

// Links into today's web (a project #/p/…, a game on the home page #/game/…, the guide
// #/help, the cast #/cast, the credits #/credits, the Mac, Windows and Linux pages #/mac, #/windows and #/linux, the magazine #/magazine, the library #/library, the home page #/) open it, #/desk the desk; otherwise use the last choice.
// index.html makes the same choice for the page background before the first paint.
/** The pages of today's web an address can name. */
const MODERN_PATHS = ['p', 'game', 'help', 'cast', 'credits', 'achievements', 'mac', 'windows', 'linux', 'magazine', 'library'];
const startHash = location.hash;
const startPath = parseHash(startHash).path;
const modernLink = /^#\/?(\?|$)/.test(startHash) ? !!startHash : MODERN_PATHS.includes(startPath[0] ?? '');
/** The interface this address (or the last visit) chooses. */
function startChosen(): void {
  // #/dos and #/dos/<game>: the PC on its own page (dos.html, dosPage/dosPage.ts)
  if (startPath[0] === 'dos') location.replace(`./dos.html${startPath[1] ? `?game=${encodeURIComponent(startPath[1])}` : ''}`);
  else if (modernLink || (startPath[0] !== 'desk' && savedUi() === 'modern')) startModern();
  else void startDesk();
}

/**
 * A game sent by another site (?open=<url> or ?receive, linkIn/ and docs/embed.md): asked
 * about, kept in this browser, then opened on the desk, in DOS Game-Maker or in today's web.
 */
async function openLinked(req: LinkRequest): Promise<void> {
  // the request leaves the address first, so a reload doesn't ask again
  const here = new URL(location.href);
  for (const k of ['open', 'receive', 'in', 'mode', 'from']) here.searchParams.delete(k);
  const linkHash = /^#\/?(open|receive)(\?|\/|$)/.test(location.hash);
  history.replaceState(null, '', `${here.pathname}${here.search}${linkHash ? '' : location.hash}`);
  const { runLinkIn, destinationUrl, destinationHash } = await import('./linkIn/start');
  const dest = await runLinkIn(req, savedUi() === 'modern' ? 'web' : 'desk');
  if (!dest) {
    if (!linkHash) startChosen();
    else if (savedUi() === 'modern') startModern('#/');
    else void startDesk('#/desk');
    return;
  }
  // stored before the page may go elsewhere
  const ach = await import('./achievements/store');
  await ach.loadAchievements();
  ach.unlockAchievement('link-in');
  await ach.achievementsWritten();
  const url = destinationUrl(dest);
  if (url) {
    location.replace(url);
    return;
  }
  if (dest.target === 'desk') {
    await startDesk(destinationHash(dest));
    void import('./linkIn/notice').then((m) => m.notTrueDosNotice());
  } else startModern(destinationHash(dest));
}

const linkRequest = parseLinkRequest(location.search, startHash, location.href);
if (linkRequest) void openLinked(linkRequest);
else startChosen();

registerServiceWorker();
// achievements: the gm-achievement event, other tabs, and the counted ones kept current
void import('./achievements/start').then((m) => m.startAchievements());

watchForUpdates();
