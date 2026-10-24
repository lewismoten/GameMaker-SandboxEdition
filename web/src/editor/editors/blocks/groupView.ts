// A block group (blockGroups.ts) assembled: one button per cell showing its block, the block
// being edited outlined and marked current, and a click (or Enter) on another cell jumps to it.
// Used by the block editor and the character editor.
import { h, clear } from '../../core/ui';
import { blockCanvas } from '../../core/draw';
import type { Palette } from '../../../formats/palette';
import type { BlockGroup } from './blockGroups';
import './groupView.css';

export interface GroupView {
  el: HTMLElement;
  /** Shows the group around `current` (or hides itself with no group). */
  show(g: BlockGroup | undefined, current: number): void;
  /** Paints the cells again (after a paint). */
  redraw(): void;
}

export function groupView(o: { blocks: () => { pixels: Uint8Array }[]; pal: () => Palette; transparent: boolean; onPick: (block: number) => void }): GroupView {
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
        if (b < 0) return h('span', { class: 'group-view-empty', title: `Empty (${where})` });
        const px = o.blocks()[b]?.pixels;
        return h(
          'button',
          {
            type: 'button',
            class: b === current ? 'current' : '',
            'aria-current': b === current ? 'true' : undefined,
            title: b === current ? `Block ${b}: editing it (${where})` : `Edit block ${b} (${where})`,
            'aria-label': `Block ${b}, ${where}`,
            onclick: () => b !== current && o.onPick(b),
          },
          px ? blockCanvas(px, o.pal(), { transparent: o.transparent, className: o.transparent ? 'checker' : '' }) : null,
        );
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
