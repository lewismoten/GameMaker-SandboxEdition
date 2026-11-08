// The note shown when a stored project had damaged parts (project/recover.ts): what is broken, in
// plain words, with a button to replace each piece from a file or drop it. It is a region the
// keyboard reaches, and its summary is announced politely. The damaged save is kept whole (see
// storage.ts loadProject), so dropping is never the only copy.
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { emptyCompanion } from '../../project/companion';
import type { Damage } from '../../project/recover';
import './recoverNotice.css';

/** Adds the notice to the page and returns it; the person can close it once every line is settled. */
export function recoverNotice(project: Project, damage: Damage[], into: HTMLElement = document.body): HTMLElement {
  const summary = h('p', { class: 'recover-summary', role: 'status', 'aria-live': 'polite' });
  const list = h('ul', { class: 'recover-list' });
  const title = h('h2', { id: 'recover-title' }, 'Part of this saved game was damaged');
  const root = h('section', { class: 'recover-notice', 'aria-labelledby': 'recover-title' }, title, summary, list);
  let open = damage.length;
  const settle = (li: HTMLElement, said: string) => {
    li.replaceChildren(said);
    li.classList.add('done');
    open -= 1;
    summary.textContent = open ? `${open} left to settle.` : 'All settled. Changes save as usual.';
    if (!open) window.setTimeout(() => root.remove(), 4000);
  };
  for (const d of damage) {
    const li = h('li', null, h('span', null, d.message));
    const pick = h('input', { type: 'file', class: 'sr-only', tabindex: '-1', 'aria-label': `Choose a file to replace ${d.file ?? 'it'}` });
    pick.addEventListener('change', () => {
      const f = pick.files?.[0];
      if (!f || !d.file) return;
      void f.arrayBuffer().then((b) => {
        project.files.set(d.file!, new Uint8Array(b));
        settle(li, `${d.file} was replaced with ${f.name}.`);
      });
    });
    const actions = h('span', { class: 'recover-actions' });
    if (d.file && (d.kind === 'file' || d.kind === 'missing')) {
      actions.append(h('button', { type: 'button', onclick: () => pick.click() }, `Replace ${d.file}…`), pick);
    }
    actions.append(
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            // the stored companion would otherwise be kept by the next autosave, so an empty one replaces it
            if (d.kind === 'companion') {
              project.companion = emptyCompanion();
              void project.saveNow();
            }
            settle(li, d.kind === 'companion' ? 'Starting with empty notes.' : `${d.file ?? 'That piece'} was dropped.`);
          },
        },
        'Drop it',
      ),
    );
    li.append(actions);
    list.append(li);
  }
  into.append(root);
  // the live region is filled after it exists, so a screen reader announces it
  window.setTimeout(
    () =>
      (summary.textContent = `${damage.length} ${damage.length === 1 ? 'thing is' : 'things are'} broken. The rest of the game opened. A copy of the damaged save is kept.`),
    50,
  );
  return root;
}
