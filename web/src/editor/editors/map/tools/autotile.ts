// Terrain brushes (auto-tiling): which edge or corner block a cell of a terrain needs, from its neighbors.
//
// A terrain is made of blocks the game already has: a fill, its edges and corners. Painting
// marks cells as the terrain, then each terrain cell round them gets the block that fits its
// eight neighbors. Off the map counts as the terrain, so a field can run to the map's edge.
//
// Four kinds (a slot is one block of the terrain; slots left empty fall back to a near one):
// - edges: a 3×3 (fill, 4 edges, 4 outer corners) and 4 inner corners, 13 blocks;
// - blob47: one block for each of the 47 ways neighbors can meet (corners count only when both sides do);
// - bits16: one per 4-bit mask of the four sides, 16 blocks (N 1, E 2, S 4, W 8);
// - path: a road or path one block wide, straights and corners (T and cross optional).
import { MLEN, MWID } from '../../../../formats/map';

export const N = 1;
export const NE = 2;
export const E = 4;
export const SE = 8;
export const S = 16;
export const SW = 32;
export const W = 64;
export const NW = 128;

export type TerrainKind = 'edges' | 'blob47' | 'bits16' | 'path';

export interface Terrain {
  /** Stable id, for the companion file. */
  id: string;
  name: string;
  kind: TerrainKind;
  /** Block per slot (SLOTS[kind]); -1 is empty. */
  tiles: number[];
  /** The block erasing leaves (the ground round the terrain). */
  outside: number;
}

/** One slot of a terrain kind: its name and the neighbors it stands for (for the template's little diagram). */
export interface Slot {
  label: string;
  mask: number;
}

/** Keeps a diagonal only when both of its sides are in (a corner shows only then). */
export function reduceMask(m: number): number {
  let r = m & (N | E | S | W);
  if (m & NE && m & N && m & E) r |= NE;
  if (m & SE && m & S && m & E) r |= SE;
  if (m & SW && m & S && m & W) r |= SW;
  if (m & NW && m & N && m & W) r |= NW;
  return r;
}

/** The 47 distinct reduced masks, in increasing order (the blob47 slots). */
export const BLOB47: number[] = [...new Set(Array.from({ length: 256 }, (_, m) => reduceMask(m)))].sort((a, b) => a - b);

const ALL = N | NE | E | SE | S | SW | W | NW;
const sides = (m: number) => [m & N ? 'N' : '', m & E ? 'E' : '', m & S ? 'S' : '', m & W ? 'W' : ''].join('');

/** Slot lists per kind; the order is the order of `tiles`. */
export const SLOTS: Record<TerrainKind, Slot[]> = {
  edges: [
    { label: 'Top-left corner', mask: E | SE | S },
    { label: 'Top edge', mask: E | SE | S | SW | W },
    { label: 'Top-right corner', mask: S | SW | W },
    { label: 'Left edge', mask: N | NE | E | SE | S },
    { label: 'Fill (center)', mask: ALL },
    { label: 'Right edge', mask: N | S | SW | W | NW },
    { label: 'Bottom-left corner', mask: N | NE | E },
    { label: 'Bottom edge', mask: N | NE | E | W | NW },
    { label: 'Bottom-right corner', mask: N | W | NW },
    { label: 'Inner corner, gap top-left', mask: ALL & ~NW },
    { label: 'Inner corner, gap top-right', mask: ALL & ~NE },
    { label: 'Inner corner, gap bottom-left', mask: ALL & ~SW },
    { label: 'Inner corner, gap bottom-right', mask: ALL & ~SE },
  ],
  blob47: BLOB47.map((m) => ({ label: m === ALL ? 'Fill (center)' : `Joins ${sides(m) || 'nothing'}${m & (NE | SE | SW | NW) ? ' + corners' : ''}`, mask: m })),
  bits16: Array.from({ length: 16 }, (_, i) => {
    const m = (i & 1 ? N : 0) | (i & 2 ? E : 0) | (i & 4 ? S : 0) | (i & 8 ? W : 0);
    return { label: i === 15 ? 'Joins all four sides' : `Joins ${sides(m) || 'nothing'}`, mask: m };
  }),
  path: [
    { label: 'Straight across', mask: E | W },
    { label: 'Straight up and down', mask: N | S },
    { label: 'Corner, up and right', mask: N | E },
    { label: 'Corner, right and down', mask: E | S },
    { label: 'Corner, down and left', mask: S | W },
    { label: 'Corner, left and up', mask: W | N },
    { label: 'T, no top (optional)', mask: E | S | W },
    { label: 'T, no right (optional)', mask: N | S | W },
    { label: 'T, no bottom (optional)', mask: N | E | W },
    { label: 'T, no left (optional)', mask: N | E | S },
    { label: 'Crossing (optional)', mask: N | E | S | W },
    { label: 'Lone block (optional)', mask: 0 },
  ],
};

