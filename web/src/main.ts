// Game-Maker Web (index.html): the mid-90s desk, or today's web interface.
import './editor/editor.css';
import './editor/editors/all';
import { h, clear, toast } from './editor/ui';
import { renderHome } from './editor/home';
import { Workspace } from './editor/workspace';
import { Project } from './editor/project';
import { loadProject } from './project/storage';
import { renderDesk } from './desk/desk';
import { watchForUpdates } from './devReload';

type Ui = 'desk' | 'modern';
const UI_KEY = 'gm-ui';

const app = document.querySelector<HTMLElement>('#app')!;
const titleSlot = h('span');
const content = h('div');
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

function startDesk(): void {
  ui = 'desk';
  rememberUi('desk');
  workspace?.dispose();
  workspace = undefined;
  document.title = 'Game-Maker 1994';
  history.replaceState(null, '', location.pathname + location.search);
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
  clear(
    app,
    h(
      'header',
      { class: 'topbar' },
      h('a', { href: '#/' }, h('h1', null, 'GAME-MAKER')),
      titleSlot,
      h('span', { class: 'spacer' }),
      h('button', { onclick: () => startDesk(), title: 'Go back to the mid-90s desk' }, '💾 1994 desk'),
      h('a', { href: 'https://github.com/lewismoten/GameMaker', target: '_blank', rel: 'noopener' }, 'Source'),
    ),
    content,
  );
  if (hash !== undefined && location.hash !== hash) location.hash = hash;
  else void route();
}

const nav = {
  openProject: (id: string) => {
    location.hash = `#/p/${id}`;
  },
};

async function route(): Promise<void> {
  if (ui !== 'modern') return;
  const [, kind, id, file] = location.hash.split('/');
  if (kind === 'p' && id) {
    if (workspace?.project.id === id) {
      if (file && decodeURIComponent(file) !== workspace.currentFile) workspace.open(decodeURIComponent(file));
      return;
    }
    workspace?.dispose();
    const stored = await loadProject(id);
    if (!stored) {
      toast('That game is not in this browser any more.', 'error');
      location.hash = '#/';
      return;
    }
    const project = Project.fromFiles(stored.files, stored.record.name, id);
    project.gam = stored.record.gam;
    clear(titleSlot, ` · ${project.name}`);
    document.title = `${project.name} · Game-Maker Web`;
    workspace = new Workspace(content, project, file ? decodeURIComponent(file) : undefined);
    return;
  }
  workspace?.dispose();
  workspace = undefined;
  clear(titleSlot);
  document.title = 'Game-Maker Web';
  await renderHome(content, nav);
}

window.addEventListener('hashchange', () => void route());

// Links into a project (#/p/…) always open today's web; otherwise use the last choice.
if (location.hash.startsWith('#/p/') || savedUi() === 'modern') startModern();
else startDesk();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}

watchForUpdates();
