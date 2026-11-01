// Draws the map editor's block behavior marks (blockMarks.ts) on their own canvas over the map:
// barrier edges, gravity chevrons that move the way the pull goes (still when the viewer asks
// for reduced motion; opposite pulls that cancel are left unmarked, as they pull nowhere), and
// badges for touch, pickup and timed blocks. Only the cells in view are drawn; each block's
// behavior is worked out once per block set. Editor-only; never exported.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { barrierEdges, behaviors, Edge, type BlockBehavior } from './blockMarks';

export type MarkKind = 'barriers' | 'push' | 'touch' | 'pickup' | 'timed';
export const MARK_KINDS: MarkKind[] = ['barriers', 'push', 'touch', 'pickup', 'timed'];

/** The marks' colors, each drawn over a black outline so it reads on any palette. */
const COLOR = { wall: '#ffffff', oneWay: '#ffb000', push: '#7dffb0', touch: '#ff5ce1', pickup: '#ffd400', timed: '#4de1ff' } as const;

interface LayerHost {
  canvas: HTMLCanvasElement;
  block(): number;
  cells(): ArrayLike<number>;
  blocks(): Block[];
  /** The part of the map in view, in map pixels (it may run past the edges when the map wraps). */
  view(): { x: number; y: number; w: number; h: number };
  /** Called after each animation frame (the wrapped view copies the layer). */
  frame(): void;
}

const outlined = (g: CanvasRenderingContext2D, color: string, width: number) => {
  g.lineWidth = width + 2;
  g.strokeStyle = '#000';
  g.stroke();
  g.lineWidth = width;
  g.strokeStyle = color;
  g.stroke();
};

function badge(g: CanvasRenderingContext2D, kind: 'touch' | 'pickup' | 'timed', x: number, y: number, s: number): void {
  const r = Math.max(2.5, s * 0.16);
  const pad = Math.max(1, s * 0.06);
  // touch top left, pickup top right, timed bottom left: one cell can show all three
  const cx = kind === 'pickup' ? x + s - pad - r : x + pad + r;
  const cy = kind === 'timed' ? y + s - pad - r : y + pad + r;
  badgeAt(g, kind, cx, cy, r, Math.max(1, s / 20));
}

function badgeAt(g: CanvasRenderingContext2D, kind: 'touch' | 'pickup' | 'timed', cx: number, cy: number, r: number, line: number): void {
  g.beginPath();
  if (kind === 'touch') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
  } else if (kind === 'pickup') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy + r * 0.8);
    g.lineTo(cx - r, cy + r * 0.8);
  } else g.arc(cx, cy, r, 0, Math.PI * 2);
  g.closePath();
  g.fillStyle = COLOR[kind];
  g.fill();
  g.lineWidth = line;
  g.strokeStyle = '#000';
  g.stroke();
  if (kind === 'timed' && r >= 4) {
    // clock hands
    g.beginPath();
    g.moveTo(cx, cy - r * 0.7);
    g.lineTo(cx, cy);
    g.lineTo(cx + r * 0.55, cy);
    g.stroke();
  }
}

/** A chevron at the cell's center, pointing along (dx, dy), slid along that way by `phase` (0..1). */
function chevron(g: CanvasRenderingContext2D, x: number, y: number, s: number, k: BlockBehavior, phase: number): void {
  const { x: dx, y: dy } = k.pull;
  g.save();
  g.beginPath();
  g.rect(x, y, s, s);
  g.clip();
  const a = Math.atan2(dy, dx);
  const len = Math.hypot(dx, dy) > 1 ? s * Math.SQRT2 : s;
  const w = Math.max(1.5, s / 12);
  for (const o of [phase - 1, phase]) {
    const t = (o - 0.5) * len;
    g.save();
    g.translate(x + s / 2 + Math.cos(a) * t, y + s / 2 + Math.sin(a) * t);
    g.rotate(a);
    g.beginPath();
    g.moveTo(-s * 0.12, -s * 0.28);
    g.lineTo(s * 0.16, 0);
    g.lineTo(-s * 0.12, s * 0.28);
    outlined(g, COLOR.push, w);
    g.restore();
  }
  g.restore();
}

/** One edge from (x1, y1) to (x2, y2); a one-way edge gets teeth on the solid side, pointing into the block it guards. */
function edgePath(walls: Path2D, oneWay: Path2D, e: Edge, x1: number, y1: number, x2: number, y2: number, s: number): void {
  if (e === Edge.None) return;
  if (e === Edge.Wall) {
    walls.moveTo(x1, y1);
    walls.lineTo(x2, y2);
    return;
  }
  oneWay.moveTo(x1, y1);
  oneWay.lineTo(x2, y2);
  if (s < 8) return;
  const sign = e === Edge.IntoFirst ? -1 : 1;
  const horizontal = y1 === y2;
  const tooth = s * 0.2;
  for (let k = 0.125; k < 1; k += 0.25) {
    const px = horizontal ? x1 + (x2 - x1) * k : x1;
    const py = horizontal ? y1 : y1 + (y2 - y1) * k;
    oneWay.moveTo(px, py);
    oneWay.lineTo(horizontal ? px : px + sign * tooth, horizontal ? py + sign * tooth : py);
  }
}

