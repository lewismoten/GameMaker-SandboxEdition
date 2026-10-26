// The block groups' dialogs: naming a new group and choosing its layout (cols x rows), and
// choosing among the groups the game's files suggest (each shown assembled, none added until
// ticked and confirmed).
import { h, modal } from '../../core/ui';
import { blockCanvas } from '../../core/draw';
import type { Palette } from '../../../formats/palette';
import { MAX_SIDE, type BlockGroup } from './blockGroups';
import type { Suggestion } from './groupGuess';

/** Name and layout for a new group; `blocksFor` says which blocks a layout would take. */
export function newGroupDialog(o: {
  title: string;
  name: string;
  cols: number;
  rows: number;
  blocksFor: (cols: number, rows: number) => string;
}): Promise<{ name: string; cols: number; rows: number } | undefined> {
  return modal(o.title, (close) => {
    const name = h('input', { type: 'text', value: o.name, maxlength: 40, required: true });
    const num = (v: number) => h('input', { type: 'number', min: 1, max: MAX_SIDE, value: String(v), required: true });
    const cols = num(o.cols);
    const rows = num(o.rows);
    const which = h('p', { class: 'meta', 'aria-live': 'polite' });
    const show = () => (which.textContent = o.blocksFor(Math.round(Number(cols.value)) || 1, Math.round(Number(rows.value)) || 1));
    cols.addEventListener('input', show);
    rows.addEventListener('input', show);
    show();
    return h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (![name, cols, rows].every((i) => i.reportValidity())) return;
          close({ name: name.value.trim() || 'Group', cols: Math.round(Number(cols.value)), rows: Math.round(Number(rows.value)) });
        },
      },
      h('label', { class: 'field' }, h('span', null, 'Name (a sign, a mirror, the bus…)'), name),
      h(
        'div',
        { class: 'grid-fields' },
        h('label', { class: 'field' }, h('span', null, 'Blocks across'), cols),
        h('label', { class: 'field' }, h('span', null, 'Blocks down'), rows),
      ),
      which,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Make the group'),
      ),
    );
  });
}

/** A small picture of a group, its blocks touching. */
function miniGroup(g: BlockGroup, blocks: { pixels: Uint8Array }[], pal: Palette, transparent: boolean): HTMLElement {
  return h(
    'span',
    { class: 'group-mini', style: `grid-template-columns:repeat(${g.cols}, 24px)`, 'aria-hidden': 'true' },
    ...g.cells.map((b) => (b >= 0 && blocks[b] ? blockCanvas(blocks[b].pixels, pal, { transparent, className: transparent ? 'checker' : '' }) : h('span'))),
  );
}

/** The suggestions to choose from; resolves with the ticked ones. */
export function suggestDialog(o: {
  suggestions: Suggestion[];
  blocks: { pixels: Uint8Array }[];
  pal: Palette;
  transparent: boolean;
  from: string;
}): Promise<BlockGroup[] | undefined> {
  return modal('Suggested groups', (close) => {
    const boxes = o.suggestions.map(() => h('input', { type: 'checkbox' }));
    const all = h('input', { type: 'checkbox' });
    all.addEventListener('change', () => boxes.forEach((b) => (b.checked = all.checked)));
    if (!o.suggestions.length)
      return h(
        'div',
        null,
        h('p', null, `Nothing to suggest: ${o.from}`),
        h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'primary', onclick: () => close(undefined) }, 'OK')),
      );
    return h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close(o.suggestions.filter((_, i) => boxes[i].checked).map((s) => s.group));
        },
      },
      h('p', { class: 'meta' }, `Guessed from ${o.from}. Tick the ones that are one picture; nothing is added until you do.`),
      h('label', { class: 'check recolor-check' }, all, h('span', null, 'All of them')),
      h(
        'ul',
        { class: 'group-suggest-list' },
        ...o.suggestions.map((s, i) =>
          h(
            'li',
            null,
            h(
              'label',
              { class: 'check recolor-check' },
              boxes[i],
              miniGroup(s.group, o.blocks, o.pal, o.transparent),
              h('span', null, h('strong', null, s.group.name), ` (${s.group.cols} × ${s.group.rows}): ${s.why}`),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Add the ticked groups'),
      ),
    );
  });
}
