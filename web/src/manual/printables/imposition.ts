// Page arithmetic for a saddle-stitched booklet: sheets folded in half and stapled through
// the fold, so the page count is a multiple of four and the staples show in the center spread.

/** The page count rounded up to whole folded sheets (four pages each). */
export function bookletPageCount(pages: number): number {
  return Math.max(4, Math.ceil(pages / 4) * 4);
}

/** The two pages (0-based, cover = 0) that face each other where the staples are. */
export function centerSpread(total: number): [number, number] {
  return [total / 2 - 1, total / 2];
}

/**
 * The pages shown together in the viewer: the cover alone on the right, then (1,2), (3,4)…,
 * and the back cover alone on the left. With one page at a time, just [at].
 */
export function spreadAt(at: number, total: number, two: boolean): number[] {
  if (!two) return [Math.max(0, Math.min(total - 1, at))];
  if (at <= 0) return [0];
  const left = at % 2 === 1 ? at : at - 1;
  return left + 1 < total ? [left, left + 1] : [left];
}

/** Next/previous spread's first page. */
export function stepSpread(at: number, total: number, two: boolean, dir: 1 | -1): number {
  if (!two) return Math.max(0, Math.min(total - 1, at + dir));
  const [first] = spreadAt(at, total, true);
  if (dir > 0) return first === 0 ? 1 : Math.min(total - 1, first + 2);
  return first <= 1 ? 0 : first - 2;
}

/**
 * Printing a booklet on letter paper turned sideways, two pages to a side: which pages go on
 * the front and back of each sheet (left page first). Fold the stack and staple the fold.
 */
export function bookletSheets(total: number): { front: [number, number]; back: [number, number] }[] {
  const n = bookletPageCount(total);
  const sheets: { front: [number, number]; back: [number, number] }[] = [];
  for (let s = 0; s < n / 4; s++) sheets.push({ front: [n - 1 - 2 * s, 2 * s], back: [2 * s + 1, n - 2 - 2 * s] });
  return sheets;
}
