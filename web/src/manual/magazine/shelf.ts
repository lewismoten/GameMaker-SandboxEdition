// A `shelf` block (types.ts): a long alphabetical list of titles set small in newspaper
// columns, the way a shareware catalog printed its back pages: a big letter over each run of
// titles, then each title in bold with who made it and the year. A marked title (on the
// Game-Maker CD) gets a check, with words for screen readers saying what the check means.
import './shelf.css';
import { h } from '../../editor/core/ui';
import type { Block, ShelfItem } from './types';

type ShelfBlock = Extract<Block, { t: 'shelf' }>;

/** The letter a title files under: A to Z, or # for a number. */
export const shelfLetter = (title: string) => {
  const c = title
    .replace(/^(?:the|a)\s+/i, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .normalize('NFKD')
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

function item(it: ShelfItem, markText: string): HTMLElement {
  const by = [it.by, it.year].filter(Boolean).join(', ');
  return h(
    'li',
    null,
    h('b', null, it.title),
    by ? h('span', { class: 'mag-shelf-by' }, ` ${by}`) : null,
    it.mark ? h('span', { class: 'mag-shelf-mark' }, h('span', { 'aria-hidden': 'true' }, ' ✓'), h('span', { class: 'sr-only' }, ` (${markText})`)) : null,
  );
}

export function shelfList(b: ShelfBlock): HTMLElement {
  const groups: [string, ShelfItem[]][] = [];
  for (const it of b.items) {
    const l = shelfLetter(it.title);
    if (groups.at(-1)?.[0] !== l) groups.push([l, []]);
    groups.at(-1)![1].push(it);
  }
  return h(
    'div',
    { class: 'mag-shelf' },
    ...groups.map(([letter, items]) =>
      h('section', { class: 'mag-shelf-group' }, h('h3', null, letter), h('ul', null, ...items.map((it) => item(it, b.markText)))),
    ),
  );
}
