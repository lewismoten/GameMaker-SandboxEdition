// The DOS player dialog's preview as a place to move things: words and frames are outlined on
// the screen the engine drew, and dragging one sets its x and y (a frame's corner resizes it).
// For the keyboard, a Move list picks an item and the arrow keys (on the preview or its arrow
// buttons) nudge it by a pixel, or 8 with Shift. The fields beside it follow every move.
import { h, clear } from '../../../core/ui';
import type { PatchValue } from '../../../../dosPlayer/patchRules';
import { describeItem, dragBy, grab, hitItem, toScreen, type DragItem, type Grip, type Held } from './dragItems';

export interface StageContext {
  canvas: HTMLCanvasElement;
  /** What the screen being shown can drag, as last drawn. */
  items: () => DragItem[];
  value: (id: string) => PatchValue;
  /** Shows new values (and keeps them in memory) while a move goes on. */
  apply: (updates: [string, PatchValue][]) => void;
  /** Saves the values a move ended with. */
  commit: () => void;
  /** The picked item changed (the menu shows its "No game-specific" line while that one is). */
  picked: () => void;
  /** The preview's name, for its label. */
  title: () => string;
  locked: boolean;
}

const CURSORS: Record<Grip, string> = { move: 'move', tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize' };

const ARROWS: [string, string, number, number][] = [
  ['ArrowLeft', 'Move left', -1, 0],
  ['ArrowUp', 'Move up', 0, -1],
  ['ArrowDown', 'Move down', 0, 1],
  ['ArrowRight', 'Move right', 1, 0],
];

let uid = 0;

export function dragStage(ctx: StageContext) {
  const id = `dps${++uid}`;
  let key: string | undefined;
  /** What a press took, where, and the canvas's place then (a drag reads moves against it, so a scroll mid-drag can't jump it). */
  let held: { held: Held; x: number; y: number; pointer: number; rect: DOMRect } | undefined;

  const marks = h('div', { class: 'dp-marks', 'aria-hidden': 'true' });
  const help = h(
    'p',
    { class: 'dp-note', id: `${id}-help` },
    'Drag a word or a frame on the preview to move it, or a frame’s corner to resize it. Or pick one under Move and press the arrow keys here (Shift moves 8).',
  );
  const stage = h('div', { class: 'dp-stage', 'aria-describedby': `${id}-help`, role: 'group' }, ctx.canvas, marks);
  const pick = h('select', { id: `${id}-pick`, onchange: () => choose(pick.value || undefined) });
  const status = h('p', { class: 'dp-note dp-where', role: 'status' });
  const arrows = ARROWS.map(([, label, dx, dy]) =>
    h('button', { type: 'button', class: 'dp-arrow', 'aria-label': label, title: label, onclick: () => nudge(dx, dy) }, label.replace('Move ', '')),
  );
  const controls = h(
    'div',
    { class: 'dp-row dp-move' },
    h('label', { for: `${id}-pick`, class: 'dp-mini' }, 'Move', pick),
    h('div', { class: 'dp-row', role: 'group', 'aria-label': 'Nudge by a pixel' }, ...arrows),
  );

  const item = () => ctx.items().find((i) => i.key === key);

  const choose = (k: string | undefined) => {
    key = k;
    refresh();
    ctx.picked();
  };

  const nudge = (dx: number, dy: number) => {
    const it = item();
    if (!it || ctx.locked) return;
    ctx.apply(dragBy(grab(it, 'move', ctx.value), dx, dy));
    ctx.commit();
  };

  const at = (ev: PointerEvent, r = ctx.canvas.getBoundingClientRect()) => {
    return toScreen(ev.clientX - r.left, ev.clientY - r.top, r.width, r.height);
  };

  stage.addEventListener('pointerdown', (ev) => {
    if (ctx.locked || ev.button !== 0) return;
    const rect = ctx.canvas.getBoundingClientRect();
    const [x, y] = at(ev, rect);
    const hit = hitItem(ctx.items(), x, y);
    if (!hit) return;
    ev.preventDefault();
    stage.focus({ preventScroll: true });
    stage.setPointerCapture(ev.pointerId);
    held = { held: grab(hit.item, hit.grip, ctx.value), x, y, pointer: ev.pointerId, rect };
    if (key !== hit.item.key) choose(hit.item.key);
  });
  stage.addEventListener('pointermove', (ev) => {
    if (held && ev.pointerId === held.pointer) {
      const [x, y] = at(ev, held.rect);
      ctx.apply(dragBy(held.held, x - held.x, y - held.y));
      return;
    }
    const [x, y] = at(ev);
    const hit = ctx.locked ? undefined : hitItem(ctx.items(), x, y);
    stage.style.cursor = hit ? CURSORS[hit.grip] : '';
  });
  const end = (ev: PointerEvent) => {
    if (!held || ev.pointerId !== held.pointer) return;
    held = undefined;
    ctx.commit();
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('keydown', (ev) => {
    const a = ARROWS.find(([k]) => k === ev.key);
    if (!a || !item()) return;
    ev.preventDefault();
    const step = ev.shiftKey ? 8 : 1;
    nudge(a[2] * step, a[3] * step);
  });

  /** Outlines every item (the picked one stronger) and fills the Move list, after a redraw. */
  function refresh() {
    const items = ctx.items();
    if (key && !items.some((i) => i.key === key)) key = undefined;
    const pct = (v: number, of: number) => `${(v * 100) / of}%`;
    clear(
      marks,
      ...items.map((i) => {
        const [x, y, w, hgt] = i.rect;
        return h('div', {
          class: `dp-mark${i.frame ? ' dp-mark-frame' : ''}${i.key === key ? ' on' : ''}`,
          style: `left:${pct(x, 320)};top:${pct(y, 200)};width:${pct(w, 320)};height:${pct(hgt, 200)}`,
        });
      }),
    );
    const want = ['', ...items.map((i) => i.key)].join('\n');
    if ([...pick.options].map((o) => o.value).join('\n') !== want)
      clear(pick, h('option', { value: '' }, items.length ? '(choose)' : '(nothing here moves)'), ...items.map((i) => h('option', { value: i.key }, i.label)));
    pick.value = key ?? '';
    const it = item();
    const off = ctx.locked || !items.length;
    pick.disabled = off;
    arrows.forEach((b) => (b.disabled = off || !it));
    stage.tabIndex = off ? -1 : 0;
    stage.setAttribute('aria-label', it ? `${ctx.title()}, moving ${describeItem(it)}` : ctx.title());
    const text = it ? describeItem(it) : '';
    if (status.textContent !== text) status.textContent = text;
  }

  return {
    stage,
    /** The Move list, arrow buttons, where the picked item is, and how to drag. */
    controls: h('div', { class: 'dp-move-all' }, controls, status, help),
    refresh,
    /** Picks the item that moves a field's patch (or none). */
    select(k: string | undefined) {
      if (k !== key) choose(k);
    },
    picked: () => key,
  };
}
