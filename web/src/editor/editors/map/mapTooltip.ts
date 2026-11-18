// Delayed descriptions of map check marks and scene links.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { clear, h } from '../../core/ui';
import type { checkPanel } from './check/checkPanel';

interface Context {
  readonly canvas: HTMLCanvasElement;
  readonly scroller: HTMLDivElement;
  readonly cell: (e: PointerEvent) => { x: number; y: number };
  readonly zoom: number;
  readonly check: ReturnType<typeof checkPanel> | undefined;
  readonly linkMarks: () => { x: number; y: number; kind: 'from' | 'to'; label: string }[];
}

export function createMapTooltip(editor: Context) {
  // the Level check's marks and links, told in words when the pointer rests on them; it never
  // takes a click (pointer-events: none), and hides while drawing
  const tip = h('div', { class: 'mt-tip', 'aria-hidden': 'true', hidden: true });
  document.body.append(tip);
  let tipTimer: ReturnType<typeof setTimeout> | undefined;
  let tipCell = -1;
  const hideTip = () => {
    clearTimeout(tipTimer);
    tip.hidden = true;
    tipCell = -1;
  };
  editor.canvas.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType === 'touch') return hideTip();
    const p = editor.cell(e);
    const c = p.y * MLEN + p.x;
    if (c === tipCell) return;
    hideTip();
    tipCell = c;
    const { clientX, clientY } = e;
    tipTimer = setTimeout(() => {
      // zoomed out, a mark is a dot or two: the nearest one within about 6 pixels
      const s = BLEN * editor.zoom;
      const lines = [
        ...(editor.check?.describe(c, s < 8 ? Math.ceil(6 / s) : 0) ?? []),
        ...editor
          .linkMarks()
          .filter((m) => m.x === p.x && m.y === p.y)
          .map((m) => (m.kind === 'to' ? `▢ The hero comes in here (${m.label})` : `▢ A link: touching it takes the hero ${m.label}`)),
      ];
      if (!lines.length) return;
      clear(tip, ...lines.map((l) => h('div', null, l)));
      tip.hidden = false;
      const w = tip.offsetWidth;
      const ht = tip.offsetHeight;
      tip.style.left = `${Math.max(4, Math.min(innerWidth - w - 4, clientX + 14))}px`;
      tip.style.top = `${clientY + 18 + ht > innerHeight ? Math.max(4, clientY - ht - 10) : clientY + 18}px`;
    }, 250);
  });
  editor.canvas.addEventListener('pointerleave', hideTip);
  editor.canvas.addEventListener('pointerdown', hideTip);
  editor.scroller.addEventListener('scroll', hideTip, { passive: true });
  editor.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return { hideTip, tip };
}
