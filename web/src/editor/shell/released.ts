// 🔍 Look inside: a finished game from the home page (gameware, Sandbox, the Bard of Bizarre's,
// shareware) opened in the editor as released, without making a copy. Its files load into an
// in-memory project that editor/core/readOnly.ts makes refuse every change: it is never saved
// to this browser, never listed in My games and keeps no companion data but its DOS player
// look (dosPlayer/catalogPatches.ts). Its address is #/p/look:<id>/<file> (lookId.ts), so
// reload and Back work.
//
// A change tried on it asks first. A game free to change (gameware, Sandbox, the Bard's):
// "Make a copy and keep going" runs Edit a copy's flow (homeCards.ts copyCatalogGame) and
// opens the copy at the same file, to make the change again there. Shareware (its author's,
// play only): it stays look-only, with the author's notice.
import { h, modal, toast, confirmDialog } from '../core/ui';
import { Project } from '../core/project';
import { isReadOnlyError, makeReadOnly, restoreFiles } from '../core/readOnly';
import { GameFiles, loadGameList, loadHostedGame, isSandboxGame, type CatalogEntry } from '../../project/files';
import { isBizarreGame } from '../../project/bizarre';
import { currentRoute, formatHash } from '../../urlState';
import { copyCatalogGame, showNotice } from './homeCards';
import { lookId } from './lookId';
import type { Workspace } from './workspace';
import './released.css';

/** Shareware by someone else: play and look only (as Edit a copy is left off its card). */
export const isPlayOnly = (e: CatalogEntry): boolean => e.kind === 'shareware' && !isSandboxGame(e) && !isBizarreGame(e);

interface Released {
  entry: CatalogEntry;
  /** Its files as they arrived, for a copy and for putting back anything an editor changed in place. */
  original: GameFiles;
  workspace?: Workspace;
}

const released = new WeakMap<Project, Released>();

// a refused change throws ReadOnlyError out of whatever handler tried it: the dialog says what happened, so the console need not
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => isReadOnlyError(e.error) && e.preventDefault());
  window.addEventListener('unhandledrejection', (e) => isReadOnlyError(e.reason) && e.preventDefault());
}

/** Opens catalog game `catalogId` to look inside, in `host`; undefined when there is no such game here. */
export async function openReleased(catalogId: string, host: HTMLElement, file?: string): Promise<Workspace | undefined> {
  const status = h('p', { class: 'hint released-loading', role: 'status' }, 'Opening the game’s files…');
  host.replaceChildren(status);
  const [catalog, { Workspace }] = await Promise.all([loadGameList(), import('./workspace')]);
  const entry = catalog.find((g) => g.id === catalogId && g.gam);
  if (!entry?.gam) return undefined;
  const original = await loadHostedGame(entry, './', (done, total) => (status.textContent = `Opening ${entry.title}: ${done} of ${total} files…`));
  // its DOS player look (an original game's player.json) shows in the integrator's DOS player panel and its Play
  const { catalogCompanion } = await import('../../dosPlayer/catalogPatches');
  const project = Project.fromFiles(
    new GameFiles(original.entries().map(([n, b]) => [n, b.slice()])),
    entry.title,
    lookId(entry.id),
    catalogCompanion(entry, entry.gam),
  );
  project.gam = entry.gam;
  const r: Released = { entry, original };
  released.set(project, r);
  let asking = false;
  makeReadOnly(project, {
    title: entry.title,
    attempted: () => {
      if (asking) return;
      asking = true;
      // after the refused change has unwound
      setTimeout(() => void ask(project, r).finally(() => (asking = false)));
    },
  });
  r.workspace = new Workspace(host, project, file);
  return r.workspace;
}

/** Asks what to do about a refused change: a copy to keep going in, or (shareware) why not. */
async function ask(project: Project, r: Released): Promise<void> {
  const title = r.entry.title;
  if (isPlayOnly(r.entry)) {
    await modal<void>(`${title}: look only`, (close) => [
      h(
        'p',
        null,
        `${title} is shareware, its author’s own game, shown here as released. You can play it and look inside, but it can’t be changed or copied here.`,
      ),
      h(
        'div',
        { class: 'buttons' },
        h('button', { onclick: () => void showNotice(r.entry) }, 'Read its notice'),
        h('button', { class: 'primary', onclick: () => close(undefined) }, 'OK'),
      ),
    ]);
    putBack(project, r);
    return;
  }
  const copy = await confirmDialog(`${title} as released`, `This is ${title} as released. Make a copy to change it?`, 'Make a copy and keep going');
  if (!copy || !(await copyAndSwitch(r, true))) putBack(project, r);
}

/** Undoes what an editor showed of a refused change: its files as released, and the file opened afresh. */
function putBack(project: Project, r: Released): void {
  restoreFiles(project, r.original);
  const ws = r.workspace;
  if (ws?.currentFile) ws.open(ws.currentFile);
}

/** Edit a copy's flow; then the copy opens at the same file and settings (`again`: to redo a refused change). False when canceled. */
async function copyAndSwitch(r: Released, again = false): Promise<boolean> {
  const e = r.entry;
  const id = await copyCatalogGame(e, e.title, e.gam, async () => new GameFiles(r.original.entries().map(([n, b]) => [n, b.slice()])));
  if (!id) return false;
  const file = r.workspace?.currentFile ?? e.gam ?? '';
  const old = document.querySelector('main.editor');
  location.hash = formatHash(['p', id, file], currentRoute().params);
  focusCopy(old);
  toast(again ? 'Your copy is open; make the change again.' : `Your copy of ${e.title} is open.`);
  return true;
}

/** The bar over a look-only game's editor: what it is, and a copy (or, for shareware, its notice). */
export function readOnlyBar(project: Project): HTMLElement | null {
  const r = released.get(project);
  if (!r) return null;
  const title = r.entry.title;
  const playOnly = isPlayOnly(r.entry);
  return h(
    'div',
    { class: 'released-bar', role: 'region', 'aria-label': 'Read-only' },
    h('strong', { class: 'released-tag' }, playOnly ? 'Look only' : 'Read-only'),
    h('span', { class: 'released-text' }, playOnly ? `${title} is its author’s shareware: play it and look inside.` : `${title} as released.`),
    playOnly
      ? h('button', { onclick: () => void showNotice(r.entry) }, 'Notice')
      : h(
          'button',
          { class: 'primary', 'aria-label': `Edit a copy of ${title}: makes your own copy and opens it`, onclick: () => void copyAndSwitch(r) },
          '✎ Edit a copy',
        ),
  );
}

/** The bar's button is gone with the released game's editor: once the copy's is on the page, focus goes there. */
function focusCopy(old: Element | null): void {
  const until = performance.now() + 5000;
  const look = () => {
    const main = document.querySelector<HTMLElement>('main.editor');
    const ready = main && main !== old;
    if (!ready && performance.now() < until) return void requestAnimationFrame(look);
    const at = document.activeElement;
    if (!main || (at && at !== document.body && at.isConnected)) return;
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  };
  requestAnimationFrame(look);
}
