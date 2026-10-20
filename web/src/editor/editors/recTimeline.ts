// The keys of a demo recording drawn as a strip of keycaps and hold bars, one track
// per key held at the same time. Two flavors: watchTimeline() scrolls past a fixed
// playhead in step with the game's playback tick; editTimeline() is a static strip
// you scroll and zoom, drag presses and releases on, and trim by its END flag.
import './recording.css';
import { h, modal } from '../ui';
import { scanName } from '../../input/scancodes';
import {
  toNotes,
  isDown,
  moveRange,
  moveNote,
  trimAt,
  idleGaps,
  shortenGap,
  duration,
  capLabel,
  clock,
  TimeMap,
  type RecEvent,
  type Note,
  type Grip,
  type Gap,
} from './recTimelineModel';

const TICK = 18.2;
const PALETTE = ['#55ffff', '#ff55ff', '#ffff55', '#55ff55', '#ff7f6a', '#8c9cff', '#ffaa00', '#d0d0d0'];
const RULER = 20;
const LANE = 32;
const CAP_H = 22;
const TAIL_H = 10;
const FONT = 'bold 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const ARROW_FONT = 'bold 15px system-ui, sans-serif';
const BG = '#0a0c1c';
const PLAYHEAD = '#ff9d00';
/** Pauses longer than this (ticks) fold up in the editor. */
const FOLD = Math.round(TICK * 8);

interface Layout {
  notes: Note[];
  lanes: number;
  colors: Map<number, string>;
}

let measurer: CanvasRenderingContext2D | undefined;

/** Hands out tracks at ppt pixels per tick, so keycaps and bars in a track never touch. */
function layout(events: RecEvent[], ppt: number): Layout {
  const ctx = (measurer ??= document.createElement('canvas').getContext('2d')!);
  const { notes, lanes } = toNotes(events, 6 / ppt, (scan) => (capWidth(ctx, scan) + 2) / ppt);
  const colors = new Map<number, string>();
  for (const n of notes) if (!colors.has(n.scan)) colors.set(n.scan, PALETTE[colors.size % PALETTE.length]);
  return { notes, lanes, colors };
}

const label = (scan: number) => capLabel(scan, scanName);

/** Arrows are drawn bigger than letters, as on a real keyboard. */
const capFont = (scan: number) => (/^[←↑→↓]$/.test(label(scan)) ? ARROW_FONT : FONT);

function capWidth(ctx: CanvasRenderingContext2D, scan: number): number {
  ctx.font = capFont(scan);
  return Math.max(24, Math.ceil(ctx.measureText(label(scan)).width) + 14);
}

type CapState = 'up' | 'down' | 'past' | 'hot';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, hh: number, r: number | number[]): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, hh, r);
}

function drawKeycap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, scan: number, color: string, state: CapState): void {
  const down = state === 'down';
  const travel = down ? 3 : 0;
  ctx.save();
  if (state === 'past') ctx.globalAlpha = 0.55;
  // The key's skirt (the side you see below the top face).
  roundRect(ctx, x, y + 1, w, CAP_H, 4);
  ctx.fillStyle = down ? '#3a3420' : '#7d776a';
  ctx.fill();
  if (down) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  roundRect(ctx, x + 1, y + travel, w - 2, CAP_H - 4, 3);
  const g = ctx.createLinearGradient(0, y + travel, 0, y + travel + CAP_H - 4);
  if (down) {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, color);
    g.addColorStop(1, color);
  } else {
    g.addColorStop(0, state === 'hot' ? '#ffffff' : '#f4f0e4');
    g.addColorStop(1, state === 'hot' ? '#e7e2ff' : '#d6d0c0');
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = down ? 'rgba(0,0,0,0.35)' : state === 'hot' ? PLAYHEAD : 'rgba(0,0,0,0.25)';
  ctx.lineWidth = state === 'hot' ? 2 : 1;
  ctx.stroke();
  // A strip of the key's track color, so the cap matches its bar.
  if (!down) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + CAP_H - 7, w - 8, 2);
  }
  ctx.fillStyle = down ? '#10121f' : '#262630';
  ctx.font = capFont(scan);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label(scan), x + w / 2, y + travel + (CAP_H - 4) / 2 + 0.5);
  ctx.restore();
}