/** A new terrain of a kind, all slots empty. */
export function newTerrain(id: string, name: string, kind: TerrainKind, outside = 0): Terrain {
  return { id, name, kind, tiles: SLOTS[kind].map(() => -1), outside };
}

/** The slots a kind needs filled before it paints well. */
export function requiredSlots(kind: TerrainKind): number[] {
  if (kind === 'path') return [0, 1, 2, 3, 4, 5];
  if (kind === 'edges') return [0, 1, 2, 3, 4, 5, 6, 7, 8];
  if (kind === 'bits16') return [5, 10, 15];
  return [BLOB47.indexOf(ALL)];
}

/** Every block of the terrain (what counts as "in" it). */
export function terrainBlocks(t: Terrain): Set<number> {
  return new Set(t.tiles.filter((b) => b >= 0));
}

/** The 4-bit side mask (N 1, E 2, S 4, W 8) of an 8-bit neighbor mask. */
export function sideBits(m: number): number {
  return (m & N ? 1 : 0) | (m & E ? 2 : 0) | (m & S ? 4 : 0) | (m & W ? 8 : 0);
}

const has = (t: Terrain, slot: number) => slot >= 0 && (t.tiles[slot] ?? -1) >= 0;

/** The slot of an edges terrain for a neighbor mask. */
function edgesSlot(m: number): number {
  const n = !!(m & N), e = !!(m & E), s = !!(m & S), w = !!(m & W);
  if ((!n && !s) || (!e && !w)) return 4; // one block thin: no edge fits, the fill does
  if (!n) return !w ? 0 : !e ? 2 : 1;
  if (!s) return !w ? 6 : !e ? 8 : 7;
  if (!w) return 3;
  if (!e) return 5;
  if (!(m & NW)) return 9;
  if (!(m & NE)) return 10;
  if (!(m & SW)) return 11;
  if (!(m & SE)) return 12;
  return 4;
}

/** The slot of a path for a side mask (bits as sideBits), falling back to what is there. */
function pathSlot(t: Terrain, bits: number): number {
  const n = bits & 1, e = bits & 2, s = bits & 4, w = bits & 8;
  const count = (n ? 1 : 0) + (e ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0);
  const straight = (vertical: boolean) => (vertical ? 1 : 0);
  if (count === 4) return has(t, 10) ? 10 : has(t, 6) ? 6 : 0;
  if (count === 3) {
    const tee = !n ? 6 : !e ? 7 : !s ? 8 : 9;
    if (has(t, tee)) return tee;
    if (has(t, 10)) return 10;
    return straight(!!(n && s)); // the through-road
  }
  if (count === 2) {
    if (n && s) return 1;
    if (e && w) return 0;
    return n && e ? 2 : e && s ? 3 : s && w ? 4 : 5;
  }
  if (count === 1) return straight(!!(n || s));
  return has(t, 11) ? 11 : 0;
}

