// Terrain brushes: the edge, corner and path blocks picked from neighbors, and erasing fixing them up.
import { describe, expect, it } from 'vitest';
import { BLOB47, E, N, NE, NW, S, SE, W, newTerrain, paintTerrain, pickBlock, reduceMask, slotFor, type Terrain } from './autotile';

const W8 = 8;
const H8 = 8;
/** An edges terrain on blocks 10..22 (slot i is block 10 + i), outside block 1. */
const grass = (): Terrain => ({ ...newTerrain('g', 'Grass', 'edges', 1), tiles: Array.from({ length: 13 }, (_, i) => 10 + i) });
const road = (): Terrain => ({ ...newTerrain('r', 'Road', 'path', 1), tiles: [30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1, -1] });
const grid = (blocks: Uint8Array) => Array.from({ length: H8 }, (_, y) => [...blocks.slice(y * W8, y * W8 + W8)]);
const rect = (x0: number, y0: number, x1: number, y1: number) => {
  const out: { x: number; y: number }[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push({ x, y });
  return out;
};

describe('auto-tiling', () => {
  it('has the 47 blob shapes', () => {
    expect(BLOB47.length).toBe(47);
    expect(reduceMask(NE)).toBe(0); // a lone corner without its sides does not count
    expect(reduceMask(N | E | NE)).toBe(N | E | NE);
  });

  it('picks edges, outer corners and the fill for a painted rectangle', () => {
    const b = new Uint8Array(W8 * H8).fill(1);
    paintTerrain(b, grass(), rect(2, 2, 4, 4), false, W8, H8);
    expect(grid(b).slice(2, 5).map((r) => r.slice(2, 5))).toEqual([
      [10, 11, 12],
      [13, 14, 15],
      [16, 17, 18],
    ]);
    expect(b[0]).toBe(1); // the ground round it stays
  });

  it('picks an inner corner where a notch is cut out', () => {
    const b = new Uint8Array(W8 * H8).fill(1);
    const t = grass();
    paintTerrain(b, t, rect(1, 1, 5, 5), false, W8, H8);
    paintTerrain(b, t, [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], true, W8, H8); // erase the top-left 2×2
    expect(b[3 * W8 + 3]).toBe(10 + 9); // gap at its top-left
    expect(b[1 * W8 + 3]).toBe(10); // the new top-left corner
    expect(b[1 * W8 + 1]).toBe(1); // erased to the ground
  });

  it('counts off the map as in, so a field can run to the edge', () => {
    const b = new Uint8Array(W8 * H8).fill(1);
    paintTerrain(b, grass(), rect(0, 0, 2, 2), false, W8, H8);
    expect(b[0]).toBe(14); // fill: nothing outside at its top or left
    expect(b[2 * W8 + 2]).toBe(18);
  });

  it('lays a path with straights and corners', () => {
    const b = new Uint8Array(W8 * H8).fill(1);
    paintTerrain(b, road(), [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }], false, W8, H8);
    expect([b[1 * W8 + 1], b[1 * W8 + 2], b[1 * W8 + 3], b[2 * W8 + 3], b[3 * W8 + 3]]).toEqual([30, 30, 34, 31, 31]);
    // erasing the corner turns its neighbors into ends (straights)
    paintTerrain(b, road(), [{ x: 3, y: 1 }], true, W8, H8);
    expect([b[1 * W8 + 2], b[1 * W8 + 3], b[2 * W8 + 3]]).toEqual([30, 1, 31]);
  });

  it('falls back when a slot is empty', () => {
    const t = grass();
    t.tiles[9] = -1; // no inner corner: the fill
    expect(pickBlock(t, 0xff & ~NW)).toBe(14);
    const blob = newTerrain('b', 'Blob', 'blob47', 0);
    const fill = BLOB47.indexOf(0xff);
    blob.tiles[fill] = 5;
    blob.tiles[BLOB47.indexOf(N | E | S | W)] = 6;
    expect(pickBlock(blob, N | E | S | W | NE)).toBe(6); // NE dropped
    expect(slotFor(blob, 0xff)).toBe(fill);
    expect(pickBlock(blob, S | SE | E)).toBe(5);
  });

  it('uses the 4-bit mask in bits16 mode', () => {
    const t: Terrain = { ...newTerrain('w', 'Wall', 'bits16', 0), tiles: Array.from({ length: 16 }, (_, i) => 40 + i) };
    expect(pickBlock(t, N | S)).toBe(40 + 5);
    expect(pickBlock(t, E | W | NE)).toBe(40 + 10);
    expect(pickBlock(t, 0)).toBe(40);
  });
});
