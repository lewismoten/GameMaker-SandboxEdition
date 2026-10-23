// The map's overlay canvas: grid lines, found blocks, the selection and the ghost of what a click will place.
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
