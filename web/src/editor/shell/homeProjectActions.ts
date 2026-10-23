// What can be done to a game of your own from the home page, besides opening it: rename it,
// make a duplicate, download it, export it, or delete it (with a few seconds to undo).
import { h, promptText, toast } from '../core/ui';
import { deleteProject, listProjects, loadProject, newId, saveProject } from '../../project/storage';
import { downloadProject, exportProject, exportProjectPage, exportProjectForDos, exportProjectForMac, exportProjectForWindows } from './projectExport';
import { forgetOrigin, isImported, originId, rememberOrigin, setImported } from './homeOrigin';

type ProjectSummary = Awaited<ReturnType<typeof listProjects>>[number];

/** How long Undo stays offered after a delete. */
const UNDO_MS = 10000;

async function rename(p: ProjectSummary, refresh: () => Promise<void>): Promise<void> {
  const name = await promptText('Rename game', 'Name (in your list of games)', p.name);
  if (!name || name === p.name) return;
  const stored = await loadProject(p.id);
  if (!stored) return toast('That game is not in this browser any more.', 'error');
  await saveProject(p.id, name, stored.record.gam, stored.files);
  await refresh();
}

/** A name for a duplicate that no game of yours has yet: “Nebula copy”, “Nebula copy 2”… */
export function copyName(name: string, taken: string[]): string {
  const base = `${name.replace(/ copy( \d+)?$/, '')} copy`;
  const used = new Set(taken.map((n) => n.toLowerCase()));
  for (let i = 1; ; i++) {
    const n = i === 1 ? base : `${base} ${i}`;
    if (!used.has(n.toLowerCase())) return n;
  }
}

async function duplicate(p: ProjectSummary, refresh: () => Promise<void>, onMade?: (id: string) => void): Promise<void> {
  const stored = await loadProject(p.id);
  if (!stored) return toast('That game is not in this browser any more.', 'error');
  const id = newId();
  const name = copyName(p.name, (await listProjects()).map((x) => x.name));
  await saveProject(id, name, stored.record.gam, stored.files);
  rememberOrigin(id, originId(p.id));
  setImported(id, isImported(p.id));
  toast(`Made “${name}”.`);
  await refresh();
  onMade?.(id);
}

async function remove(p: ProjectSummary, refresh: () => Promise<void>): Promise<void> {
  const stored = await loadProject(p.id);
  if (!stored) return refresh();
  const origin = originId(p.id);
  const imported = isImported(p.id);
  await deleteProject(p.id);
  forgetOrigin(p.id);
  setImported(p.id, false);
  await refresh();
  undoToast(`Deleted “${p.name}”.`, async () => {
    await saveProject(p.id, stored.record.name, stored.record.gam, stored.files);
    rememberOrigin(p.id, origin);
    setImported(p.id, imported);
    await refresh();
  });
}

/** Lists a game under Imported, or under My games. */
async function move(p: ProjectSummary, imported: boolean, refresh: () => Promise<void>): Promise<void> {
  setImported(p.id, imported);
  toast(`“${p.name}” is now listed under ${imported ? 'Imported' : 'My games'}.`);
  await refresh();
}

/** A notice with an Undo button, for a few seconds. */
function undoToast(message: string, undo: () => Promise<void>): void {
  document.querySelector('.home-undo')?.remove();
  const done = () => {
    clearTimeout(timer);
    note.remove();
  };
  const note = h(
    'div',
    { class: 'home-undo', role: 'status' },
    h('span', null, message),
    h('button', { type: 'button', onclick: () => void undo().then(done) }, 'Undo'),
    h('button', { type: 'button', class: 'home-undo-close', 'aria-label': 'Dismiss', title: 'Dismiss', onclick: done }, '×'),
  );
  const timer = setTimeout(done, UNDO_MS);
  document.body.append(note);
}

/** The items of a game of yours' ⋯ More menu. `onMade`: a duplicate was made (its id). */
export function projectMenuItems(p: ProjectSummary, refresh: () => Promise<void>, onMade?: (id: string) => void): HTMLElement[] {
  return [
    h('button', { onclick: () => void rename(p, refresh) }, 'Rename…'),
    h('button', { onclick: () => void duplicate(p, refresh, onMade), title: 'A second copy to try something out on' }, 'Duplicate'),
    h('button', { onclick: () => void downloadProject(p.id), title: 'Keep a copy safe outside this browser' }, 'Download .zip'),
    h('button', { onclick: () => void exportProject(p.id) }, 'Export web app'),
    h('button', { onclick: () => void exportProjectPage(p.id), title: 'One .html file with the game and player inside' }, 'Export as one web page'),
    h('button', { onclick: () => void exportProjectForDos(p.id) }, 'Export for DOS'),
    h('button', { onclick: () => void exportProjectForMac(p.id), title: 'A Mac app of the game (.dmg or .zip), built here' }, 'Download for Mac'),
    h('button', { onclick: () => void exportProjectForWindows(p.id), title: 'A Windows program of the game (.exe or .zip), built here' }, 'Download for Windows'),
    isImported(p.id)
      ? h('button', { onclick: () => void move(p, false, refresh), title: 'List it with the games you make here' }, 'Move to My games')
      : h('button', { onclick: () => void move(p, true, refresh), title: 'List it with the games brought in from elsewhere' }, 'Move to Imported'),
    h('button', { class: 'danger', onclick: () => void remove(p, refresh) }, 'Delete'),
  ];
}
