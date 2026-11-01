// The Library's card catalog (libraryPage.ts): a wooden cabinet with a drawer for each group of the
// sort, a brass label holder on each with its call number (tinyShelf.ts), name and count. The
// drawers are ARIA tabs (arrow keys, Home and End, one tab stop) that switch the stacks below.
import { h } from '../editor/core/ui';
import type { ShelfGroup, ShelfOrder } from './shelf';
import { drawerCall } from './tinyShelf';

export const drawerId = (key: string) => `lib-drawer-${key}`;

export interface Cabinet {
  el: HTMLElement;
  /** Shows these drawers with `open` pulled out (rebuilt only when the drawers changed). */
  update(groups: readonly ShelfGroup[], open: string, order: ShelfOrder): void;
}

const count = (g: ShelfGroup) => g.parts.reduce((n, p) => n + p.items.length, 0);

export function makeCabinet(onPick: (key: string) => void): Cabinet {
  const el = h('div', { class: 'lib-cabinet', role: 'tablist', 'aria-label': 'Card catalog: pick a drawer', 'aria-orientation': 'horizontal' });
  let sig = '';
  const tabs = () => [...el.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const select = (open: string) =>
    tabs().forEach((t) => {
      const on = t.dataset.key === open;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
  el.addEventListener('keydown', (e) => {
    const all = tabs();
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = all[(to + all.length) % all.length];
    next.focus();
    onPick(next.dataset.key!);
  });
  return {
    el,
    update(groups, open, order) {
      const now = groups.map((g) => `${g.key}:${count(g)}`).join(',') + order;
      if (now !== sig) {
        sig = now;
        el.replaceChildren(
          ...groups.map((g) =>
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                class: 'lib-drawer',
                id: drawerId(g.key),
                'data-key': g.key,
                onclick: () => onPick(g.key),
              },
              h('span', { class: 'lib-holder' }, h('span', { class: 'lib-call' }, drawerCall(g, order)), h('span', { class: 'lib-dname' }, g.heading)),
              h('span', { class: 'lib-pull', 'aria-hidden': 'true' }),
            ),
          ),
        );
      }
      select(open);
    },
  };
}

/** The brass plaque on the cabinet's top rail: the Tiny Pockets Press logo (public/library/, ISC, Lewis Moten). */
export function plaque(): HTMLElement {
  return h(
    'div',
    { class: 'lib-rail' },
    h(
      'span',
      { class: 'lib-plaque' },
      h('img', { src: './library/tiny-pockets-press.webp', alt: '', width: 20, height: 20 }),
      h('span', null, 'Tiny Pockets Library'),
    ),
  );
}
