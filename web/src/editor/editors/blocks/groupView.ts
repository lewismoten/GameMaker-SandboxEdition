// A block group (blockGroups.ts) assembled: one button per cell showing its block, the block
// being edited outlined and marked current, and a click (or Enter) on another cell jumps to it.
// With the editing callbacks, a click on the current cell swaps in another block, a small × takes
// a block out of the group, and an empty cell is a button that fills it.
// Used by the block editor and the character editor.
import { h, clear } from '../../core/ui';
import { blockCanvas } from '../../core/draw';
import type { Palette } from '../../../formats/palette';
import type { BlockGroup } from './blockGroups';
import './groupView.css';

interface GroupView {
  el: HTMLElement;
  /** Shows the group around `current` (or hides itself with no group). */
  show(g: BlockGroup | undefined, current: number): void;
  /** Paints the cells again (after a paint). */
  redraw(): void;
}

export function groupView(o: {
  blocks: () => { pixels: Uint8Array }[];
  pal: () => Palette;
  transparent: boolean;
  onPick: (block: number) => void;
  /** Choose a block for the empty cell at this index. */
  onFill?: (cell: number) => void;
  /** Choose another block for the current block's cell. */
  onReplace?: (cell: number) => void;
  /** Take the block at this cell out of the group. */
  onRemove?: (cell: number) => void;
}): GroupView {
  const grid = h('div', { class: 'group-view', role: 'group' });
  let group: BlockGroup | undefined;
  let current = -1;

  function redraw(): void {
    const g = group;
    grid.hidden = !g;
    if (!g) return;
    grid.setAttribute('aria-label', `${g.name}, ${g.cols} by ${g.rows} blocks`);
    grid.style.gridTemplateColumns = `repeat(${g.cols}, var(--group-cell, 48px))`;
    clear(
      grid,
      ...g.cells.map((b, i) => {
        const where = `column ${(i % g.cols) + 1}, row ${Math.floor(i / g.cols) + 1}`;
        if (b < 0)
          return o.onFill
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'group-view-empty',
                  title: `Empty (${where}): choose a block for it`,
                  'aria-label': `Empty, ${where}: choose a block`,
                  onclick: () => o.onFill!(i),
                },
                h('span', { 'aria-hidden': 'true' }, '+'),
              )
            : h('span', { class: 'group-view-empty', title: `Empty (${where})` });
        const px = o.blocks()[b]?.pixels;
        const isCurrent = b === current;
        const cell = h(
          'button',
          {
            type: 'button',
            class: isCurrent ? 'current' : '',
            'aria-current': isCurrent ? 'true' : undefined,
            title: isCurrent
              ? o.onReplace
                ? `Block ${b}: editing it (${where}). Click to put a different block here`
                : `Block ${b}: editing it (${where})`
              : `Edit block ${b} (${where})`,
            'aria-label': isCurrent && o.onReplace ? `Block ${b}, ${where}: choose a different block for this spot` : `Block ${b}, ${where}`,
            onclick: () => (isCurrent ? o.onReplace?.(i) : o.onPick(b)),
          },
          px ? blockCanvas(px, o.pal(), { transparent: o.transparent, className: o.transparent ? 'checker' : '' }) : null,
        );
        if (!o.onRemove) return cell;
        const remove = h(
          'button',
          {
            type: 'button',
            class: 'group-view-remove',
            title: `Take block ${b} out of the group (${where})`,
            'aria-label': `Take block ${b} out of the group, ${where}`,
            onclick: () => o.onRemove!(i),
          },
          h('span', { 'aria-hidden': 'true' }, '×'),
        );
        return h('span', { class: `group-view-cell${isCurrent ? ' current' : ''}` }, cell, remove);
      }),
    );
  }

  return {
    el: grid,
    show(g, c) {
      group = g;
      current = c;
      redraw();
    },
    redraw,
  };
}
