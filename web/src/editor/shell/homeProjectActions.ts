// What can be done to a game of your own from the home page, besides opening it: rename it,
// make a duplicate, download it (download.ts), rate an imported one and note it (imported/
// noteDialog.ts), or delete it (with a few seconds to undo).
import { h, promptText, toast } from '../core/ui';
import { deleteProject, listProjects, loadProject, newId, saveProject } from '../../project/storage';
import { projectDownloadItem } from './projectExport';
import { forgetOrigin, isImported, originId, rememberOrigin, setImported } from './homeOrigin';
import { noteRemoval, undoRemoval } from '../../imported/noteMoves';
import { bringBack, shelve } from './deletedShelf';
import { forgetUsed } from '../../project/projectUse';

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
  const name = copyName(
    p.name,
    (await listProjects()).map((x) => x.name),
  );
  const companion = stored.record.companion ? structuredClone(stored.record.companion) : undefined;
  // A deliberate duplicate is a distinct Pocket game; restoring a backup keeps its identity.
  if (companion) delete companion.pocketUid;
  await saveProject(id, name, stored.record.gam, stored.files, companion);
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
  await shelve(p.id); // kept 7 days (Recently deleted…), whatever the Undo below does
  await deleteProject(p.id);
  forgetOrigin(p.id);
  setImported(p.id, false);
  forgetUsed(p.id);
  // an imported game leaves a record: its fingerprint, rating and note (imported/removedGames.ts)
  if (imported) noteRemoval(p, stored.record.files);
  await refresh();
  undoToast(`Deleted “${p.name}”. It stays under Recently deleted for 7 days.`, async () => {
    if (await bringBack(p.id)) return refresh();
    await saveProject(p.id, stored.record.name, stored.record.gam, stored.files, stored.record.companion);
    rememberOrigin(p.id, origin);
    setImported(p.id, imported);
    if (imported) undoRemoval(p.id);
    await refresh();
  });
}

/** Lists a game under Imported, or under My games. */
async function move(p: ProjectSummary, imported: boolean, refresh: () => Promise<void>): Promise<void> {
  setImported(p.id, imported);
  toast(`“${p.name}” is now listed under ${imported ? 'Imported' : 'My games'}.`);
  await refresh();
}

/**
 * A notice with an Undo button, for a few seconds. It waits while the pointer is over it or focus
 * is in it, and a screen reader hears it (the live region is in the page before its words are).
 */
export function undoToast(message: string, undo: () => Promise<void>, ms = UNDO_MS, onExpire?: () => void): void {
  document.querySelector('.home-undo')?.remove();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const done = () => {
    clearTimeout(timer);
    note.remove();
    onExpire?.();
  };
  const wait = () => {
    clearTimeout(timer);
    timer = setTimeout(done, ms);
  };
  const text = h('span', null);
  const note = h(
    'div',
    { class: 'home-undo', role: 'status' },
    text,
    h('button', { type: 'button', onclick: () => void undo().then(done) }, 'Undo'),
    h('button', { type: 'button', class: 'home-undo-close', 'aria-label': 'Dismiss', title: 'Dismiss', onclick: done }, '×'),
  );
  note.addEventListener('pointerenter', () => clearTimeout(timer));
  note.addEventListener('pointerleave', () => !note.contains(document.activeElement) && wait());
  note.addEventListener('focusin', () => clearTimeout(timer));
  note.addEventListener('focusout', () => !note.matches(':hover') && wait());
  wait();
  document.body.append(note);
  setTimeout(() => (text.textContent = message), 50);
}

/** The items of a game of yours' ⋯ More menu. `onMade`: a duplicate was made (its id). */
export function projectMenuItems(p: ProjectSummary, refresh: () => Promise<void>, onMade?: (id: string) => void): (HTMLElement | null)[] {
  return [
    h('button', { onclick: () => void rename(p, refresh) }, 'Rename…'),
    isImported(p.id)
      ? h(
          'button',
          { onclick: () => void import('../../imported/noteDialog').then((m) => m.editGameNote(p)), title: 'Its stars and your note, kept in this browser' },
          'Rating and note…',
        )
      : null,
    h('button', { onclick: () => void duplicate(p, refresh, onMade), title: 'A second copy to try something out on' }, 'Duplicate'),
    projectDownloadItem(p.id),
    isImported(p.id)
      ? h('button', { onclick: () => void move(p, false, refresh), title: 'List it with the games you make here' }, 'Move to My games')
      : h('button', { onclick: () => void move(p, true, refresh), title: 'List it with the games brought in from elsewhere' }, 'Move to Imported'),
    h('button', { class: 'danger', onclick: () => void remove(p, refresh) }, 'Delete'),
  ];
}
