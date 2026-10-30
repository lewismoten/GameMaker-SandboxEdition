// Polygon masks retain concave cut-outs through capture/paste, and share rectangle edge semantics.
import { describe, expect, it } from 'vitest';
import { captureSelection, polygonSelection, selectionCells } from './selection';
import { placeGrid } from './building';
import { stampRows } from './stamps';

const triangle = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
];

describe('polygon selections', () => {
  it('includes triangle edges and rejects missing or flat shapes', () => {
    const selected = polygonSelection(triangle, 5, 5)!;
    expect(selected).toMatchObject({ x: 1, y: 1, w: 3, h: 3 });
    expect(selected.cells).toHaveLength(6);
    expect(selected.cells).not.toContainEqual({ x: 3, y: 3 });
    expect(polygonSelection(triangle.slice(0, 2))).toBeUndefined();
    expect(
      polygonSelection([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]),
    ).toBeUndefined();
  });
  it('keeps a concave corner open rather than selecting its bounding rectangle', () => {
    const selected = polygonSelection(
      [
        { x: 1, y: 1 },
        { x: 4, y: 1 },
        { x: 4, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 1, y: 4 },
      ],
      6,
      6,
    )!;
    expect(selected.cells).toHaveLength(12);
    expect(selected.cells).not.toContainEqual({ x: 3, y: 3 });
    expect(selected.cells).toContainEqual({ x: 1, y: 4 });
  });
  it('copies only polygon cells and leaves the excluded paste destination untouched', () => {
    const source = new Uint8Array(10000).fill(7);
    const captured = captureSelection(source, polygonSelection(triangle)!);
    expect(captured.cells.filter((c) => c < 0)).toHaveLength(3);
    const target = new Uint8Array(10000).fill(2);
    placeGrid(target, stampRows(captured), 5, 5);
    expect(target[505]).toBe(7);
    expect(target[707]).toBe(2);
    expect(selectionCells({ x: 0, y: 0, w: 2, h: 2 })).toHaveLength(4);
  });
  it('clamps corners to the map and accepts a repeated closing corner', () => {
    expect(polygonSelection([...triangle, triangle[0]], 5, 5)).toEqual(polygonSelection(triangle, 5, 5));
    expect(
      polygonSelection(
        [
          { x: -2, y: -2 },
          { x: 2, y: -2 },
          { x: 2, y: 2 },
          { x: -2, y: 2 },
        ],
        5,
        5,
      )?.cells,
    ).toHaveLength(9);
  });
});