interface Frame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  map: TimeMap;
  /** Canvas x of tick 0. */
  ox: number;
  lay: Layout;
  /** Where held-at-the-end notes stop: the recording's end (editor) or never (watching). */
  endT: number;
  /** Watching: the playback position and the playhead's x. */
  pos?: number;
  playX?: number;
  hover?: { note: number; grip: Grip | 'trim' | 'fold' };
  /** Editing: the dragged note's preview. */
  override?: { note: number; start: number; end: number | null };
  trimT?: number;
}

interface CapBox {
  note: number;
  x: number;
  y: number;
  w: number;
  xs: number;
  xe: number;
}

const laneY = (lane: number) => RULER + 5 + lane * LANE;

function niceStep(pxPerSecond: number): number {
  for (const s of [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]) if (s * pxPerSecond >= 64) return s;
  return 1200;
}

/** Draws the strip; returns where each keycap went, for hit testing. */
function draw(f: Frame): CapBox[] {
  const { ctx, width, height, map, ox, lay } = f;
  const X = (t: number) => ox + map.x(t);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  // Scanlines and tracks.
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = RULER; y < height; y += 3) ctx.fillRect(0, y, width, 1);
  for (let l = 0; l < lay.lanes; l++) {
    ctx.fillStyle = l % 2 ? 'rgba(120,140,255,0.035)' : 'rgba(0,0,0,0)';
    ctx.fillRect(0, laneY(l) - 3, width, LANE);
  }
  // Ruler.
  ctx.fillStyle = '#151a3d';
  ctx.fillRect(0, 0, width, RULER);
  ctx.fillStyle = '#2b3370';
  ctx.fillRect(0, RULER - 1, width, 1);
  const t0 = map.t(-ox);
  const t1 = map.t(width - ox);
  const step = niceStep(map.pxPerTick * TICK);
  ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const visibleSegs = map.segs.filter((s) => s.t1 > t0 && s.t0 < t1);
  for (const s of visibleSegs) {
    if (s.fold) continue;
    const a = Math.max(s.t0, t0);
    const b = Math.min(s.t1, t1);
    for (let k = Math.ceil(a / TICK / (step / 2)); (k * step * TICK) / 2 <= b; k++) {
      const t = (k * step * TICK) / 2;
      const x = Math.round(X(t)) + 0.5;
      const major = k % 2 === 0;
      ctx.fillStyle = major ? '#6f7bd0' : '#3a4387';
      ctx.fillRect(x, major ? 9 : 14, 1, RULER - (major ? 9 : 14));
      if (major) {
        ctx.fillStyle = '#9aa6ff';
        ctx.fillText(clock(t, step < 1), x + 3, 7);
        ctx.fillStyle = 'rgba(111,123,208,0.10)';
        ctx.fillRect(x, RULER, 1, height - RULER);
      }
    }
  }
  // Folded pauses.
  for (const s of visibleSegs) {
    if (!s.fold) continue;
    const xa = X(s.t0);
    const xb = X(s.t1);
    const hot = f.hover?.grip === 'fold' && f.hover.note === map.segs.indexOf(s);
    ctx.fillStyle = hot ? 'rgba(255,157,0,0.16)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(xa, 0, xb - xa, height);
    ctx.strokeStyle = hot ? PLAYHEAD : '#4a5296';
    ctx.lineWidth = 1;
    for (const x of [xa + 6, xb - 6]) {
      ctx.beginPath();
      for (let y = 0, i = 0; y <= height; y += 6, i++) ctx.lineTo(x + (i % 2 ? 3 : -3), y);
      ctx.stroke();
    }
    ctx.save();
    ctx.fillStyle = hot ? PLAYHEAD : '#9aa6ff';
    ctx.textAlign = 'center';
    ctx.fillText(clock(s.t1 - s.t0, false), (xa + xb) / 2, 7);
    ctx.translate((xa + xb) / 2, RULER + (height - RULER) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('folded', 0, 0);
    ctx.restore();
  }
  // Watching: shade the past and draw the playhead under the keys.
  if (f.playX !== undefined) {
    const g = ctx.createLinearGradient(f.playX - 80, 0, f.playX, 0);
    g.addColorStop(0, 'rgba(255,157,0,0)');
    g.addColorStop(1, 'rgba(255,157,0,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(f.playX - 80, RULER, 80, height - RULER);
  }
  // Notes: bars first, keycaps on top.
  const boxes: CapBox[] = [];
  const pos = f.pos;
  lay.notes.forEach((n, i) => {
    const o = f.override?.note === i ? f.override : undefined;
    const start = o ? o.start : n.start;
    const end = o ? o.end : n.end;
    const xs = X(start);
    const xe = end === null ? (f.endT === Infinity ? width + 40 : X(f.endT)) : X(end);
    const w = capWidth(ctx, n.scan);
    if (xe < -w || xs > width + 4) return;
    const y = laneY(n.lane);
    const color = lay.colors.get(n.scan)!;
    const down = pos !== undefined && isDown({ ...n, start, end }, pos);
    const past = pos !== undefined && end !== null && end <= pos;
    // Sticky: a key still down when its cap would scroll off stays at the left edge.
    // Watching, it lets go when the game releases the key; in the editor (where the
    // left edge is the moment in question) the end of its bar pushes it away.
    const cx = xs >= 0 ? xs : pos === undefined ? Math.min(0, xe - w) : down ? 0 : xs;
    // The bar (tail) for as long as the key is held.
    const ty = y + (CAP_H - TAIL_H) / 2 - 1;
    const tailFrom = Math.max(cx + w / 2, xs + w / 2);
    if (xe > tailFrom) {
      ctx.globalAlpha = past ? 0.3 : 0.6;
      ctx.fillStyle = color;
      roundRect(ctx, tailFrom, ty, xe - tailFrom, TAIL_H, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (down && f.playX !== undefined) {
        // The part already played glows.
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        roundRect(ctx, tailFrom, ty, Math.max(0, Math.min(f.playX, xe) - tailFrom), TAIL_H, 3);
        ctx.fill();
        ctx.restore();
      }
      if (end !== null) {
        const hot = f.hover?.note === i && f.hover.grip === 'end';
        ctx.fillStyle = hot ? PLAYHEAD : past ? 'rgba(255,255,255,0.35)' : '#ffffff';
        ctx.fillRect(Math.round(xe) - (hot ? 2 : 1), ty - 3, hot ? 4 : 2, TAIL_H + 6);
      }
    }
    const hot = f.hover?.note === i && f.hover.grip !== 'end';
    drawKeycap(ctx, cx, y, w, n.scan, color, down ? 'down' : past ? 'past' : hot || f.override?.note === i ? 'hot' : 'up');
    // A flash ring the moment the key goes down.
    if (down && pos !== undefined && pos - start < 5) {
      const k = (pos - start) / 5;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, cx - 3 - k * 8, y - 3 - k * 8, w + 6 + k * 16, CAP_H + 6 + k * 16, 6);
      ctx.stroke();
      ctx.restore();
    }
    boxes.push({ note: i, x: cx, y, w, xs, xe });
  });
  if (f.playX !== undefined) {
    const x = Math.round(f.playX) + 0.5;
    ctx.fillStyle = PLAYHEAD;
    ctx.shadowColor = PLAYHEAD;
    ctx.shadowBlur = 8;
    ctx.fillRect(x - 1, RULER, 2, height - RULER);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x - 6, RULER - 8);
    ctx.lineTo(x + 6, RULER - 8);
    ctx.lineTo(x, RULER);
    ctx.fill();
  }
  if (f.trimT !== undefined) {
    const x = Math.round(X(f.trimT)) + 0.5;
    const hot = f.hover?.grip === 'trim';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, RULER, width - x, height - RULER);
    ctx.fillStyle = hot ? PLAYHEAD : '#ff5555';
    ctx.fillRect(x - 1, 0, 2, height);
    roundRect(ctx, x - 1, 1, 38, 15, [0, 3, 3, 0]);
    ctx.fill();
    ctx.fillStyle = '#10121f';
    ctx.font = 'bold 10px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('END', x + 5, 9);
  }
  return boxes;
}