export function blockMarksLayer(host: LayerHost) {
  const shown = new Set<MarkKind>();
  let info: BlockBehavior[] = [];
  let edges: { top: Uint8Array; left: Uint8Array } = { top: new Uint8Array(0), left: new Uint8Array(0) };
  let dirty = true;
  let anim = 0;
  let last = 0;
  const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;

  function draw(now = performance.now()): boolean {
    const c = host.canvas;
    const s = host.block();
    if (!shown.size) {
      // nothing to show: no map-sized canvas kept in memory
      c.width = c.height = 0;
      return false;
    }
    if (c.width !== MLEN * s) c.width = MLEN * s;
    if (c.height !== MWID * s) c.height = MWID * s;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, c.width, c.height);
    const cells = host.cells();
    if (dirty) {
      info = behaviors(host.blocks());
      edges = barrierEdges(cells, info, MLEN, MWID);
      dirty = false;
    }
    const v = host.view();
    const x0 = Math.floor(v.x / s),
      y0 = Math.floor(v.y / s);
    const x1 = Math.floor((v.x + v.w) / s),
      y1 = Math.floor((v.y + v.h) / s);
    const phase = reduced?.matches ? 0.5 : (now / 1400) % 1;
    const walls = new Path2D(),
      oneWay = new Path2D();
    let moving = false;
    const seen = new Set<number>();
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const nx = ((cx % MLEN) + MLEN) % MLEN,
          ny = ((cy % MWID) + MWID) % MWID;
        const i = ny * MLEN + nx;
        if (seen.has(i)) continue;
        seen.add(i);
        const px = nx * s,
          py = ny * s;
        if (shown.has('barriers')) {
          edgePath(walls, oneWay, edges.top[i] as Edge, px, py, px + s, py, s);
          edgePath(walls, oneWay, edges.left[i] as Edge, px, py, px, py + s, s);
          // the map wraps: its bottom and right edges are the top and left edges of row and column 0
          if (ny === MWID - 1) edgePath(walls, oneWay, edges.top[nx] as Edge, px, py + s, px + s, py + s, s);
          if (nx === MLEN - 1) edgePath(walls, oneWay, edges.left[ny * MLEN] as Edge, px + s, py, px + s, py + s, s);
        }
        const k = info[cells[i]];
        if (!k) continue;
        if (shown.has('push')) {
          if (k.pull.x || k.pull.y) {
            chevron(g, px, py, s, k, phase);
            moving = true;
          }
        }
        for (const kind of ['touch', 'pickup', 'timed'] as const) if (shown.has(kind) && k[kind]) badge(g, kind, px, py, s);
      }
    const thin = s < 10;
    g.lineCap = 'square';
    for (const [path, color] of [
      [walls, COLOR.wall],
      [oneWay, COLOR.oneWay],
    ] as const) {
      g.lineWidth = thin ? 3 : 5;
      g.strokeStyle = '#000';
      g.stroke(path);
      g.lineWidth = thin ? 1 : 2.5;
      g.strokeStyle = color;
      g.stroke(path);
    }
    g.lineCap = 'butt';
    return moving && !reduced?.matches;
  }

  function tick(now: number): void {
    anim = 0;
    if (!host.canvas.isConnected) return;
    if (now - last >= 50) {
      last = now;
      if (!draw(now)) return;
      host.frame();
    }
    anim = requestAnimationFrame(tick);
  }

  function redraw(): void {
    const moving = draw();
    if (moving && !anim) anim = requestAnimationFrame(tick);
  }

  return {
    shown: (kind: MarkKind) => shown.has(kind),
    any: () => shown.size > 0,
    set(kind: MarkKind, on: boolean): void {
      if (on) shown.add(kind);
      else shown.delete(kind);
      redraw();
    },
    /** The map or its blocks changed: work out each block's behavior and the edges again. */
    refresh(): void {
      dirty = true;
      redraw();
    },
    redraw,
    dispose(): void {
      cancelAnimationFrame(anim);
      anim = 0;
    },
  };
}

/** A small picture of one kind of mark for the legend, drawn the way the map draws it. */
export function markSample(kind: MarkKind, size = 24): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.setAttribute('aria-hidden', 'true');
  const g = c.getContext('2d')!;
  g.fillStyle = '#556';
  g.fillRect(0, 0, size, size);
  const s = size;
  if (kind === 'barriers') {
    const walls = new Path2D(),
      oneWay = new Path2D();
    edgePath(walls, oneWay, Edge.Wall, 3, 3, 3, s - 3, 32);
    edgePath(walls, oneWay, Edge.IntoSecond, 9, s * 0.45, s - 2, s * 0.45, 32);
    for (const [path, color] of [
      [walls, COLOR.wall],
      [oneWay, COLOR.oneWay],
    ] as const) {
      g.lineWidth = 4;
      g.strokeStyle = '#000';
      g.stroke(path);
      g.lineWidth = 2;
      g.strokeStyle = color;
      g.stroke(path);
    }
  } else if (kind === 'push') {
    chevron(g, 0, 0, s, { solid: 0, pull: { x: 0, y: 1 }, cancels: [], touch: false, pickup: false, timed: false }, 0.5);
  } else badgeAt(g, kind, s / 2, s / 2, s * 0.36, 1.5);
  return c;
}
