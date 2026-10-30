// Choosing a block by its picture: a button showing the current block that opens a grid
// of every block in the set (plus any special choices, like "none").
import { h, modal } from '../core/ui';
import { blockCanvas } from '../core/draw';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import './blockChooser.css';

const caption = (index: number, name: string) =>
  h('small', { class: name === `Block ${index}` ? undefined : 'block-choice-label' }, name === `Block ${index}` ? index : name);

export interface BlockExtra {
  value: number;
  label: string;
  icon: string;
}

/** Opens the grid; resolves with the chosen block number (or an extra's value). */
export function chooseBlock(
  title: string,
  blocks: Block[],
  pal: Palette,
  current: number,
  extras: BlockExtra[] = [],
  transparent = true,
  only?: (b: Block, i: number) => boolean,
  name: (index: number) => string = (index) => `Block ${index}`,
): Promise<number | undefined> {
  return modal<number>(title, (close) =>
    h(
      'div',
      { class: 'block-chooser' },
      ...extras.map((x) =>
        h(
          'button',
          { class: x.value === current ? 'selected' : '', title: x.label, onclick: () => close(x.value) },
          h('span', { class: 'extra' }, x.icon),
          h('small', null, x.label),
        ),
      ),
      ...blocks.map((b, i) =>
        only && !only(b, i)
          ? null
          : h(
              'button',
              { class: i === current ? 'selected' : '', title: name(i), 'aria-label': name(i), onclick: () => close(i) },
              blockCanvas(b.pixels, pal, { transparent, className: 'checker' }),
              caption(i, name(i)),
            ),
      ),
    ),
  );
}

/** A button showing the chosen block; clicking it opens the grid. */
export function blockButton(
  blocks: () => Block[],
  pal: () => Palette,
  get: () => number,
  set: (n: number) => void,
  opts: { title?: string; extras?: BlockExtra[]; transparent?: boolean; only?: (b: Block, i: number) => boolean; name?: (index: number) => string } = {},
): HTMLButtonElement {
  const btn = h('button', { class: 'block-button', title: opts.title ?? 'Choose a block' });
  const render = () => {
    const n = get();
    const extra = opts.extras?.find((x) => x.value === n);
    const b = blocks()[n];
    const name = opts.name?.(n) ?? `Block ${n}`;
    if (opts.name) {
      btn.title = `${opts.title ?? 'Choose a block'}: ${extra?.label ?? name}`;
      btn.setAttribute('aria-label', btn.title);
    }
    btn.replaceChildren(
      extra
        ? h('span', { class: 'extra' }, extra.icon)
        : b
          ? blockCanvas(b.pixels, pal(), { transparent: true, className: 'checker' })
          : h('span', { class: 'extra' }, '∅'),
      extra ? h('small', null, extra.label) : b ? caption(n, name) : h('small', null, 'none'),
    );
  };
  btn.addEventListener('click', async () => {
    const n = await chooseBlock(opts.title ?? 'Choose a block', blocks(), pal(), get(), opts.extras, opts.transparent ?? true, opts.only, opts.name);
    if (n === undefined) return;
    set(n);
    render();
  });
  render();
  return btn;
}