/** Keeps a canvas sized to its box at the screen's pixel density. */
function fitCanvas(canvas: HTMLCanvasElement, cssHeight: number): { ctx: CanvasRenderingContext2D; width: number } {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, canvas.clientWidth);
  canvas.style.height = `${cssHeight}px`;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(cssHeight * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width };
}

const stripHeight = (lanes: number) => RULER + 8 + lanes * LANE;

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
    const map = new TimeMap(ppt);
    draw({ ctx, width, height: stripHeight(lay.lanes), map, ox: playX - shown * ppt, lay, endT: Infinity, pos: shown, playX });
    // A long wait before the next key: say how long.
    const next = lay.notes.find((n) => n.start > shown);
    if (next && (next.start - shown) * ppt > width - playX) {
      ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = '#9aa6ff';
      ctx.textAlign = 'right';
      ctx.fillText(`next key in ${clock(next.start - shown, false)} →`, width - 8, RULER + 14);
    }
    readout.textContent = `${clock(Math.min(shown, Math.max(end, shown)))} / ${clock(end)}`;
  };
  raf = requestAnimationFrame(frame);
  return { el, destroy: () => cancelAnimationFrame(raf) };
}

export interface EditTimeline extends Timeline {
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
    canvas,
    h('div', { class: 'rec-tl-foot' }, status),
  );

  function rebuild(): void {
    lay = layout(events, ppt);
    map = new TimeMap(ppt, idleGaps(events, FOLD));
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
      status.textContent = `✂ Trim the demo to ${clock(drag.t)} (of ${clock(total)}); keys still held there are let go.`;
      return;
    }
    const at = hover && hover.grip !== 'fold' && hover.grip !== 'trim' ? lay.notes[hover.note] : undefined;
    if (drag?.kind === 'note') {
      const n = lay.notes[drag.note];
      const s = drag.grip === 'end' ? n.start : n.start + drag.dt;
      const e = n.end === null ? null : drag.grip === 'start' ? n.end : n.end + drag.dt;
      status.textContent = `${scanName(n.scan)}: down ${clock(s)}${e === null ? ', held to the end' : ` → up ${clock(e)} (${((e - s) / TICK).toFixed(2)} s)`}`;
    } else if (at) {
      const how =
        hover!.grip === 'end' ? 'drag to change when it is let go' : hover!.grip === 'start' ? 'drag to change when it is pressed' : 'drag to move this press';
      status.textContent = `${scanName(at.scan)}: down ${clock(at.start)}${at.end === null ? ', held to the end' : ` → up ${clock(at.end)} (${((at.end - at.start) / TICK).toFixed(2)} s)`} · ${how}`;
    } else if (hover?.grip === 'trim') status.textContent = 'Drag the END flag left to cut off the rest of the demo.';
    else if (hover?.grip === 'fold') {
      const s = map.segs[hover.note];
      status.textContent = `${clock(s.t1 - s.t0, false)} with no key pressed or let go, folded up. Click to shorten it.`;
    } else status.textContent = `${lay.notes.length} key presses · ${clock(total)} · drag keys to retime them, the END flag to trim`;
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
    else if (at) drag = { kind: 'note', note: at.note, grip: at.grip as Grip, t0: tickAt(x), dt: 0 };
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
      void shorten({ from: s.t0, to: s.t1 });
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
