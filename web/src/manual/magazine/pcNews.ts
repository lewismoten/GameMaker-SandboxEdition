// A `pcnews` block (types.ts): a page of short news in columns, the way a 1993 PC magazine set
// one. A ruled header repeats an outlined banner; each item has an italic condensed headline and
// a huge light-blue drop cap; one item sits in a yellow box, and a pink box runs across all the
// columns with a real screenshot and its italic caption. Slots a, b, c are the top row, `wide` the
// pink box, d and e the bottom row (pcNews.css places them; on a phone they stack in order).
import './pcNews.css';
import { h } from '../../editor/core/ui';
import type { Block, Inline, PcNewsItem } from './types';

type PcNewsBlock = Extract<Block, { t: 'pcnews' }>;

export function pcNewsPage(b: PcNewsBlock, inline: (t: Inline) => Node[], shot: (s: NonNullable<PcNewsItem['shot']>) => HTMLElement): HTMLElement {
  const word = () => h('span', null, b.banner);
  const item = (it: PcNewsItem, i: number) => {
    const id = `pcn-${i}`;
    return h(
      'section',
      { class: `pcn-item slot-${it.slot}${it.tone ? ` tone-${it.tone}` : ''}`, 'aria-labelledby': id },
      h('h3', { id }, it.title),
      h(
        'div',
        { class: 'pcn-body' },
        it.shot ? shot(it.shot) : null,
        h('div', { class: 'pcn-text' }, ...it.body.map((t, k) => h('p', { class: k === 0 ? 'pcn-first' : undefined }, ...inline(t)))),
      ),
    );
  };
  return h(
    'div',
    { class: 'pcn' },
    h(
      'header',
      { class: 'pcn-top' },
      h('h2', { class: 'sr-only' }, b.banner),
      h('div', { class: 'pcn-ghost', 'aria-hidden': 'true' }, b.banner),
      h('div', { class: 'pcn-rule', 'aria-hidden': 'true' }, word(), word(), word()),
    ),
    h('div', { class: 'pcn-grid' }, ...b.items.map(item)),
  );
}
