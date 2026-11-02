// "Becomes block" fields: the block number with a live picture of that block. Clicking the picture
// opens a dialog of every non-empty block (plus "None") to pick from. Editor-only; the saved value
// is still the block number (a block's own number means "no change", as in DOS Game-Maker).
import { h, modal, numberField } from '../../core/ui';
import { blockCanvas, paintBlock } from '../../core/draw';
import { isBlankBlock } from '../picture/pictureLogic';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

interface Opts {
  label: string;
  title: string;
  blocks: { pixels: Uint8Array }[];
  pal: () => Palette;
  sprites: boolean;
  /** The block being edited: choosing its own number means "none". */
  self: number;
  get: () => number;
  set: (v: number) => void;
}

/** The choices shown in the dialog: every block that has something drawn on it. */
export function pickableBlocks(blocks: { pixels: Uint8Array }[], sprites: boolean): number[] {
  return blocks.flatMap((b, i) => (isBlankBlock(b.pixels, sprites) ? [] : [i]));
}

function pickBlock(o: Opts): Promise<number | undefined> {
  const pal = o.pal();
  return modal<number>(o.label, (close) => {
    const cell = (value: number, content: Node, text: string, caption: string) =>
      h(
        'button',
        { type: 'button', class: 'block-choice', title: text, 'aria-label': text, 'aria-pressed': String(value === o.get()), onclick: () => close(value) },
        content,
        h('small', null, caption),
      );
    const none = cell(o.self, h('span', { class: 'block-none', 'aria-hidden': 'true' }, '∅'), `None (stays block ${o.self})`, 'None');
    const items = pickableBlocks(o.blocks, o.sprites).map((i) =>
      cell(i, blockCanvas(o.blocks[i].pixels, pal, { transparent: o.sprites, className: 'block-choice-pic' }), `Block ${i}`, String(i)),
    );
    return h(
      'div',
      null,
      h('div', { class: 'block-choices' }, none, ...items),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
}

export function blockChoiceField(o: Opts): HTMLElement {
  const number = numberField(o.label, o.get, o.set, { min: 0, max: 255, title: o.title });
  const input = number.querySelector('input')!;
  const preview = h('button', { type: 'button', class: 'block-preview' });
  // one canvas and one label, repainted in place: replacing them while the pointer is down (typing a
  // number, then clicking the picture) would lose the click
  const pic = blockCanvas(new Uint8Array(256), o.pal(), { transparent: o.sprites, className: 'block-preview-pic' });
  const none = h('span', { class: 'block-none' });
  preview.append(pic, none);
  const refresh = () => {
    const v = Math.max(0, Math.min(255, Math.round(Number(input.value) || 0)));
    const isNone = v === o.self;
    const block = o.blocks[v];
    const showPic = !isNone && !!block;
    if (showPic) paintBlock(pic, block.pixels, o.pal(), { transparent: o.sprites });
    pic.hidden = !showPic;
    none.hidden = showPic;
    none.textContent = isNone ? '∅ None' : '∅ No block';
    const name = isNone ? 'none, stays the same' : `block ${v}`;
    preview.title = `${o.label}: ${name}. Click to choose from the blocks.`;
    preview.setAttribute('aria-label', preview.title);
  };
  input.addEventListener('input', refresh);
  input.addEventListener('change', refresh);
  preview.addEventListener('click', async () => {
    const v = await pickBlock({ ...o, get: () => Math.round(Number(input.value) || 0) });
    if (v === undefined) return;
    input.value = String(v);
    o.set(v);
    refresh();
  });
  refresh();
  return h('div', { class: 'block-choice-field' }, number, preview);
}
