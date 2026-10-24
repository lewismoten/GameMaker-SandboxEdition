// The keys of a demo recording drawn as a strip of keycaps and hold bars, one track
// per key held at the same time. Two flavors: watchTimeline() scrolls past a fixed
// playhead in step with the game's playback tick; editTimeline() is a static strip
// you scroll and zoom, drag presses and releases on, and trim by its END flag.
import './recording.css';
import { h, modal } from '../../core/ui';
import { scanName } from '../../../input/scancodes';
import {
  moveRange,
  moveNote,
  trimAt,
  idleGaps,
  screenGaps,
  shortenGap,
  duration,
  clock,
  TimeMap,
  type RecEvent,
  type Grip,
  type Gap,
} from './recTimelineModel';
import { TICK, RULER, CAP_H, FOLD, type Layout, layout, type Frame, type CapBox, draw, fitCanvas, stripHeight } from './recTimelineDraw';

export interface Timeline {
  el: HTMLElement;
  destroy(): void;
}

/**
 * The strip under the game while a demo plays back: it scrolls left past a fixed
 * playhead, following getTick() (the recorder's tick) so it stays in step with the
 * game even when the game stalls; between ticks it glides at the measured tick rate.
 */
export function watchTimeline(events: RecEvent[], getTick: () => number | undefined): Timeline {
  const canvas = h('canvas', { class: 'rec-tl-canvas', 'aria-label': 'Keys of the demo across time' });
  const readout = h('span', { class: 'rec-tl-clock' }, '0:00.0');
  const el = h(
    'div',
    { class: 'rec-tl rec-tl-watch' },
    canvas,
    h('div', { class: 'rec-tl-foot' }, h('span', null, 'Keys light up as the game presses them'), readout),
  );
  let lay: Layout | undefined;
  let ppt = 0;
  let last = -1;
  let changedAt = performance.now();
  let interval = 1000 / TICK;
  let shown = 0;
  let raf = 0;
  const end = duration(events);
  const screens = screenGaps(events);
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!canvas.isConnected) return;
    const now = performance.now();
    const tick = getTick() ?? 0;
    if (tick !== last) {
      if (last >= 0 && tick === last + 1) interval = interval * 0.8 + Math.min(500, now - changedAt) * 0.2;
      if (tick < last) shown = 0;
      last = tick;
      changedAt = now;
    }
    // Glide up to (never past) the next tick; a stalled game holds the strip still.
    shown = Math.max(Math.min(shown, tick + 1), tick + Math.min(1, (now - changedAt) / interval));
    const want = Math.min(10, Math.max(4, canvas.clientWidth / 110));
    if (!lay || want !== ppt) {
      ppt = want;
      lay = layout(events, ppt);
    }
    const { ctx, width } = fitCanvas(canvas, stripHeight(lay.lanes));
    const playX = Math.round(width * 0.28);
    const map = new TimeMap(ppt, [], screens);
    draw({ ctx, width, height: stripHeight(lay.lanes), map, ox: playX - map.x(shown), lay, endT: Infinity, pos: shown, playX });
    // A long wait before the next key: say how long (a screen's polls are no time in play).
    const nextNote = lay.notes.find((n) => n.start > shown)?.start ?? Infinity;
    const nextScreen = lay.screenKeys.find((k) => k.t > shown)?.t ?? Infinity;
    const next = Math.min(nextNote, nextScreen);
    if (next < Infinity && map.x(next) - map.x(shown) > width - playX) {
      ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = '#9aa6ff';
      ctx.textAlign = 'right';
      const during = next === nextScreen && screens.some((g) => g.to === next && shown >= g.from);
      ctx.fillText(during ? 'next key: during the screen →' : `next key in ${clock(map.play(next) - map.play(shown), false)} →`, width - 8, RULER + 14);
    }
    readout.textContent = shown > end ? `${clock(map.play(shown))} · all keys played` : `${clock(map.play(shown))} / ${clock(map.play(end))}`;
  };
  raf = requestAnimationFrame(frame);
  return { el, destroy: () => cancelAnimationFrame(raf) };
}

