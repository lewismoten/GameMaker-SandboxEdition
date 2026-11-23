// The side panel that lists a block set's terrains, stamps or buildings to paint with, with New, Edit and Delete.
import { h, clear, confirmDialog } from '../../../core/ui';
import { rovingGrid } from '../../../widgets/rovingGrid';
import type { BrushKind } from './brushStore';

interface BrushItem {
  id: string;
  name: string;
}

interface BrushPanelOpts<T extends BrushItem> {
  kind: BrushKind;
  blockSet: string;
  sceneCount: number;
  items: T[];
  selected?: string;
  thumb: (item: T) => HTMLCanvasElement;
  onSelect: (item: T) => void;
  onNew?: () => void;
  onEdit?: (item: T) => void;
  onDelete: (item: T) => void;
  /** Shown when there are none yet. */
  empty: string;
}

const NOUN: Record<BrushKind, string> = { terrains: 'terrain', stamps: 'stamp', buildings: 'building' };

/** Fills `host` with the list and its buttons. */
export function renderBrushPanel<T extends BrushItem>(host: HTMLElement, o: BrushPanelOpts<T>): void {
  const noun = NOUN[o.kind];
  const owner = `${o.blockSet.toUpperCase()} · assigned in ${o.sceneCount} ${o.sceneCount === 1 ? 'scene' : 'scenes'}`;
  const list = rovingGrid(h('div', { class: 'block-picker mt-brushes' }), `${noun[0].toUpperCase()}${noun.slice(1)}s to paint with`);
  for (const it of o.items)
    list.append(
      h(
        'button',
        { type: 'button', class: it.id === o.selected ? 'selected' : '', title: it.name, 'aria-label': it.name, onclick: () => o.onSelect(it) },
        o.thumb(it),
        h('small', null, it.name),
      ),
    );
  const current = o.items.find((it) => it.id === o.selected);
  clear(
    host,
    o.items.length ? h('p', { class: 'meta' }, owner) : null,
    o.items.length ? list : h('p', { class: 'meta' }, o.empty),
    h(
      'div',
      { class: 'toolbar mt-brush-actions' },
      o.onNew ? h('button', { type: 'button', onclick: o.onNew }, `＋ New ${noun}`) : null,
      current && o.onEdit ? h('button', { type: 'button', onclick: () => o.onEdit!(current), 'aria-label': `Edit ${current.name}` }, '✎ Edit') : null,
      current
        ? h(
            'button',
            {
              type: 'button',
              class: 'danger',
              'aria-label': `Delete ${current.name}`,
              onclick: async () => {
                if (
                  await confirmDialog(
                    `Delete ${noun}`,
                    `Delete the ${noun} “${current.name}”? This removes the brush from every map using ${o.blockSet.toUpperCase()}. Maps keep the blocks already painted.`,
                    'Delete',
                  )
                )
                  o.onDelete(current);
              },
            },
            '🗑 Delete',
          )
        : null,
    ),
  );
}
