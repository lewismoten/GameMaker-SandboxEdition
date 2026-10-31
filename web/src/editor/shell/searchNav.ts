// Arrow-key moves between search result cards. Left/Right/Home/End step through the list; Up/Down go to
// the card visually above or below (nearest by horizontal center), even when the groups' grids differ.
import { gridMove } from '../widgets/rovingGrid';

export interface Box {
  left: number;
  right: number;
  top: number;
}

/** The index of the card on the next row up (-1) or down (1) nearest in x to card i, or -1 when there is none. */
export function pickVertical(boxes: Box[], i: number, dir: 1 | -1): number {
  const cur = boxes[i];
  if (!cur) return -1;
  const rows = boxes.map((b, j) => ({ b, j })).filter(({ b }) => (dir > 0 ? b.top > cur.top + 2 : b.top < cur.top - 2));
  if (!rows.length) return -1;
  const rowTop = dir > 0 ? Math.min(...rows.map(({ b }) => b.top)) : Math.max(...rows.map(({ b }) => b.top));
  const cx = (cur.left + cur.right) / 2;
  let best = -1;
  let bestDist = Infinity;
  for (const { b, j } of rows) {
    if (Math.abs(b.top - rowTop) > 2) continue;
    const d = Math.abs((b.left + b.right) / 2 - cx);
    if (d < bestDist) {
      bestDist = d;
      best = j;
    }
  }
  return best;
}

/** Where a key moves focus from card i, or -1 to ignore it. */
export function searchMove(key: string, boxes: Box[], i: number): number {
  if (key === 'ArrowDown') return pickVertical(boxes, i, 1);
  if (key === 'ArrowUp') return pickVertical(boxes, i, -1);
  return gridMove(key, i, boxes.length, 1);
}
