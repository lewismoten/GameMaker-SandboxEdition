// The disk box's index-card dividers, drawn: a manila card with a colored tab standing in the
// row before each group (its tab folds the group shut), and the row of tabs above each case
// that jumps to a group. Which group a disk is in: diskGroups.ts.
import { h } from '../../editor/core/ui';
import { DISK_GROUPS, type DiskGroup } from './diskGroups';

export interface GroupView {
  id: DiskGroup;
  name: string;
  /** The card standing in the row, its fold button, and the disks behind it. */
  section: HTMLElement;
  fold: HTMLButtonElement;
  list: HTMLElement;
  /** "No disks match" while a search leaves the group empty. */
  none: HTMLElement;
  /** The tab above the case that jumps here. */
  jump: HTMLButtonElement;
  setCount: (shown: number, of: number, filtering: boolean) => void;
  setFolded: (folded: boolean) => void;
}

let ids = 0;

/** One group's divider, list and jump tab; `place` staggers the tab along the card's top edge. */
export function groupView(id: DiskGroup, place: number, onFold: () => void, onJump: () => void): GroupView {
  const meta = DISK_GROUPS.find((g) => g.id === id)!;
  const listId = `disk-group-${id}-${++ids}`;
  const count = h('span', { class: 'divider-count' });
  const jumpCount = h('span', { class: 'divider-count' });
  const fold = h(
    'button',
    { type: 'button', class: 'divider-tab', 'aria-controls': listId, onclick: onFold },
    h('span', { class: 'divider-name' }, meta.name),
    ' ',
    count,
  );
  const jump = h('button', { type: 'button', class: 'index-tab', onclick: onJump }, h('span', null, meta.name), ' ', jumpCount);
  const list = h('div', { class: 'disk-list', role: 'listbox', id: listId, 'aria-label': `${meta.name} disks` });
  const none = h('p', { class: 'no-match', hidden: true }, 'No disks match');
  const card = h('div', { class: 'divider' }, fold, h('div', { class: 'divider-card', 'aria-hidden': 'true' }));
  const section = h('div', { class: 'disk-group', dataset: { group: id }, style: `--tab:${meta.tab};--place:${place % 4}` }, card, none, list);
  jump.style.setProperty('--tab', meta.tab);
  return {
    id,
    name: meta.name,
    section,
    fold,
    list,
    none,
    jump,
    setCount(shown, of, filtering) {
      const text = filtering ? `${shown} of ${of}` : String(of);
      count.textContent = text;
      // the tab above the case keeps to one number, so the row of tabs keeps its size while searching
      jumpCount.textContent = String(filtering ? shown : of);
      const what = filtering ? `${shown} of ${of} disks match` : `${of} ${of === 1 ? 'disk' : 'disks'}`;
      jump.title = `Go to ${meta.name}: ${what}`;
      none.hidden = !filtering || shown > 0;
    },
    setFolded(folded) {
      fold.setAttribute('aria-expanded', String(!folded));
      fold.title = folded ? `Open ${meta.name}` : `Fold ${meta.name} shut`;
      section.classList.toggle('folded', folded);
      list.hidden = folded;
    },
  };
}