/** The slot a terrain cell takes, from its 8-bit neighbor mask, falling back to a filled slot. */
export function slotFor(t: Terrain, mask: number): number {
  const m = reduceMask(mask);
  if (t.kind === 'path') return pathSlot(t, sideBits(m));
  if (t.kind === 'bits16') {
    const b = sideBits(m);
    return has(t, b) ? b : has(t, 15) ? 15 : t.tiles.findIndex((x) => x >= 0);
  }
  if (t.kind === 'edges') {
    const s = edgesSlot(m);
    return has(t, s) ? s : 4;
  }
  // blob47: the exact one, else drop corners one by one, else the fill
  const exact = BLOB47.indexOf(m);
  if (has(t, exact)) return exact;
  for (const d of [NE, SE, SW, NW]) {
    const i = BLOB47.indexOf(m & ~d);
    if (has(t, i)) return i;
  }
  const i = BLOB47.indexOf(m & (N | E | S | W));
  return has(t, i) ? i : BLOB47.indexOf(ALL);
}

/** The block a terrain cell takes for a neighbor mask; the fill (or first block) when its slot is empty. */
export function pickBlock(t: Terrain, mask: number): number {
  const s = slotFor(t, mask);
  if (has(t, s)) return t.tiles[s];
  const fill = t.kind === 'edges' ? 4 : t.kind === 'blob47' ? BLOB47.indexOf(ALL) : t.kind === 'bits16' ? 15 : 0;
  return has(t, fill) ? t.tiles[fill] : (t.tiles.find((b) => b >= 0) ?? t.outside);
}

/** The 8-bit neighbor mask of a cell: which neighbors are in (off the map counts as in). */
export function neighborMask(isIn: (x: number, y: number) => boolean, x: number, y: number, w = MLEN, h = MWID): number {
  const at = (dx: number, dy: number) => {
    const nx = x + dx, ny = y + dy;
    return nx < 0 || ny < 0 || nx >= w || ny >= h || isIn(nx, ny);
  };
  return (at(0, -1) ? N : 0) | (at(1, -1) ? NE : 0) | (at(1, 0) ? E : 0) | (at(1, 1) ? SE : 0) | (at(0, 1) ? S : 0) | (at(-1, 1) ? SW : 0) | (at(-1, 0) ? W : 0) | (at(-1, -1) ? NW : 0);
}

/**
 * Paints (or erases, leaving t.outside) a terrain on cells of a map, then gives every
 * terrain cell round them the block that fits. Paths do not count off-map cells as in
 * (a road at the edge ends there). Returns the indexes of the cells that changed.
 */
export function paintTerrain(blocks: Uint8Array, t: Terrain, cells: { x: number; y: number }[], erase = false, w = MLEN, h = MWID): number[] {
  const set = terrainBlocks(t);
  if (!set.size) return [];
  const before = new Map<number, number>();
  const touch = (i: number, v: number) => {
    if (!before.has(i)) before.set(i, blocks[i]);
    blocks[i] = v;
  };
  const marker = pickBlock(t, 0xff); // any block of the terrain marks a cell as in
  const fix = new Set<number>();
  for (const { x, y } of cells) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    touch(y * w + x, erase ? t.outside : marker);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) fix.add(ny * w + nx);
      }
  }
  const isIn = (x: number, y: number) => set.has(blocks[y * w + x]);
  const edgeIn = t.kind !== 'path';
  for (const i of fix) {
    if (!set.has(blocks[i])) continue;
    const x = i % w, y = (i / w) | 0;
    const m = neighborMask(isIn, x, y, w, h);
    const v = pickBlock(t, edgeIn ? m : maskInMap(m, x, y, w, h));
    if (blocks[i] !== v) touch(i, v);
  }
  return [...before].filter(([i, v]) => blocks[i] !== v).map(([i]) => i);
}

/** A mask without its off-map neighbors. */
function maskInMap(m: number, x: number, y: number, w: number, h: number): number {
  let r = m;
  if (y === 0) r &= ~(N | NE | NW);
  if (y === h - 1) r &= ~(S | SE | SW);
  if (x === 0) r &= ~(W | NW | SW);
  if (x === w - 1) r &= ~(E | NE | SE);
  return r;
}
