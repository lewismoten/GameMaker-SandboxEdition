// The block painter's "Replace colors" dialog: one color (or a run of them, such as a whole
// ramp) becomes another, in this block or every block of the set; or two runs trade places.
import { h, modal } from '../../core/ui';
import { paletteCss, type Palette } from '../../../formats/palette';
import { moveRange, swapRange } from './pixelOps';

export interface Recolor {
  from: number;
  to: number;
  count: number;
  swap: boolean;
  everyBlock: boolean;
}

/** Applies a recolor to one block's pixels. */
export function applyRecolor(px: Uint8Array, r: Recolor): Uint8Array {
  return r.swap ? swapRange(px, r.from, r.to, r.count) : moveRange(px, r.from, r.to, r.count);
}

export function recolorDialog(pal: Palette, from: number, to: number): Promise<Recolor | undefined> {
  return modal<Recolor>('Replace colors', (close) => {
    const num = (label: string, value: number, max = 255, min = 0) => {
      const input = h('input', { type: 'number', min, max, value: String(value), required: true }) as HTMLInputElement;
      const chip = h('span', { class: 'recolor-chip', 'aria-hidden': 'true' });
      const show = () => (chip.style.background = paletteCss(pal, Math.max(0, Math.min(255, Number(input.value) || 0))));
      input.addEventListener('input', show);
      show();
      return { input, el: h('label', { class: 'field' }, h('span', null, label), h('span', { class: 'row', style: 'gap:6px;align-items:center;flex-wrap:nowrap' }, input, max === 255 ? chip : null)) };
    };
    const f = num('Color', from);
    const t = num('becomes color', to);
    const n = num('How many colors in a row (a ramp)', 1, 256, 1);
    const swap = h('input', { type: 'checkbox' }) as HTMLInputElement;
    const every = h('input', { type: 'checkbox' }) as HTMLInputElement;
    return h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          const v = (i: HTMLInputElement) => Math.round(Number(i.value));
          if (![f.input, t.input, n.input].every((i) => i.reportValidity())) return;
          close({ from: v(f.input), to: v(t.input), count: v(n.input), swap: swap.checked, everyBlock: every.checked });
        },
      },
      h('p', { class: 'meta' }, 'With more than one color, each shade goes to the matching shade of the other run: a whole ramp recolored at once.'),
      h('div', { class: 'grid-fields' }, f.el, t.el, n.el),
      h('label', { class: 'check' }, swap, h('span', null, 'Swap: the second colors become the first, too')),
      h('label', { class: 'check' }, every, h('span', null, 'In every block of this set (not just this one)')),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), h('button', { type: 'submit', class: 'primary' }, 'Replace')),
    );
  });
}