interface EditTimeline extends Timeline {
  set(events: RecEvent[]): void;
}

/**
 * The editor's strip: scroll (drag the background, the scrollbar or a sideways wheel),
 * zoom (buttons or Ctrl+wheel), drag a keycap to move the press, its left edge to move
 * only the press, the end of its bar to move the release, the END flag to trim, and
 * click a folded pause to shorten it. Every edit hands back new events.
 */
export function editTimeline(initial: RecEvent[], onEdit: (events: RecEvent[]) => void): EditTimeline {
  let events = initial;
  let ppt = 6;
  let scroll = 0;
  let fitted = false;
  let lay = layout(events, ppt);
  let map = new TimeMap(ppt);
  let boxes: CapBox[] = [];
  let hover: Frame['hover'];
  let drag:
    | { kind: 'note'; note: number; grip: Grip; t0: number; dt: number }
    | { kind: 'trim'; t: number }
    | { kind: 'pan'; x0: number; s0: number; moved: boolean }
    | { kind: 'fold'; seg: number }
    | undefined;
  const LEFT = 14;
  const canvas = h('canvas', { class: 'rec-tl-canvas', tabindex: 0, 'aria-label': 'Keys of the demo across time. Drag to edit.' });
  const status = h('span', { class: 'rec-tl-status' });
  const range = h('input', { type: 'range', class: 'rec-tl-scroll', min: 0, max: 0, value: 0, 'aria-label': 'Scroll the timeline' });
  const zoomBy = (k: number, at = canvas.clientWidth / 2) => {
    const t = map.t(at - LEFT + scroll);
    ppt = Math.min(40, Math.max(0.25, ppt * k));
    rebuild();
    scroll = map.x(t) - (at - LEFT);
    render();
  };
  const fit = () => {
    fitted = true;
    const w = Math.max(100, canvas.clientWidth - LEFT * 2 - 40);
    const end = Math.max(1, duration(events));
    ppt = Math.min(20, Math.max(0.25, w / end));
    rebuild();
    // With pauses folded, the strip may now be shorter than the box: zoom in to fill it.
    for (let i = 0; i < 6 && map.x(end) < w * 0.9 && ppt < 20; i++) {
      ppt = Math.min(20, ppt * Math.min(4, (w * 0.98) / Math.max(1, map.x(end))));
      rebuild();
    }
    scroll = 0;
    render();
  };
  const el = h(
    'div',
    { class: 'rec-tl rec-tl-edit' },
    h(
      'div',
      { class: 'rec-tl-bar' },
      h('button', { title: 'Zoom out', 'aria-label': 'Zoom out', onclick: () => zoomBy(1 / 1.5) }, '−'),
      h('button', { title: 'Zoom in', 'aria-label': 'Zoom in', onclick: () => zoomBy(1.5) }, '+'),
      h('button', { title: 'Show the whole demo', onclick: fit }, 'Fit'),
      range,
    ),
    // a demo with many keys held at once is tall: it scrolls in its own box
    h('div', { class: 'rec-tl-viewport' }, canvas),
    h('div', { class: 'rec-tl-foot' }, status),
  );

  function rebuild(): void {
    lay = layout(events, ppt);
    map = new TimeMap(ppt, idleGaps(events, FOLD), screenGaps(events));
  }

  function contentWidth(): number {
    return map.x(duration(events)) + 60;
  }

  function render(): void {
    if (!canvas.isConnected) return;
    if (!fitted && canvas.clientWidth > 0) return fit();
    const height = stripHeight(lay.lanes);
    const { ctx, width } = fitCanvas(canvas, height);
    const maxScroll = Math.max(0, contentWidth() + LEFT - width);
    scroll = Math.min(maxScroll, Math.max(0, scroll));
    range.max = String(Math.round(maxScroll));
    range.value = String(Math.round(scroll));
    range.disabled = maxScroll === 0;
    let override: Frame['override'];
    let trimT = duration(events);
    if (drag?.kind === 'note') {
      const n = lay.notes[drag.note];
      const dt = drag.dt;
      override = {
        note: drag.note,
        start: drag.grip === 'end' ? n.start : n.start + dt,
        end: n.end === null ? null : drag.grip === 'start' ? n.end : n.end + dt,
      };
    } else if (drag?.kind === 'trim') trimT = drag.t;
    boxes = draw({ ctx, width, height, map, ox: LEFT - scroll, lay, endT: duration(events), hover, override, trimT });
    describe();
  }

  function describe(): void {
    const total = duration(events);
    if (drag?.kind === 'trim') {
      status.textContent = `✂ Trim the demo to ${clock(map.play(drag.t))} (of ${clock(map.play(total))}); keys still held there are let go.`;
      return;
    }
    const at = hover && hover.grip !== 'fold' && hover.grip !== 'trim' ? lay.notes[hover.note] : undefined;
    if (drag?.kind === 'note') {
      const n = lay.notes[drag.note];
      const s = drag.grip === 'end' ? n.start : n.start + drag.dt;
      const e = n.end === null ? null : drag.grip === 'start' ? n.end : n.end + drag.dt;
      status.textContent = `${scanName(n.scan)}: down ${clock(map.play(s))}${e === null ? ', held to the end' : ` → up ${clock(map.play(e))} (${((map.play(e) - map.play(s)) / TICK).toFixed(2)} s)`}`;
    } else if (at) {
      const how =
        hover!.grip === 'end' ? 'drag to change when it is let go' : hover!.grip === 'start' ? 'drag to change when it is pressed' : 'drag to move this press';
      status.textContent = `${scanName(at.scan)}: down ${clock(map.play(at.start))}${at.end === null ? ', held to the end' : ` → up ${clock(map.play(at.end))} (${((map.play(at.end) - map.play(at.start)) / TICK).toFixed(2)} s)`} · ${how}`;
    } else if (hover?.grip === 'trim') status.textContent = 'Drag the END flag left to cut off the rest of the demo.';
    else if (hover?.grip === 'fold') {
      const s = map.segs[hover.note];
      const key = s.screen ? lay.screenKeys.find((k) => k.t === s.t1) : undefined;
      status.textContent = s.screen
        ? `A between-scene screen (an animation, picture or text page), ${(s.t1 - s.t0).toLocaleString()} key checks — not time in play.${
            key
              ? ` ${scanName(key.scan)} was pressed to go on: a screen key. The screen read it (recorded ${key.events.length === 1 ? 'once' : `${key.events.length} times, once per check that saw it`}) and the game never saw it go down or up, so it is not held.`
              : ''
          }`
        : `${clock(s.t1 - s.t0, false)} with no key pressed or let go, folded up. Click to shorten it.`;
    } else status.textContent = `${lay.notes.length} key presses · ${clock(map.play(total))} · drag keys to retime them, the END flag to trim`;
  }

  function hit(x: number, y: number): Frame['hover'] {
    const endX = LEFT - scroll + map.x(duration(events));
    if (Math.abs(x - endX) <= 6 || (y < RULER && x >= endX - 2 && x <= endX + 40)) return { note: -1, grip: 'trim' };
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (y < b.y - 3 || y > b.y + CAP_H + 3) continue;
      const n = lay.notes[b.note];
      if (n.end !== null && Math.abs(x - b.xe) <= 6 && x > b.x + b.w - 2) return { note: b.note, grip: 'end' };
      if (x >= b.x && x <= b.x + b.w) return { note: b.note, grip: x <= b.x + 6 && b.x === b.xs ? 'start' : 'both' };
    }
    const seg = map.segs.findIndex((s) => s.fold && x >= LEFT - scroll + s.x0 && x <= LEFT - scroll + s.x1);
    if (seg >= 0) return { note: seg, grip: 'fold' };
    return undefined;
  }

  const point = (e: PointerEvent | WheelEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const tickAt = (x: number) => map.t(x - LEFT + scroll);

  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = point(e);
    const at = hit(x, y);
    canvas.setPointerCapture(e.pointerId);
    if (at?.grip === 'trim') drag = { kind: 'trim', t: duration(events) };
    else if (at?.grip === 'fold') drag = { kind: 'fold', seg: at.note };
    else if (at) drag = { kind: 'note', note: at.note, grip: at.grip, t0: tickAt(x), dt: 0 };
    else drag = { kind: 'pan', x0: x, s0: scroll, moved: false };
    hover = at;
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    const { x, y } = point(e);
    if (!drag) {
      hover = hit(x, y);
      canvas.style.cursor = !hover ? 'grab' : hover.grip === 'fold' ? 'pointer' : hover.grip === 'both' ? 'move' : 'ew-resize';
      render();
      return;
    }
    if (drag.kind === 'pan') {
      drag.moved ||= Math.abs(x - drag.x0) > 3;
      scroll = drag.s0 - (x - drag.x0);
      canvas.style.cursor = 'grabbing';
    } else if (drag.kind === 'trim') drag.t = Math.round(Math.min(duration(events), Math.max(0, tickAt(x))));
    else if (drag.kind === 'note') {
      const [min, max] = moveRange(events, lay.notes, drag.note, drag.grip);
      drag.dt = Math.round(Math.min(max, Math.max(min, tickAt(x) - drag.t0)));
    }
    render();
  });
  const finish = (e: PointerEvent, cancel = false) => {
    const d = drag;
    drag = undefined;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (!cancel && d?.kind === 'trim' && d.t < duration(events)) return commit(trimAt(events, d.t));
    if (!cancel && d?.kind === 'note' && d.dt !== 0) {
      const next = moveNote(events, lay.notes, d.note, d.grip, d.dt);
      if (next) return commit(next);
      status.textContent = 'That would leave a gap longer than a .REC file can hold (about an hour).';
    }
    if (!cancel && d?.kind === 'fold') {
      const s = map.segs[d.seg];
      // a screen's polls are how DOS timed the key; shortening them would change the demo
      if (!s.screen) void shorten({ from: s.t0, to: s.t1 });
    }
    render();
  };
  canvas.addEventListener('pointerup', (e) => finish(e));
  canvas.addEventListener('pointercancel', (e) => finish(e, true));
  canvas.addEventListener('pointerleave', () => {
    if (drag) return;
    hover = undefined;
    render();
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY / 200), point(e).x);
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        scroll += e.shiftKey ? e.deltaY : e.deltaX;
        render();
      }
    },
    { passive: false },
  );
  canvas.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') scroll += (k === 'ArrowLeft' ? -1 : 1) * canvas.clientWidth * 0.25;
    else if (k === '+' || k === '=') return zoomBy(1.5);
    else if (k === '-') return zoomBy(1 / 1.5);
    else return;
    e.preventDefault();
    render();
  });
  range.addEventListener('input', () => {
    scroll = Number(range.value);
    render();
  });

  async function shorten(gap: Gap): Promise<void> {
    const len = await modal<number>('Shorten the pause', (close) =>
      h(
        'div',
        { class: 'stack' },
        h(
          'p',
          { class: 'hint' },
          `No key goes down or up for ${clock(gap.to - gap.from, false)} here. Make it shorter? Keys held down stay held, and monsters and timers keep going, so the rest of the demo may play out differently.`,
        ),
        h(
          'div',
          { class: 'buttons' },
          h('button', { onclick: () => close(undefined) }, 'Keep it'),
          ...[1, 3, 5].map((s) => h('button', { class: s === 3 ? 'primary' : '', onclick: () => close(Math.round(s * TICK)) }, `${s} s`)),
        ),
      ),
    );
    if (len !== undefined) commit(shortenGap(events, gap, len));
  }

  function commit(next: RecEvent[]): void {
    onEdit(next);
  }

  const ro = new ResizeObserver(() => render());
  ro.observe(canvas);
  rebuild();
  queueMicrotask(render);
  return {
    el,
    set(next) {
      events = next;
      hover = undefined;
      rebuild();
      render();
    },
    destroy: () => ro.disconnect(),
  };
}
