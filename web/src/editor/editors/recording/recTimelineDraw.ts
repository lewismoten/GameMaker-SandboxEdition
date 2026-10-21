// Drawing a demo recording's timeline on a canvas: a ruler in seconds, one track per key
// held at the same time, each press a keycap (arrows drawn bigger, as on a keyboard) with a
// bar for as long as it is held, folded pauses, the END flag and the play head.
import { scanName } from '../../../input/scancodes';
import { toNotes, isDown, capLabel, clock, TimeMap, type RecEvent, type Note, type Grip } from './recTimelineModel';

export const TICK = 18.2;
const PALETTE = ['#55ffff', '#ff55ff', '#ffff55', '#55ff55', '#ff7f6a', '#8c9cff', '#ffaa00', '#d0d0d0'];
export const RULER = 20;
const LANE = 32;
export const CAP_H = 22;
const TAIL_H = 10;
const FONT = 'bold 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const ARROW_FONT = 'bold 15px system-ui, sans-serif';
const BG = '#0a0c1c';
const PLAYHEAD = '#ff9d00';
/** Pauses longer than this (ticks) fold up in the editor. */
export const FOLD = Math.round(TICK * 8);

export interface Layout {
  notes: Note[];
  lanes: number;
  colors: Map<number, string>;
}

let measurer: CanvasRenderingContext2D | undefined;

/** Hands out tracks at ppt pixels per tick, so keycaps and bars in a track never touch. */
export function layout(events: RecEvent[], ppt: number): Layout {
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

export interface Frame {
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

export interface CapBox {
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
export function draw(f: Frame): CapBox[] {
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
  let lastLabel = -Infinity;
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
      if (major && x > lastLabel + 44 && (f.trimT === undefined || x < X(f.trimT) - 40 || x > X(f.trimT) + 44)) {
        lastLabel = x;
        ctx.fillStyle = '#9aa6ff';
        ctx.fillText(clock(f.map.play(t), step < 1), x + 3, 7);
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
    const span = s.screen ? `${Math.round((s.t1 - s.t0) / 1000)}k polls` : clock(s.t1 - s.t0, false);
    const tw = ctx.measureText(span).width + 8;
    ctx.fillStyle = '#151a3d';
    ctx.fillRect((xa + xb) / 2 - tw / 2, 0, tw, RULER - 1);
    ctx.fillStyle = hot ? PLAYHEAD : '#9aa6ff';
    ctx.fillText(span, (xa + xb) / 2, 7);
    ctx.translate((xa + xb) / 2, RULER + (height - RULER) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(s.screen ? 'screen' : 'folded', 0, 0);
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
export function fitCanvas(canvas: HTMLCanvasElement, cssHeight: number): { ctx: CanvasRenderingContext2D; width: number } {
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

export const stripHeight = (lanes: number) => RULER + 8 + lanes * LANE;
