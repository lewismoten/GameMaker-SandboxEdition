// Coordinates for the map editor's repeating viewport; native maps remain one 100×100 tile.
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Cell } from './tools/cellOps';

/** Positive remainder, including coordinates just across the left or upper seam. */
export function wrapValue(value: number, period: number): number {
  return ((value % period) + period) % period;
}

export function nativeCell(cell: Cell): Cell {
  return { x: wrapValue(cell.x, MLEN), y: wrapValue(cell.y, MWID) };
}

/** The nearest copy of a cell to the previous gesture point, bounded to one map per axis. */
export function continueWrappedCell(cell: Cell, previous: Cell, start = previous): Cell {
  const near = (v: number, last: number, first: number, size: number) => {
    const next = last + wrapValue(v - last + size / 2, size) - size / 2;
    return Math.max(first - size + 1, Math.min(first + size - 1, next));
  };
  return { x: near(cell.x, previous.x, start.x, MLEN), y: near(cell.y, previous.y, start.y, MWID) };
}

/** A native point's visible copy nearest the viewport's center (in pixels). */
export function visibleCopy(value: number, scroll: number, period: number, viewport: number): number {
  return viewport / 2 + wrapValue(value - scroll - viewport / 2 + period / 2, period) - period / 2;
}

/** Tile origins covering a viewport, even when several complete maps fit on screen. */
export function tileOrigins(scroll: number, period: number, viewport: number): number[] {
  const origins: number[] = [];
  for (let at = 0 - wrapValue(scroll, period); at < viewport; at += period) origins.push(at);
  return origins;
}
