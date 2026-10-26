// "Edit the group as one picture": the group's blocks joined into one canvas, where the pencil,
// fill, line and box paint straight across block edges. Apply hands back the whole picture
// (the block editor splits it into the blocks, each keeping an undo step); Cancel keeps nothing.
// Its own Undo and Redo work while it is open.
import { h, modal } from '../../core/ui';
import { lut } from '../../core/draw';
import { BLEN, TRANSPARENT } from '../../../formats/blocks';
import { paletteCss, type Palette } from '../../../formats/palette';
import { colorChoice } from '../../widgets/colorChoice';
import { joinGroup, type BlockGroup } from './blockGroups';
import type { Mirror } from './pixelOps';
import { box, floodFill, line, mirrorAll } from './surfaceOps';

type Tool = 'draw' | 'fill' | 'line' | 'rect' | 'pick';

export function groupPaintDialog(o: {
  group: BlockGroup;
  blocks: { pixels: Uint8Array }[];
  pal: Palette;
  sprites: boolean;
  color: number;
}): Promise<{ pixels: Uint8Array; color: number } | undefined> {
  const g = o.group;
  const W = g.cols * BLEN;
  const H = g.rows * BLEN;
  const erase = o.sprites ? TRANSPARENT : 0;
  const px = joinGroup(g, o.blocks, erase);
  // screen pixels per picture pixel: as big as fits a phone or a laptop's dialog
  const scale = Math.max(4, Math.floor(Math.min(640 / W, 420 / H, 16)));
  let color = o.color;
  let tool: Tool = 'draw';
  let mirror: Mirror = 'none';
  const undo: Uint8Array[] = [];
  const redo: Uint8Array[] = [];

  return modal(`Edit “${g.name}” as one picture`, (close) => {
    const canvas = h('canvas', {
      class: `pixel group-paint-canvas${o.sprites ? ' checker' : ''}`,
      width: W * scale,
      height: H * scale,
      role: 'img',
      'aria-label': `${g.name}: ${g.cols} by ${g.rows} blocks as one picture, ${W} by ${H} pixels. Drag to paint, right-drag to erase.`,
    });
    canvas.style.maxWidth = `${W * scale}px`;
    const ctx = canvas.getContext('2d')!;
    const undoBtn = h('button', { type: 'button', onclick: () => step(true) }, '↶ Undo');
    const redoBtn = h('button', { type: 'button', onclick: () => step(false) }, '↷ Redo');
    const chip = h('span', { class: 'recolor-chip', 'aria-hidden': 'true' });
    const choice = colorChoice({
      get: () => color,
      set: (i) => {
        color = i;
        refreshColor();
      },
      css: (i) => (o.sprites && i === TRANSPARENT ? 'transparent' : paletteCss(o.pal, i)),
      name: (i) => (o.sprites && i === TRANSPARENT ? '255: transparent' : `Color ${i}`),
    });
    function refreshColor(): void {
      chip.style.background = o.sprites && color === TRANSPARENT ? 'transparent' : paletteCss(o.pal, color);
      choice.refresh();
    }

    function render(view: Uint8Array = px): void {
      const l = lut(o.pal);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const v = view[y * W + x];
          if (o.sprites && v === TRANSPARENT) continue;
          const c = l[v];
          ctx.fillStyle = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      // the block edges, so you can see where each block ends
      ctx.strokeStyle = 'rgba(128,128,128,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 1; c < g.cols; c++) {
        ctx.moveTo(c * BLEN * scale + 0.5, 0);
        ctx.lineTo(c * BLEN * scale + 0.5, canvas.height);
      }
      for (let r = 1; r < g.rows; r++) {
        ctx.moveTo(0, r * BLEN * scale + 0.5);
        ctx.lineTo(canvas.width, r * BLEN * scale + 0.5);
      }
      ctx.stroke();
      undoBtn.disabled = !undo.length;
      redoBtn.disabled = !redo.length;
    }

    function step(back: boolean): void {
      const [from, to] = back ? [undo, redo] : [redo, undo];
      const snap = from.pop();
      if (!snap) return;
      to.push(px.slice());
      px.set(snap);
      render();
    }

    const plotInto = (out: Uint8Array, v: number) => (x: number, y: number) => {
      for (const [mx, my] of mirrorAll(x, y, W, H, mirror)) out[my * W + mx] = v;
    };
    const cell = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(W - 1, Math.floor(((e.clientX - r.left) / r.width) * W))),
        y: Math.max(0, Math.min(H - 1, Math.floor(((e.clientY - r.top) / r.height) * H))),
      };
    };
    let start: { x: number; y: number } | undefined;
    let before: Uint8Array | undefined;
    let last: { x: number; y: number } | undefined;
    const shape = (a: { x: number; y: number }, b: { x: number; y: number }, src: Uint8Array, v: number) => {
      const out = src.slice();
      (tool === 'rect' ? box : line)(a, b, plotInto(out, v));
      return out;
    };
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      const p = cell(e);
      if (tool === 'pick' || e.altKey) {
        color = px[p.y * W + p.x];
        refreshColor();
        return;
      }
      undo.push(px.slice());
      if (undo.length > 50) undo.shift();
      redo.length = 0;
      const v = e.button === 2 ? erase : color;
      if (tool === 'fill') {
        for (const [mx, my] of mirrorAll(p.x, p.y, W, H, mirror)) floodFill(px, W, H, mx, my, v);
      } else if (tool === 'line' || tool === 'rect') {
        start = p;
        before = px.slice();
      } else {
        plotInto(px, v)(p.x, p.y);
        last = p;
      }
      render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      const p = cell(e);
      const v = e.buttons === 2 ? erase : color;
      if (start && before) return render(shape(start, p, before, v));
      if (tool === 'draw' && last) {
        line(last, p, plotInto(px, v));
        last = p;
        render();
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (start && before) px.set(shape(start, cell(e), before, e.button === 2 ? erase : color));
      start = before = last = undefined;
      render();
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || !['z', 'y'].includes(e.key.toLowerCase())) return;
      e.preventDefault();
      step(e.key.toLowerCase() === 'z' && !e.shiftKey);
    });
    canvas.tabIndex = 0;

    const toolBtns = (['draw', 'fill', 'line', 'rect', 'pick'] as Tool[]).map((t) =>
      h(
        'button',
        {
          type: 'button',
          class: t === tool ? 'primary' : '',
          'aria-pressed': String(t === tool),
          onclick: () => {
            tool = t;
            toolBtns.forEach((b, i) => {
              const on = ['draw', 'fill', 'line', 'rect', 'pick'][i] === t;
              b.classList.toggle('primary', on);
              b.setAttribute('aria-pressed', String(on));
            });
          },
        },
        { draw: 'Pencil', fill: 'Fill', line: 'Line', rect: 'Box', pick: 'Pick color' }[t],
      ),
    );
    const mirrorSel = h(
      'select',
      { 'aria-label': 'Mirror', title: 'Paint the mirror image across the whole picture too' },
      ...(
        [
          ['none', 'Mirror: off'],
          ['h', 'Mirror: left ↔ right'],
          ['v', 'Mirror: top ↕ bottom'],
          ['both', 'Mirror: all four corners'],
        ] as const
      ).map(([v, t]) => h('option', { value: v }, t)),
    );
    mirrorSel.addEventListener('change', () => (mirror = mirrorSel.value as Mirror));
    refreshColor();
    render();

    return h(
      'div',
      { class: 'group-paint stack' },
      h(
        'p',
        { class: 'meta' },
        `The ${g.cells.filter((c) => c >= 0).length} blocks of the group side by side. Lines, boxes and fills run across the block edges; Apply puts each part back into its block.`,
      ),
      h('div', { class: 'toolbar' }, ...toolBtns, mirrorSel, undoBtn, redoBtn),
      h('div', { class: 'group-paint-area' }, canvas),
      h('div', { class: 'row group-paint-color' }, chip, choice.el, h('span', { class: 'meta' }, 'Right-drag erases; Alt-click picks a color.')),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'button', class: 'primary', onclick: () => close({ pixels: px, color }) }, 'Apply to the blocks'),
      ),
    );
  });
}
