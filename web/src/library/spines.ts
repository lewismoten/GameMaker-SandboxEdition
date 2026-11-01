// A book spine on the Library room's far wall (libraryRoom.ts): the open drawer's item as a button
// (or a link, for a piece that is a page) with its title in tiny type; the full name is its label.
// The last spine of a full shelf is "more on this shelf", which opens the whole list.
import { h } from '../editor/core/ui';
import { tally } from '../achievements';
import type { ShelfItem } from './shelf';

/** Dark spine colors, each with white type above 4.5:1. */
const COLORS = ['#7a2622', '#234b73', '#2f6238', '#573a75', '#8a4a1c', '#1f5a5a', '#8c2f4d', '#46505c'];

function colorOf(text: string): string {
  let n = 0;
  for (const c of text) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[n % COLORS.length];
}

export function makeSpine(item: ShelfItem | undefined, open: (from: HTMLElement) => void): HTMLElement {
  if (!item) {
    const b = h(
      'button',
      { type: 'button', class: 'lib-spine-btn', 'aria-label': 'More on this shelf: open the whole list', title: 'More on this shelf…', onclick: () => open(b) },
      '…',
    );
    b.style.setProperty('--spine', '#3b3b44');
    return b;
  }
  const props = { class: 'lib-spine-btn', style: `--spine:${colorOf(item.owner + item.type)}`, 'aria-label': item.title, title: item.title };
  if (item.open.via === 'href') return h('a', { ...props, href: item.open.href, onclick: () => tally('library-kinds', item.type) }, item.title);
  const b = h('button', { ...props, type: 'button', onclick: () => open(b) }, item.title);
  return b;
}
