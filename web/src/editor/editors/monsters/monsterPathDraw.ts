// Drawing the monster path editor's map: the scene's blocks around the start (mapLayerCanvas),
// a faint grid, the attack range, the path's stretches as arrows (and the dashed one where
// the next lap goes), the start or the character, each corner with the picture the monster
// shows on the way there, and the monster walking it. monsterPathEditor.ts keeps the state
// and redraws with drawPathScene when something changed.
import { MLEN, MWID, type GameMap } from '../../../formats/map';
import { BLEN } from '../../../formats/blocks';
import type { Corner, PathKind, PathWalker } from './monsterPath';
import { CELL, SCALE } from './monsterPathView';

/** The part of the map shown, in blocks from the start (or the character). */
export interface ViewRect {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

/** Everything a frame of the map shows. */
export interface PathScene {
  view: ViewRect;
  /** The map's blocks for this view (mapLayerCanvas). */
  mapLayer: HTMLCanvasElement;
  kind: PathKind;
  /** An attack path for a monster that never attacks: the map is dimmed, nothing drawn on it. */
  disabled: boolean;
  corners: Corner[];
  /** The selected corner's march index, or -1. */
  selected: number;
  /** The selected corner's marching-ants offset. */
  ants: number;
  /** The block under the pointer. */
  hover?: { x: number; y: number };
  walker?: PathWalker;
  /** The start block on the map. */
  start: { x: number; y: number };
  /** The monster's first picture (drawn on each corner), and the one it shows as it walks; -1 for none. */
  firstPic: number;
  walkerPic: number;
  /** A monster block turned or mirrored, or undefined when there is no such block. */
  sprite(pic: number, orient: number): HTMLCanvasElement | undefined;
}

export function mapLayerCanvas(b: ViewRect, map: GameMap | undefined, mapImgs: HTMLCanvasElement[], start: { x: number; y: number }): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = b.w * BLEN;
  c.height = b.h * BLEN;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  if (map && mapImgs.length) {
    for (let cy = 0; cy < b.h; cy++)
      for (let cx = 0; cx < b.w; cx++) {
        const mx = (((start.x + b.x0 + cx) % MLEN) + MLEN) % MLEN;
        const my = (((start.y + b.y0 + cy) % MWID) + MWID) % MWID;
        const img = mapImgs[map.blocks[my * MLEN + mx]];
        if (img) g.drawImage(img, cx * BLEN, cy * BLEN);
      }
  } else {
    g.fillStyle = '#0a0a2a';
    g.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [8, 8] : []);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len > CELL * 0.6) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(mx + Math.cos(a) * 9, my + Math.sin(a) * 9);
    ctx.lineTo(mx + Math.cos(a + 2.5) * 10, my + Math.sin(a + 2.5) * 10);
    ctx.lineTo(mx + Math.cos(a - 2.5) * 10, my + Math.sin(a - 2.5) * 10);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();
  }
  ctx.restore();
}

export function badge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bgc: string, fg = '#000'): void {
  ctx.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace';
  const w = Math.max(16, ctx.measureText(text).width + 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, y - 1, w + 2, 18);
  ctx.fillStyle = bgc;
  ctx.fillRect(x, y, w, 16);
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 8.5);
}

export function drawPathScene(ctx: CanvasRenderingContext2D, s: PathScene): void {
  const { canvas } = ctx;
  const b = s.view;
  const cx = (x: number) => (x - b.x0) * CELL + CELL / 2;
  const cy = (y: number) => (y - b.y0) * CELL + CELL / 2;
  if (canvas.width !== b.w * CELL) canvas.width = b.w * CELL;
  if (canvas.height !== b.h * CELL) canvas.height = b.h * CELL;
  canvas.style.aspectRatio = `${b.w} / ${b.h}`;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s.mapLayer, 0, 0, canvas.width, canvas.height);
  const k = s.kind;

  // Faint grid so corners clearly snap to blocks.
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < b.w; i++) (ctx.moveTo(i * CELL + 0.5, 0), ctx.lineTo(i * CELL + 0.5, canvas.height));
  for (let i = 1; i < b.h; i++) (ctx.moveTo(0, i * CELL + 0.5), ctx.lineTo(canvas.width, i * CELL + 0.5));
  ctx.stroke();

  if (s.disabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // The 8x5-block range in which the character triggers (and keeps up) an attack.
  if (k === 'chase') {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx(-7) - CELL / 2, cy(-4) - CELL / 2, 15 * CELL, 9 * CELL);
    ctx.restore();
  }

  const list = s.corners;
  // Lines and arrows.
  let px = 0;
  let py = 0;
  list.forEach((c, n) => {
    const sel = c.i === s.selected;
    const from = n === 0 && k === 'chase' ? undefined : { x: px, y: py };
    if (from) arrow(ctx, cx(from.x), cy(from.y), cx(c.x), cy(c.y), sel ? '#00e0ff' : '#ffd400');
    px = c.x;
    py = c.y;
  });
  // Where the next lap goes: corners are measured from wherever the lap starts.
  if (list.length && k !== 'chase') {
    const lastC = list[list.length - 1];
    if (lastC.x !== 0 || lastC.y !== 0) arrow(ctx, cx(lastC.x), cy(lastC.y), cx(lastC.x + list[0].x), cy(lastC.y + list[0].y), 'rgba(255,212,0,0.55)', true);
  }

  // The origin: the start block, or the character for chase paths.
  const ox = cx(0) - CELL / 2;
  const oy = cy(0) - CELL / 2;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.strokeRect(ox + 1.5, oy + 1.5, CELL - 3, CELL - 3);
  ctx.strokeStyle = k === 'chase' ? '#ff5050' : '#40ff60';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + 2, oy + 2, CELL - 4, CELL - 4);
  badge(ctx, ox + 2, oy + CELL - 18, k === 'chase' ? '☺' : 'S', k === 'chase' ? '#ff5050' : '#40ff60');

  // Corners: the monster's picture as it heads there.
  list.forEach((c, n) => {
    const x = cx(c.x) - CELL / 2;
    const y = cy(c.y) - CELL / 2;
    const pic = s.sprite(s.firstPic, c.orient);
    ctx.fillStyle = c.i === s.selected ? 'rgba(0,224,255,0.25)' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, CELL, CELL);
    ctx.globalAlpha = c.i === s.selected ? 0.95 : 0.7;
    if (pic) ctx.drawImage(pic, x, y, CELL, CELL);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.lineWidth = 2;
    if (c.i === s.selected) {
      ctx.setLineDash([5, 3]);
      ctx.lineDashOffset = -s.ants;
      ctx.strokeStyle = '#00e0ff';
    } else ctx.strokeStyle = 'rgba(255,212,0,0.9)';
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.restore();
    badge(ctx, x + 1, y + 1, String(n + 1), c.i === s.selected ? '#00e0ff' : '#ffd400');
  });

  if (s.hover) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx(s.hover.x) - CELL / 2 + 0.5, cy(s.hover.y) - CELL / 2 + 0.5, CELL - 1, CELL - 1);
  }

  // The walking monster.
  const { walker, start } = s;
  if (walker && list.length) {
    const pic = s.sprite(s.walkerPic, walker.orient);
    const wx = (walker.bx - start.x - b.x0) * CELL + walker.px * SCALE;
    const wy = (walker.by - start.y - b.y0) * CELL + walker.py * SCALE;
    if (pic) ctx.drawImage(pic, wx, wy, CELL, CELL);
  }
}
