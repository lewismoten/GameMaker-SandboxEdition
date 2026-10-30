// Polygon selections reuse map line/flood helpers: closed pixel edges keep the outside flood out.
import { wrapValue } from '../mapWrap';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { floodCells, lineCells, rectCells, type Cell, type CellRect } from './cellOps';
import { captureStamp } from './stamps';

export interface MapSelection extends CellRect {
  /** Coordinates may continue through the map seam; captured pixels still read native cells. */
  wrap?: boolean;
  /** Polygon cells in map coordinates; absent for a rectangular selection. */
  cells?: Cell[];
}

export function selectionCells(area: MapSelection): Cell[] {
  return area.cells ?? rectCells(area);
}

/** Captured masks leave unselected cells at -1, which existing stamps/paste skip. */
export function captureSelection(blocks: Uint8Array, area: MapSelection, mapWidth = MLEN): { w: number; h: number; cells: number[] } {
  if (area.wrap) {
    const cells = Array<number>(area.w * area.h).fill(-1);
    const mapHeight = blocks.length / mapWidth;
    for (const cell of selectionCells(area))
      cells[(cell.y - area.y) * area.w + cell.x - area.x] = blocks[wrapValue(cell.y, mapHeight) * mapWidth + wrapValue(cell.x, mapWidth)];
    return { w: area.w, h: area.h, cells };
  }
  if (!area.cells) return captureStamp(blocks, area, mapWidth);
  const cells = Array<number>(area.w * area.h).fill(-1);
  for (const cell of area.cells) cells[(cell.y - area.y) * area.w + cell.x - area.x] = blocks[cell.y * mapWidth + cell.x];
  return { w: area.w, h: area.h, cells };
}

/** Cell-center corners, with their boundary cells included; invalid flat polygons have no selection. */
export function polygonSelection(vertices: readonly Cell[], width = MLEN, height = MWID): MapSelection | undefined {
  const points: Cell[] = [];
  for (const vertex of vertices) {
    if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y)) return undefined;
    const point = { x: Math.max(0, Math.min(width - 1, Math.round(vertex.x))), y: Math.max(0, Math.min(height - 1, Math.round(vertex.y))) };
    const last = points.at(-1);
    if (!last || last.x !== point.x || last.y !== point.y) points.push(point);
  }
  if (points.length > 1 && points[0].x === points.at(-1)!.x && points[0].y === points.at(-1)!.y) points.pop();
  if (points.length < 3) return undefined;
  let area = 0;
  let x = width,
    y = height,
    right = 0,
    bottom = 0;
  points.forEach((point, i) => {
    const next = points[(i + 1) % points.length];
    area += point.x * next.y - next.x * point.y;
    x = Math.min(x, point.x);
    y = Math.min(y, point.y);
    right = Math.max(right, point.x);
    bottom = Math.max(bottom, point.y);
  });
  if (!area) return undefined;
  const w = right - x + 1,
    h = bottom - y + 1,
    stride = w + 2;
  const grid = new Uint8Array(stride * (h + 2));
  points.forEach((point, i) => {
    for (const edge of lineCells(point, points[(i + 1) % points.length])) grid[(edge.y - y + 1) * stride + edge.x - x + 1] = 1;
  });
  for (const outside of floodCells(grid, { x: 0, y: 0 }, stride, h + 2)) grid[outside.y * stride + outside.x] = 2;
  const cells: Cell[] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (grid[(dy + 1) * stride + dx + 1] !== 2) cells.push({ x: x + dx, y: y + dy });
  return { x, y, w, h, cells };
}
