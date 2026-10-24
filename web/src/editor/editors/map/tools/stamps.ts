// Stamps (prefabs) and the map clipboard: a rectangle of blocks to place again, flipped or turned when the blocks allow.
//
// Game-Maker blocks can't be drawn mirrored, so a stamp flips only when every block in it
// has a mirror image in the same set (block 7's picture flipped is block 8's, or itself).
import type { Block } from '../../../../formats/blocks';
import { BLEN } from '../../../../formats/blocks';

export interface Stamp {
  id: string;
  name: string;
  w: number;
  h: number;
  /** Blocks row by row; -1 leaves the map's block as it is. */
  cells: number[];
}

export type Transform = 'flipH' | 'flipV' | 'rotate';

/** The blocks of a rectangle of the map, as a stamp. */
export function captureStamp(blocks: Uint8Array, r: { x: number; y: number; w: number; h: number }, mapW = 100): Omit<Stamp, 'id' | 'name'> {
  const cells: number[] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) cells.push(blocks[y * mapW + x]);
  return { w: r.w, h: r.h, cells };
}

/** A stamp's rows. */
export function stampRows(s: Pick<Stamp, 'w' | 'h' | 'cells'>): number[][] {
  return Array.from({ length: s.h }, (_, y) => s.cells.slice(y * s.w, y * s.w + s.w));
}

/** A block set's mirror tables: for each block, the block whose picture is it flipped (or turned a quarter clockwise), else -1. */
export interface Mirrors {
  flipH: number[];
  flipV: number[];
  rotate: number[];
}

function key(px: ArrayLike<number>): string {
  return Array.prototype.join.call(px, ',');
}

function remap(px: Uint8Array, at: (x: number, y: number) => number): Uint8Array {
  const out = new Uint8Array(BLEN * BLEN);
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) out[y * BLEN + x] = px[at(x, y)];
  return out;
}

export function mirrors(blocks: Block[]): Mirrors {
  const index = new Map<string, number>();
  blocks.forEach((b, i) => {
    const k = key(b.pixels);
    if (!index.has(k)) index.set(k, i);
  });
  const find = (px: Uint8Array) => index.get(key(px)) ?? -1;
  const L = BLEN - 1;
  return {
    flipH: blocks.map((b) => find(remap(b.pixels, (x, y) => y * BLEN + (L - x)))),
    flipV: blocks.map((b) => find(remap(b.pixels, (x, y) => (L - y) * BLEN + x))),
    // turned a quarter clockwise: the new (x, y) shows the old (y, L - x)
    rotate: blocks.map((b) => find(remap(b.pixels, (x, y) => (L - x) * BLEN + y))),
  };
}

/** Whether every block of a stamp has its image for this transform. */
export function canTransform(s: Pick<Stamp, 'cells'>, t: Transform, m: Mirrors): boolean {
  return s.cells.every((c) => c < 0 || (m[t][c] ?? -1) >= 0);
}

/** The stamp flipped or turned, its blocks swapped for their mirror images; undefined when a block has none. */
export function transformStamp<S extends Pick<Stamp, 'w' | 'h' | 'cells'>>(s: S, t: Transform, m: Mirrors): S | undefined {
  if (!canTransform(s, t, m)) return undefined;
  const map = (c: number) => (c < 0 ? c : m[t][c]);
  const rows = stampRows(s);
  if (t === 'flipH') return { ...s, cells: rows.flatMap((r) => [...r].reverse().map(map)) };
  if (t === 'flipV') return { ...s, cells: [...rows].reverse().flatMap((r) => r.map(map)) };
  // a quarter clockwise: the new row y is the old column y, read bottom to top
  const cells: number[] = [];
  for (let y = 0; y < s.w; y++) for (let x = 0; x < s.h; x++) cells.push(map(rows[s.h - 1 - x][y]));
  return { ...s, w: s.h, h: s.w, cells };
}
