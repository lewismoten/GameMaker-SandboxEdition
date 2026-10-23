// Shared parts of the terrain and building setup dialogs: a slot to drop a block into, and a small live preview.
import { h } from '../../../core/ui';
import { blockCanvas } from '../../../core/draw';
import { chooseBlock } from '../../../widgets/blockChooser';
import { BLEN, type Block } from '../../../../formats/blocks';
import type { Palette } from '../../../../formats/palette';
import { E, N, NE, NW, S, SE, SW, W } from './autotile';

export interface SetupCtx {
  blocks: Block[];
  palette: Palette;
  imgs: HTMLCanvasElement[];
}

const EMPTY = { value: -1, label: 'Empty', icon: '∅' };

/** A little 3×3 drawing of which neighbors a slot stands for (filled squares are the terrain). */
export function maskDiagram(mask: number): HTMLCanvasElement {
  const c = h('canvas', { width: 15, height: 15, class: 'mt-diagram', 'aria-hidden': 'true' });
  const g = c.getContext('2d')!;
  const cells = [NW, N, NE, W, 0, E, SW, S, SE];
  cells.forEach((bit, i) => {
    g.fillStyle = bit === 0 || mask & bit ? '#5fbf4a' : '#5a4630';
    g.fillRect((i % 3) * 5, Math.floor(i / 3) * 5, 5, 5);
  });
  return c;
}

/** A button for one slot: its block, or its diagram while empty; a click chooses the block. */
export function slotButton(ctx: SetupCtx, label: string, mask: number | undefined, get: () => number, set: (v: number) => void): HTMLButtonElement {
  const btn = h('button', { type: 'button', class: 'mt-slot' });
  const render = () => {
    const v = get();
    const b = ctx.blocks[v];
    btn.classList.toggle('empty', !b);
    btn.setAttribute('aria-label', `${label}: ${b ? `block ${v}` : 'empty'}`);
    btn.title = `${label} (${b ? `block ${v}` : 'empty'}): click to choose`;
    btn.replaceChildren(b ? blockCanvas(b.pixels, ctx.palette) : mask !== undefined ? maskDiagram(mask) : h('span', { class: 'mt-none' }, '∅'));
  };
  btn.addEventListener('click', async () => {
    const v = await chooseBlock(label, ctx.blocks, ctx.palette, get(), [EMPTY], false);
    if (v === undefined) return;
    set(v);
    render();
  });
  render();
  (btn as HTMLButtonElement & { refresh?: () => void }).refresh = render;
  return btn;
}

/** Redraws a slot button made by slotButton (after its value changed elsewhere). */
export function refreshSlot(btn: HTMLElement): void {
  (btn as HTMLElement & { refresh?: () => void }).refresh?.();
}

/** Draws rows of blocks (-1: the `ground` block) into a canvas at `px` pixels a block. */
export function drawPreview(c: HTMLCanvasElement, ctx: SetupCtx, rows: number[][], ground: number, px = 16): void {
  const w = rows[0]?.length ?? 0;
  c.width = w * px;
  c.height = rows.length * px;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  rows.forEach((row, y) =>
    row.forEach((v, x) => {
      const img = ctx.imgs[v >= 0 ? v : ground];
      if (img) g.drawImage(img, x * px, y * px, px, px);
    }),
  );
}

export const PREVIEW_BLOCK = BLEN;
