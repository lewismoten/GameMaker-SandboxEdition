// Choosing a block by its picture: a button showing the current block that opens a grid
// of every block in the set (plus any special choices, like "none").
import { h, modal } from '../core/ui';
import { blockCanvas } from '../core/draw';
import type { Palette } from '../../formats/palette';
import type { Block } from '../../formats/blocks';

export interface BlockExtra {
  value: number;
  label: string;
  icon: string;
}

/** Opens the grid; resolves with the chosen block number (or an extra's value). */
export function chooseBlock(title: string, blocks: Block[], pal: Palette, current: number, extras: BlockExtra[] = [], transparent = true, only?: (b: Block, i: number) => boolean): Promise<number | undefined> {
  return modal<number>(title, (close) =>
    h(
      'div',
      { class: 'block-chooser' },
      ...extras.map((x) => h('button', { class: x.value === current ? 'selected' : '', title: x.label, onclick: () => close(x.value) }, h('span', { class: 'extra' }, x.icon), h('small', null, x.label))),
      ...blocks.map((b, i) =>
        only && !only(b, i) ? null : h('button', { class: i === current ? 'selected' : '', title: `Block ${i}`, onclick: () => close(i) }, blockCanvas(b.pixels, pal, { transparent, className: 'checker' }), h('small', null, i)),
      ),
    ),
  );
}

/** A button showing the chosen block; clicking it opens the grid. */
export function blockButton(blocks: () => Block[], pal: () => Palette, get: () => number, set: (n: number) => void, opts: { title?: string; extras?: BlockExtra[]; transparent?: boolean; only?: (b: Block, i: number) => boolean } = {}): HTMLButtonElement {
  const btn = h('button', { class: 'block-button', title: opts.title ?? 'Choose a block' });
  const render = () => {
    const n = get();
    const extra = opts.extras?.find((x) => x.value === n);
    const b = blocks()[n];
    btn.replaceChildren(extra ? h('span', { class: 'extra' }, extra.icon) : b ? blockCanvas(b.pixels, pal(), { transparent: true, className: 'checker' }) : h('span', { class: 'extra' }, '∅'), h('small', null, extra ? extra.label : b ? n : 'none'));
  };
  btn.addEventListener('click', async () => {
    const n = await chooseBlock(opts.title ?? 'Choose a block', blocks(), pal(), get(), opts.extras, opts.transparent ?? true, opts.only);
    if (n === undefined) return;
    set(n);
    render();
  });
  render();
  return btn;
}
