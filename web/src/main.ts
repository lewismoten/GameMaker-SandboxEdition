// Game-Maker Web (index.html): the mid-90s desk, or today's web interface.
//
// Each is its own download: this entry holds only the switch between them, and the desk
// (desk/, retro/, vga/) or today's web (editor/shell, the editors) is imported when it is
// first shown. The editors themselves load when a game is opened (or the desk's PC opens one).
import './editor/shell/editor.css';
import { h, clear, toast } from './editor/core/ui';
import type { Workspace } from './editor/shell/workspace';
import { watchForUpdates } from './devReload';
import { registerServiceWorker } from './offline';
import { EDITION, FORK_NOTE, PRODUCT, SHORT } from './edition';
import './edition.css';
import { themeButton } from './theme';

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
  history.replaceState(null, '', location.pathname + location.search);
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
      h('a', { href: '#/help', title: `How to use ${PRODUCT}` }, '? Guide'),
      themeButton(),
      h(
        'button',
        { class: 'hide-narrow', onclick: () => void startDesk(), title: 'Go back to the mid-90s desk', 'aria-label': 'Back to the 1994 desk' },
        h('span', { 'aria-hidden': 'true' }, '💾'),
        ' 1994 desk',
      ),
      h('a', { class: 'hide-narrow', href: SOURCE_URL, target: '_blank', rel: 'noopener' }, 'Source'),
      // phones: the desk and the source in a small menu, so the header stays one tidy row
      h(
        'details',
        { class: 'topbar-more show-narrow' },
        h('summary', { 'aria-label': 'More: the 1994 desk and the source code', title: 'More' }, '⋯'),
        h(
          'div',
          { class: 'topbar-menu' },
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
  const [, kind, id, file] = location.hash.split('/');
  content.removeAttribute('role');
  const { renderHome, renderWebManual, openStored } = await modernUi();
  if (ui !== 'modern') return;
  if (kind === 'p' && id) {
    if (workspace?.project.id === id) {
      if (file && decodeURIComponent(file) !== workspace.currentFile) workspace.open(decodeURIComponent(file));
      return;
    }
    workspace?.dispose();
    workspace = undefined;
    const opened = await openStored(id, content, file ? decodeURIComponent(file) : undefined);
    if (!opened) {
      toast('That game is not in this browser any more.', 'error');
      location.hash = '#/';
      return;
    }
    workspace = opened;
    clear(titleSlot, ` · ${opened.project.name}`);
    document.title = `${opened.project.name} · ${SHORT}`;
    return;
  }
  workspace?.dispose();
  workspace = undefined;
  clear(titleSlot);
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

window.addEventListener('hashchange', () => void route());

// Links into today's web (a project #/p/…, a game on the home page #/game/…, the guide
// #/help, the home page #/) open it, #/desk the desk; otherwise use the last choice.
// index.html makes the same choice for the page background before the first paint.
const startHash = location.hash;
const modernLink = /^#\/(p\/|game\/|help(\/[\w-]+)?$|$)/.test(startHash);
if (modernLink || (startHash !== '#/desk' && savedUi() === 'modern')) startModern();
else void startDesk();

registerServiceWorker();

watchForUpdates();
