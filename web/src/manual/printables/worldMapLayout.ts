// The arithmetic behind the fold-out World Map (worldMap.ts): the Game Integrator's
// auto-arrangement squeezed or spread to printed cards in inches, where arrows leave a
// card, and how a map too big for one sheet of paper splits into pages to tape together.
import type { Point } from '../../formats/game';
import { CARD_UNITS } from '../../editor/editors/integrator/layoutCells';

/** The map's unit is a tenth of an inch. A card's cell (card plus the gap round it). */
export const CELL = { w: 23, h: 19 };
/** A card inside its cell, the rest is room for arrows. */
export const CARD = { w: 18, h: 16 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Integrator positions (the .GAM's world units) to card rectangles in map units, with the
 * closest two cards one cell apart: a spread-out layout is drawn tighter, a crowded one
 * (more scenes than the DOS world holds) is spread so no card covers another.
 */
export function cardRects(pos: Map<number, Point>, origin: Point = { x: 0, y: 0 }): Map<number, Rect> {
  const ids = [...pos.keys()];
  if (!ids.length) return new Map();
  let k = Infinity;
  for (let a = 0; a < ids.length; a++)
    for (let b = a + 1; b < ids.length; b++) {
      const p = pos.get(ids[a])!;
      const q = pos.get(ids[b])!;
      k = Math.min(k, Math.max(Math.abs(p.x - q.x) / CARD_UNITS.w, Math.abs(p.y - q.y) / CARD_UNITS.h));
    }
  if (!isFinite(k) || k <= 0) k = 1;
  const x0 = Math.min(...ids.map((i) => pos.get(i)!.x));
  const y0 = Math.min(...ids.map((i) => pos.get(i)!.y));
  const out = new Map<number, Rect>();
  for (const i of ids) {
    const p = pos.get(i)!;
    const cx = origin.x + ((p.x - x0) / CARD_UNITS.w / k) * CELL.w;
    const cy = origin.y + ((p.y - y0) / CARD_UNITS.h / k) * CELL.h;
    out.set(i, { x: cx + (CELL.w - CARD.w) / 2, y: cy + (CELL.h - CARD.h) / 2, w: CARD.w, h: CARD.h });
  }
  return out;
}

/** The box round every card. */
export function bounds(rects: Iterable<Rect>): Rect {
  const rs = [...rects];
  if (!rs.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
}

/** Where a line from the middle of `r` toward `to` leaves it, `pad` outside its edge. */
export function edgePoint(r: Rect, to: Point, pad = 0.6): Point {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = to.x - cx;
  const dy = to.y - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min(Math.abs((r.w / 2 + pad) / (dx || 1e-9)), Math.abs((r.h / 2 + pad) / (dy || 1e-9)));
  return { x: cx + dx * Math.min(1, t), y: cy + dy * Math.min(1, t) };
}

export interface Tile extends Rect {
  /** "A1": letters across, numbers down, like a road atlas. */
  name: string;
  col: number;
  row: number;
}

/**
 * Pages to print a `w` x `h` map at full size: each shows `pageW` x `pageH` of it, and
 * neighbors overlap by `overlap` so they can be trimmed and taped. One page when it fits.
 */
export function tiles(w: number, h: number, pageW: number, pageH: number, overlap: number): Tile[] {
  const step = (len: number, page: number) => (len <= page ? 1 : Math.ceil((len - overlap) / (page - overlap)));
  const cols = step(w, pageW);
  const rows = step(h, pageH);
  const out: Tile[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        name: `${String.fromCharCode(65 + c)}${r + 1}`,
        col: c,
        row: r,
        x: c * (pageW - overlap),
        y: r * (pageH - overlap),
        w: pageW,
        h: pageH,
      });
  return out;
}

/** Fold lines: the sheet folded in panels about `panel` wide and tall. */
export function folds(len: number, panel: number): number[] {
  const n = Math.max(1, Math.round(len / panel));
  return Array.from({ length: n - 1 }, (_, i) => ((i + 1) * len) / n);
}
