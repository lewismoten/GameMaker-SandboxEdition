// Game-Maker Web: the editor application (index.html).
import './editor/editor.css';
import './editor/editors/all';
import { h, clear, toast } from './editor/ui';
import { renderHome } from './editor/home';
import { Workspace } from './editor/workspace';
import { Project } from './editor/project';
import { loadProject } from './project/storage';

const app = document.querySelector<HTMLElement>('#app')!;
const titleSlot = h('span');
const content = h('div');
let workspace: Workspace | undefined;

clear(
  app,
  h('header', { class: 'topbar' }, h('a', { href: '#/' }, h('h1', null, 'GAME-MAKER')), titleSlot, h('span', { class: 'spacer' }), h('a', { href: 'https://github.com/lewismoten/GameMaker', target: '_blank', rel: 'noopener' }, 'Source')),
  content,
);

const nav = {
  openProject: (id: string) => {
    location.hash = `#/p/${id}`;
  },
};

async function route(): Promise<void> {
  const [, kind, id, file] = location.hash.split('/');
  if (kind === 'p' && id) {
    if (workspace?.project.id === id) {
      if (file) workspace.open(decodeURIComponent(file));
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
void route();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}
