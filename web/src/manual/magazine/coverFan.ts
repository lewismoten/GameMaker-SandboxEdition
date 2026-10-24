// A `covers` block (types.ts): TURBO BUTTON covers drawn small and fanned out like a stack of
// back issues on a coffee table, each with the masthead, its issue line and its big cover
// line. One picture to a screen reader, named by the block's `alt`.
import './coverFan.css';
import { h } from '../../editor/core/ui';
import { MAG } from './masthead';
import type { Block } from './types';

type CoversBlock = Extract<Block, { t: 'covers' }>;

export function coverFan(b: CoversBlock): HTMLElement {
  const n = b.covers.length;
  return h(
    'div',
    { class: 'mag-fan', role: 'img', 'aria-label': b.alt },
    ...b.covers.map((c, i) =>
      h(
        'div',
        { class: `mag-mini tone-${c.tone}`, 'aria-hidden': 'true', style: `--turn:${((i - (n - 1) / 2) * 5).toFixed(1)}deg` },
        h('span', { class: 'mag-mini-mast' }, MAG.name),
        h('span', { class: 'mag-mini-issue' }, c.issue),
        h('span', { class: 'mag-mini-line' }, c.line),
        h('span', { class: 'mag-mini-shots' }, h('i'), h('i'), h('i')),
      ),
    ),
  );
}
