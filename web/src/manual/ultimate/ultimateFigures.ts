// The figures of The Ultimate Owner's Guide: the palette figures drawn from the games' real
// files (paletteFigures.ts) and two small diagrams. Each is a <figure> with a text
// alternative; a figure whose files are missing is left out.
import { h } from '../../editor/core/ui';
import { PALETTE_FIGURES } from './paletteFigures';

/** A row of labeled boxes joined by arrows, read out as one sentence. */
function flow(label: string, steps: (string | [string, string])[]): HTMLElement {
  return h(
    'div',
    { class: 'ug-flow', role: 'img', 'aria-label': label },
    ...steps.map((s) =>
      typeof s === 'string' ? h('span', { class: 'ug-arrow' }, s) : h('span', { class: 'ug-box' }, h('b', null, s[0]), h('small', null, s[1])),
    ),
  );
}

/** Figure 2-1: a reward that becomes something else, and a timed chain. */
function chain(): HTMLElement {
  return h(
    'figure',
    { class: 'ug-chain' },
    flow('A coin worth 10 points becomes an empty floor block when touched.', [['Coin', '+10 points'], 'touched →', ['Floor', 'stays floor']]),
    flow('A bridge block changes after 540 ticks into a cracked bridge, which after 18 more ticks becomes a gap that stays a gap.', [
      ['Bridge', 'solid on top'],
      '540 ticks →',
      ['Cracked', 'solid on top'],
      '18 ticks →',
      ['Gap', 'stays a gap'],
    ]),
    h(
      'figcaption',
      null,
      'Figure 2-1. Top: a reward that becomes plain floor. Bottom: a level clock. Thirty seconds into the scene every bridge on the map cracks, and a second later every one is gone.',
    ),
  );
}

/** Figure 5-1: the walk-off between a gate's voice line and the exit. */
function walkoff(): HTMLElement {
  const cells = ['hero', 'gate', ...Array.from({ length: 8 }, () => 'floor'), 'link'];
  return h(
    'figure',
    { class: 'ug-walkoff' },
    h(
      'div',
      {
        class: 'ug-strip',
        role: 'img',
        'aria-label': 'A row of blocks: the hero, a gate that plays a voice line when it opens, eight blocks of plain floor, then the link to the next scene.',
      },
      ...cells.map((c) => h('span', { class: `ug-cell-${c}` }, c === 'hero' ? '☺' : c === 'gate' ? '▤' : c === 'link' ? '⇨' : '')),
    ),
    h(
      'div',
      { class: 'ug-strip-labels', 'aria-hidden': 'true' },
      h('span', null, 'gate: the line starts'),
      h('span', null, 'walk-off: it plays out'),
      h('span', null, 'link'),
    ),
    h('figcaption', null, 'Figure 5-1. A walk-off. At a walking pace each block buys a fraction of a second; leave enough of them for the longest line.'),
  );
}

const FIGURES: Record<string, () => Promise<HTMLElement | undefined> | HTMLElement> = { ...PALETTE_FIGURES, chain, walkoff };

/** Replaces each `<figure data-fig>` in a chapter with its figure (or removes it). */
export async function fillFigures(root: HTMLElement): Promise<void> {
  await Promise.all(
    [...root.querySelectorAll<HTMLElement>('figure[data-fig]')].map(async (slot) => {
      const make = FIGURES[slot.dataset.fig ?? ''];
      const fig = make ? await Promise.resolve(make()).catch(() => undefined) : undefined;
      if (fig) slot.replaceWith(fig);
      else slot.remove();
    }),
  );
  await Promise.all([...root.querySelectorAll('img')].map((i) => i.decode().catch(() => undefined)));
}
