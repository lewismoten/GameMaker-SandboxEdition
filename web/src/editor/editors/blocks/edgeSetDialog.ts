// The "Make an edge set" dialog: pick the ground round the block being painted, how deep and
// wavy the border is and where the 12 new blocks go, with a live 4 x 4 preview of the set.
import { h, modal } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { BLEN, type Block } from '../../../formats/blocks';
import type { Palette } from '../../../formats/palette';
import { shade } from '../palette/ramps';
import { EDGE_SLOTS, freeRun, makeEdgeSet, type EdgeOptions } from './edgeSet';

interface EdgeSetChoice {
  /** Where the first of the 12 blocks goes. */
  at: number;
  pictures: Uint8Array[];
}

/** The preview's layout: the 3x3 set with the fill in the middle, and the 4 inner corners beside it. */
const LAYOUT: [slot: number | 'fill', x: number, y: number][] = [
  [0, 0, 0],
  [1, 1, 0],
  [2, 2, 0],
  [3, 0, 1],
  ['fill', 1, 1],
  [4, 2, 1],
  [5, 0, 2],
  [6, 1, 2],
  [7, 2, 2],
  [8, 4, 0],
  [9, 5, 0],
  [10, 4, 1],
  [11, 5, 1],
];

export function edgeSetDialog(blocks: Block[], current: number, pal: Palette): Promise<EdgeSetChoice | undefined> {
  return modal<EdgeSetChoice>('Make an edge set', (close) => {
    const num = (label: string, value: number, min: number, max: number, title?: string) =>
      h('input', { type: 'number', min, max, value: String(value), required: true, 'aria-label': label, title });
    const outside = num('Ground round it (block)', current === 0 ? 1 : 0, 0, blocks.length - 1);
    const depth = num('Border depth (pixels)', 4, 1, 9);
    const start = freeRun(blocks);
    const at = num('First new block', start < 0 ? Math.max(0, blocks.length - EDGE_SLOTS.length) : start, 0, blocks.length - EDGE_SLOTS.length);
    const wavy = h('input', { type: 'checkbox', checked: true });
    const outline = h('input', { type: 'checkbox', checked: true });
    const canvas = h('canvas', {
      class: 'pixel edge-preview',
      role: 'img',
      'aria-label': 'The new edge set around the fill block, and its four inner corners',
    });
    const note = h('p', { class: 'meta', 'aria-live': 'polite' });
    const read = (i: HTMLInputElement, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(i.value) || 0)));
    const options = (): EdgeOptions => ({ depth: read(depth, 1, 9), wavy: wavy.checked, outline: outline.checked ? (c) => shade(pal, c, -1) : undefined });
    const pictures = () => makeEdgeSet(blocks[current].pixels, blocks[read(outside, 0, blocks.length - 1)].pixels, options());
    const draw = () => {
      const pics = pictures();
      const W = 6 * BLEN;
      const px = new Uint8Array(W * 3 * BLEN);
      for (const [slot, bx, by] of LAYOUT) {
        const src = slot === 'fill' ? blocks[current].pixels : pics[slot];
        for (let y = 0; y < BLEN; y++) px.set(src.subarray(y * BLEN, y * BLEN + BLEN), (by * BLEN + y) * W + bx * BLEN);
      }
      paintIndexed(canvas, px, W, 3 * BLEN, pal);
      // the cells no block fills stay empty
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(3 * BLEN, 0, BLEN, 3 * BLEN);
      ctx.clearRect(4 * BLEN, 2 * BLEN, 2 * BLEN, BLEN);
      const a = read(at, 0, blocks.length - EDGE_SLOTS.length);
      const busy = blocks.slice(a, a + EDGE_SLOTS.length).filter((b) => !b.pixels.every((v) => v === b.pixels[0])).length;
      note.textContent = `Blocks ${a} to ${a + EDGE_SLOTS.length - 1} get the new pictures${busy ? `; ${busy} of them already have a picture, which is replaced (Undo on each block brings it back)` : ''}. Only the pictures change, not how the blocks behave.`;
    };
    for (const el of [outside, depth, at, wavy, outline]) el.addEventListener('input', draw);
    requestAnimationFrame(draw);
    const field = (label: string, input: HTMLInputElement) => h('label', { class: 'field' }, h('span', null, label), input);
    const check = (label: string, input: HTMLInputElement) => h('label', { class: 'check recolor-check' }, input, h('span', null, label));
    return h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (![outside, depth, at].every((i) => i.reportValidity())) return;
          close({ at: read(at, 0, blocks.length - EDGE_SLOTS.length), pictures: pictures() });
        },
      },
      h(
        'p',
        { class: 'meta' },
        `Block ${current} is the fill. The 8 edges and corners and the 4 inner corners are painted from it and the ground round it, in the order the map’s terrain brush expects.`,
      ),
      h('div', { class: 'grid-fields' }, field('Ground round it (block)', outside), field('Border depth (pixels)', depth), field('First new block', at)),
      check('Wavy border', wavy),
      check('Darker outline (one step down the fill’s ramp)', outline),
      canvas,
      note,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Make the blocks'),
      ),
    );
  });
}
