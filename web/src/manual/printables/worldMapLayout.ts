// The arithmetic behind printing the fold-out World Map (worldMap.ts): how a map too big for
// one sheet of paper splits into pages to tape together, and where it folds. (Where places
// and paths go is worldMapPlan.ts.)

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Tile extends Rect {
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
