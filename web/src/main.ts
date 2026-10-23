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
import { themeButton } from './theme';
import { parseHash } from './urlState';

const modernUi = () => import('./modernUi');

type Ui = 'desk' | 'modern';
const UI_KEY = 'gm-ui';

const app = document.querySelector<HTMLElement>('#app')!;
const titleSlot = h('span');
const content = h('div', { class: 'content', id: 'content' });
let workspace: Workspace | undefined;
let disposeDesk: (() => void) | undefined;
let ui: Ui = 'desk';

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

async function startDesk(): Promise<void> {
  ui = 'desk';
  rememberUi('desk');
  document.documentElement.dataset.ui = 'desk'; // the page background (index.html)
  app.classList.remove('modern');
  workspace?.dispose();
  workspace = undefined;
  document.title = 'Game-Maker 1994';
  // the desk keeps its own state in the address (#/desk?disk=…&run=…, see desk.ts)
  const deskHash = parseHash(location.hash).path[0] === 'desk' ? location.hash : '#/desk';
  history.replaceState(null, '', location.pathname + location.search + deskHash);
  const { renderDesk } = await import('./desk/desk');
  if (ui !== 'desk') return;
  disposeDesk = renderDesk(app, {
    toModern: (projectId, file) => {
      disposeDesk?.();
      disposeDesk = undefined;
      startModern(projectId ? `#/p/${projectId}${file ? `/${encodeURIComponent(file)}` : ''}` : '#/');
    },
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
      h('a', { class: 'hide-narrow', href: '#/cast', title: 'Who’s who in the new games, and the kinds of games' }, 'Cast'),
      h('a', { class: 'hide-narrow', href: '#/achievements', title: 'What you’ve done: your achievements, here and on the 1994 desk' }, 'Achievements'),
      h('a', { href: '#/help', title: `How to use ${PRODUCT}` }, '? Guide'),
      themeButton(),
      h(
        'button',
        { class: 'hide-narrow', onclick: () => void startDesk(), title: 'Go back to the mid-90s desk', 'aria-label': 'Back to the 1994 desk' },
        h('span', { 'aria-hidden': 'true' }, '💾'),
        ' 1994 desk',
      ),
      h('a', { class: 'hide-narrow', href: SOURCE_URL, target: '_blank', rel: 'noopener' }, 'Source'),
      // phones: the cast, the desk and the source in a small menu, so the header stays one tidy row
      h(
        'details',
        { class: 'topbar-more show-narrow' },
        h('summary', { 'aria-label': 'More: the cast, the 1994 desk and the source code', title: 'More' }, '⋯'),
        h(
          'div',
          { class: 'topbar-menu' },
          h('a', { href: '#/cast' }, '🎭 The cast'),
          h('a', { href: '#/achievements' }, '🏆 What you’ve done'),
          h('button', { onclick: () => void startDesk() }, '💾 1994 desk'),
          h('a', { href: SOURCE_URL, target: '_blank', rel: 'noopener' }, 'Source on GitHub'),
        ),
      ),
    ),
    content,
  );
  if (hash !== undefined && location.hash !== hash) location.hash = hash;
  else void route();
}

const SOURCE_URL = 'https://github.com/lewismoten/GameMaker-SandboxEdition';

// The header's ⋯ menu closes when something else is clicked or a choice is made.
document.addEventListener('click', (e) => {
  const open = document.querySelector<HTMLDetailsElement>('.topbar-more[open]');
  if (open && (!open.contains(e.target as Node) || (e.target as Element).closest('.topbar-menu'))) open.open = false;
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
  content.removeAttribute('role');
  const { renderHome, renderWebManual, openStored } = await modernUi();
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
  clear(titleSlot);
  if (kind === 'cast') {
    const { renderCast } = await import('./cast/castPage');
    if (ui !== 'modern') return;
    document.title = `The cast · ${PRODUCT}`;
    renderCast(content);
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
    const { title } = { title: id ? decodeURIComponent(id).replace(/-/g, ' ') : '' };
    document.title = `${title ? `${title[0].toUpperCase()}${title.slice(1)} · ` : ''}Guide · ${PRODUCT}`;
    renderWebManual(content, id);
    return;
  }
  document.title = PRODUCT;
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

window.addEventListener('hashchange', () => void route());

// Links into today's web (a project #/p/…, a game on the home page #/game/…, the guide
// #/help, the cast #/cast, the Mac, Windows and Linux pages #/mac, #/windows and #/linux, the home page #/) open it, #/desk the desk; otherwise use the last choice.
// index.html makes the same choice for the page background before the first paint.
const startHash = location.hash;
const startPath = parseHash(startHash).path;
const modernLink = /^#\/?(\?|$)/.test(startHash) ? !!startHash : ['p', 'game', 'help', 'cast', 'achievements', 'mac', 'windows', 'linux'].includes(startPath[0] ?? '');
if (modernLink || (startPath[0] !== 'desk' && savedUi() === 'modern')) startModern();
else void startDesk();

registerServiceWorker();
// achievements: the gm-achievement event, other tabs, and the counted ones kept current
void import('./achievements/start').then((m) => m.startAchievements());

watchForUpdates();
