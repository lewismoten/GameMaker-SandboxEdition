// A `callouts` block (types.ts): a picture with numbered spots on it, the way a 1995 ad toured
// a product, and the key to the numbers below it in two columns. The spots are only
// decoration (aria-hidden); the key is an ordered list in the same order, so it reads alike.
import './callouts.css';
import { h } from '../../editor/core/ui';
import { artElement } from './art';
import type { Block } from './types';

type CalloutsBlock = Extract<Block, { t: 'callouts' }>;

/** The figure: the picture with its spots, then the key; `text` draws a spot's inline words. */
export function calloutsFigure(b: CalloutsBlock, text: (s: string) => Node[]): HTMLElement {
  return h(
    'figure',
    { class: 'mag-callouts' },
    h(
      'div',
      { class: 'mag-callouts-pic' },
      artElement(b.art, b.alt),
      ...b.spots.map((s, i) => h('span', { class: 'mag-spot', 'aria-hidden': 'true', style: `left:${s.x}%;top:${s.y}%` }, String(i + 1))),
    ),
    h('ol', { class: 'mag-callouts-key' }, ...b.spots.map((s) => h('li', null, h('b', null, `${s.title}. `), ...text(s.text)))),
  );
}
