// How the game boxes stand on the two wall shelves (shelf.ts): which boxes go on which shelf,
// and how big they are drawn. A spine is 2" wide and a box face 7.5" (by 9.25" tall); --shelf-u
// is pixels to the inch. Any one box may stand face out, on either shelf, so each shelf must
// hold its boxes with one of them face out.

/** Pixels between the boxes (shelf.css: the gap), and a face-out box's margins. */
const GAP_PX = 2;
const FACE_MARGIN_PX = 6;
/** Inches: a spine's width, and a face-out box's. */
const SPINE_IN = 2;
const FACE_IN = 7.5;
/** The biggest the boxes are drawn: the two shelves must fit between the poster and the desk. */
export const MAX_U = 9;
const MIN_U = 4;

/** How many boxes a shelf `width` pixels long holds with one of them face out. */
export function shelfHolds(width: number, u: number): number {
  const rest = width - FACE_IN * u - FACE_MARGIN_PX;
  return rest < 0 ? 0 : 1 + Math.floor((rest + GAP_PX) / (SPINE_IN * u + GAP_PX));
}

interface ShelfLayout {
  /** Pixels to the inch. */
  u: number;
  /** How many boxes stand on each shelf, top shelf first; the boxes go on in order. */
  rows: number[];
}

/**
 * Lays `n` boxes out on shelves `widths` pixels long (top first): the top ones filled first,
 * the boxes as big as fits (up to MAX_U).
 */
export function shelfLayout(n: number, widths: readonly number[]): ShelfLayout {
  for (let u = MAX_U; u >= MIN_U; u -= 0.25) {
    const holds = widths.map((w) => shelfHolds(w, u));
    if (holds.reduce((a, b) => a + b, 0) < n) continue;
    let left = n;
    const rows = holds.map((h) => {
      const k = Math.min(h, left);
      left -= k;
      return k;
    });
    // don't leave the last shelf bare while the one above it is crammed full: even them out
    for (let i = rows.length - 1; i > 0; i--)
      while (rows[i] < rows[i - 1] - 1 && rows[i] < holds[i] && rows[i - 1] > 1 && rows[i] < Math.ceil(n / rows.length)) {
        rows[i - 1]--;
        rows[i]++;
      }
    return { u, rows };
  }
  // more boxes than ever fit: squeeze them all onto the shelves at the smallest size
  const per = Math.ceil(n / widths.length);
  return { u: MIN_U, rows: widths.map((_, i) => Math.max(0, Math.min(per, n - i * per))) };
}
