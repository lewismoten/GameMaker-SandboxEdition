// Map cell helpers for the everyday tools: lines, rectangles, flood fill areas, find and replace.
import { MLEN, MWID } from '../../../../formats/map';

export interface Cell {
  x: number;
  y: number;
}

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The rectangle two corners span (either order). */
export function spanRect(a: Cell, b: Cell): CellRect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
}

/** Every cell of a rectangle, or only its border when `outline`. */
export function rectCells(r: CellRect, outline = false): Cell[] {
  const out: Cell[] = [];
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) if (!outline || x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1) out.push({ x, y });
  return out;
}

/** The cells of a straight line from a to b (Bresenham), both ends included. */
export function lineCells(a: Cell, b: Cell): Cell[] {
  const out: Cell[] = [];
  let { x, y } = a;
  const dx = Math.abs(b.x - x), sx = x < b.x ? 1 : -1;
  const dy = -Math.abs(b.y - y), sy = y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    out.push({ x, y });
    if (x === b.x && y === b.y) return out;
    const e2 = 2 * err;
    if (e2 >= dy) (err += dy), (x += sx);
    if (e2 <= dx) (err += dx), (y += sy);
  }
}

/** The connected cells (4 ways) of the same block as the one at `at`. */
export function floodCells(blocks: Uint8Array, at: Cell, w = MLEN, h = MWID): Cell[] {
  const target = blocks[at.y * w + at.x];
  const seen = new Uint8Array(w * h);
  const out: Cell[] = [];
  const stack = [at.y * w + at.x];
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || blocks[i] !== target) continue;
    seen[i] = 1;
    const x = i % w, y = (i / w) | 0;
    out.push({ x, y });
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  return out;
}

/** Indexes of every cell holding a block. */
export function findBlock(blocks: Uint8Array, block: number): number[] {
  const out: number[] = [];
  blocks.forEach((b, i) => b === block && out.push(i));
  return out;
}

/** Swaps every `from` block for `to`, in place; returns how many changed. */
export function replaceAll(blocks: Uint8Array, from: number, to: number): number {
  if (from === to) return 0;
  let n = 0;
  for (let i = 0; i < blocks.length; i++)
    if (blocks[i] === from) {
      blocks[i] = to;
      n++;
    }
  return n;
}
