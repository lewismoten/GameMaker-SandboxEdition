// "Edit a copy" when you already have a copy: it's easy to make a second, third and fourth
// copy of the same game by mistake, so first offer the ones you have.
import './homeCopies.css';
import { h, modal } from '../core/ui';
import { listProjects } from '../../project/storage';
import { originId } from './homeOrigin';
import { editedWhen } from './homeTime';

export interface CopyRecord {
  id: string;
  name: string;
  gam: string;
  updated: number;
}

/**
 * Your copies of a catalog game, newest first: the ones made from it here, or (made before
 * copies remembered their origin) with no origin and the same .gam name.
 */
export function copiesOf(catalogId: string, gam: string | null | undefined, projects: CopyRecord[], origin: (id: string) => string | undefined = originId): CopyRecord[] {
  const name = gam?.toLowerCase();
  return projects
    .filter((p) => {
      const from = origin(p.id);
      return from ? from === catalogId : !!name && p.gam.toLowerCase() === name;
    })
    .sort((a, b) => b.updated - a.updated);
}

/**
 * Asks before making another copy when there are some already. Resolves with a copy to open,
 * 'new' to make a new copy anyway, or undefined (cancelled). With no copies, 'new' at once.
 */
export async function chooseCopy(title: string, catalogId: string, gam: string | null | undefined): Promise<CopyRecord | 'new' | undefined> {
  const copies = copiesOf(catalogId, gam, await listProjects().catch(() => []));
  if (!copies.length) return 'new';
  return modal<CopyRecord | 'new'>(copies.length === 1 ? `You already have a copy of ${title}` : `You already have ${copies.length} copies of ${title}`, (close) => [
    h('p', { class: 'copies-intro' }, 'Pick up where you left off, or start a fresh copy from the original.'),
    h(
      'ul',
      { class: 'copies-list' },
      ...copies.map((c, i) =>
        h(
          'li',
          null,
          h('span', { class: 'copies-name' }, h('b', null, c.name), h('small', null, editedWhen(c.updated))),
          h('button', { class: i === 0 ? 'primary' : '', autofocus: i === 0, onclick: () => close(c) }, 'Open'),
        ),
      ),
    ),
    h('div', { class: 'copies-actions' }, h('button', { onclick: () => close('new') }, '+ Make another copy'), h('button', { onclick: () => close(undefined) }, 'Cancel')),
  ]);
}
