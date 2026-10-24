// The map's overlay canvas: grid lines, found blocks, the level check's heat map and marks, the
// selection and the ghost of what a click will place.
import { BLEN } from '../../../../formats/blocks';
import { MLEN, MWID } from '../../../../formats/map';
import type { CellRect } from './cellOps';

export interface OverlayState {
  grid: boolean;
  /** Cell indexes to highlight (Find). */
  found: number[];
  selection?: CellRect;
  /** What a click places: blocks per cell (-1 leaves it), at (x, y). */
  ghost?: { x: number; y: number; rows: number[][]; ok: boolean };
  /** A rectangle or line being dragged out. */
  outline?: { cells?: { x: number; y: number }[]; rect?: CellRect };
  /** The level check's heat map: a step of HEAT_COLORS per cell (0 = never reached). */
  heat?: Uint8Array;
  /** The level check's marks: stuck areas, deaths, a finding's cells, and the one in focus. */
  marks?: { cell: number; kind: 'stuck' | 'death' | 'finding' | 'focus' }[];
}

/** The heat map's steps, least visited to most: viridis, readable with any color vision. */
export const HEAT_COLORS = ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'];

function drawCheck(g: CanvasRenderingContext2D, s: number, st: OverlayState): void {
  if (st.heat) {
    g.globalAlpha = 0.55;
    for (let i = 0; i < st.heat.length; i++) {
      const v = st.heat[i];
      if (!v) continue;
      g.fillStyle = HEAT_COLORS[Math.min(HEAT_COLORS.length, v) - 1];
      g.fillRect((i % MLEN) * s, Math.floor(i / MLEN) * s, s, s);
    }
    g.globalAlpha = 1;
  }
  for (const m of st.marks ?? []) {
    const x = (m.cell % MLEN) * s;
    const y = Math.floor(m.cell / MLEN) * s;
    g.lineWidth = Math.max(1, s / 10);
    if (m.kind === 'stuck') {
      // red-orange hatching: stands out from every heat color
      g.strokeStyle = '#ff3b1f';
      g.beginPath();
      for (let k = -s; k < s; k += Math.max(3, s / 4)) {
        g.moveTo(x + Math.max(0, k), y + Math.max(0, -k));
        g.lineTo(x + Math.min(s, s + k), y + Math.min(s, s - k));
      }
      g.stroke();
      g.strokeRect(x + 1, y + 1, s - 2, s - 2);
    } else if (m.kind === 'death') {
      for (const [c, w] of [
        ['#000', 3],
        ['#fff', 1.5],
      ] as const) {
        g.strokeStyle = c;
        g.lineWidth = w * Math.max(1, s / 20);
        g.beginPath();
        g.moveTo(x + s * 0.25, y + s * 0.25);
        g.lineTo(x + s * 0.75, y + s * 0.75);
        g.moveTo(x + s * 0.75, y + s * 0.25);
        g.lineTo(x + s * 0.25, y + s * 0.75);
        g.stroke();
      }
    } else if (m.kind === 'finding') {
      g.strokeStyle = '#00e0ff';
      g.beginPath();
      g.arc(x + s / 2, y + s / 2, s * 0.45, 0, Math.PI * 2);
      g.stroke();
    } else dashed(g, x - s, y - s, s * 3, s * 3, '#ffd400');
  }
}

/** Draws the overlay; `imgs` are the background blocks' pictures. */
export function drawOverlay(c: HTMLCanvasElement, zoom: number, st: OverlayState, imgs: HTMLCanvasElement[]): void {
  const s = BLEN * zoom;
  if (c.width !== MLEN * s) c.width = MLEN * s;
  if (c.height !== MWID * s) c.height = MWID * s;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, c.width, c.height);
  g.imageSmoothingEnabled = false;
  if (st.grid) {
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 1; i < MLEN; i++) g.fillRect(i * s, 0, 1, c.height);
    for (let i = 1; i < MWID; i++) g.fillRect(0, i * s, c.width, 1);
    g.fillStyle = 'rgba(255,212,0,0.6)'; // every 10 blocks, to count by
    for (let i = 10; i < MLEN; i += 10) g.fillRect(i * s, 0, 1, c.height);
    for (let i = 10; i < MWID; i += 10) g.fillRect(0, i * s, c.width, 1);
  }
  drawCheck(g, s, st);
  if (st.found.length) {
    g.lineWidth = 2;
    g.strokeStyle = '#ff2bd6';
    g.fillStyle = 'rgba(255,43,214,0.25)';
    for (const i of st.found) {
      const x = (i % MLEN) * s,
        y = Math.floor(i / MLEN) * s;
      g.fillRect(x, y, s, s);
      g.strokeRect(x + 1, y + 1, s - 2, s - 2);
    }
  }
  if (st.ghost) {
    const { x, y, rows, ok } = st.ghost;
    g.globalAlpha = 0.7;
    rows.forEach((row, dy) => row.forEach((v, dx) => v >= 0 && imgs[v] && g.drawImage(imgs[v], (x + dx) * s, (y + dy) * s, s, s)));
    g.globalAlpha = 1;
    dashed(g, x * s, y * s, (rows[0]?.length ?? 0) * s, rows.length * s, ok ? '#fff' : '#f44');
  }
  if (st.outline?.rect) {
    const r = st.outline.rect;
    dashed(g, r.x * s, r.y * s, r.w * s, r.h * s, '#fff');
  }
  if (st.outline?.cells) {
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (const p of st.outline.cells) g.fillRect(p.x * s, p.y * s, s, s);
  }
  if (st.selection) {
    const r = st.selection;
    dashed(g, r.x * s, r.y * s, r.w * s, r.h * s, '#00e0ff');
  }
}

function dashed(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  g.lineWidth = 2;
  g.setLineDash([6, 4]);
  g.strokeStyle = '#000';
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.lineDashOffset = 5;
  g.strokeStyle = color;
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.setLineDash([]);
  g.lineDashOffset = 0;
}
