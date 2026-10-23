// Mug sizes and sublimation paper: the printable wrap of common blank mugs (as sublimation
// blank makers give them), the paper sizes, and where the picture goes on the desk mug's wrap
// (one on the front, the same on the back). The print page's layout is mugLayout.ts.

export interface MugSize {
  id: string;
  name: string;
  /** The printable wrap, in inches. */
  wrapW: number;
  wrapH: number;
  /** The mug body: outside diameter and height, inches (for the 3D view). */
  diameter: number;
  height: number;
  /** A tumbler has no handle. */
  handle: boolean;
}

/**
 * The blanks, checked against the makers' sublimation templates: an 11 oz mug is 3.2 in
 * across (10.05 in round) and 3.75 to 3.8 in tall, its wrap 8.5 x 3.5 in with the gap under
 * the handle; a 15 oz is 3.4 in across (10.7 in round) and 4.5 in tall, wrap 8.5 x 4 in; a
 * 12 oz enamel camp mug 3.5 in across, wrap 8.5 x 3 in; a 20 oz skinny tumbler 2.96 in across
 * and 8.3 in tall, its wrap a full 9.3 x 8.2 in round that meets itself (no handle, no gap).
 */

export const MUG_SIZES: MugSize[] = [
  { id: '11oz', name: '11 oz mug', wrapW: 8.5, wrapH: 3.5, diameter: 3.2, height: 3.8, handle: true },
  { id: '15oz', name: '15 oz mug', wrapW: 8.5, wrapH: 4, diameter: 3.4, height: 4.5, handle: true },
  { id: '12oz', name: '12 oz camp mug', wrapW: 8.5, wrapH: 3, diameter: 3.5, height: 3.3, handle: true },
  { id: '20oz', name: '20 oz skinny tumbler', wrapW: 9.3, wrapH: 8.2, diameter: 2.96, height: 8.3, handle: false },
];

export interface Paper {
  id: string;
  name: string;
  w: number;
  h: number;
}

export const PAPERS: Paper[] = [
  { id: 'letter', name: 'Letter (8.5 × 11 in)', w: 8.5, h: 11 },
  { id: 'legal', name: 'Legal (8.5 × 14 in)', w: 8.5, h: 14 },
  { id: 'a4', name: 'A4 (210 × 297 mm)', w: 210 / 25.4, h: 297 / 25.4 },
];

/** What a sublimation printer can't print at the paper's edge, inches. */
export const MARGIN = 0.125;

/** Once round the mug's outside, inches. */
export const circumference = (size: Pick<MugSize, 'diameter'>): number => Math.PI * size.diameter;

/** Where the picture goes on a wrap, inches: the same picture twice, front and back. */
export interface Placement {
  /** The picture's size. */
  w: number;
  h: number;
  /** Its top edge, and the middle of each copy across the wrap. */
  y: number;
  centers: [number, number];
}

/** Room left clear at the wrap's ends and edges, inches. */
const EDGE = 0.1;

/**
 * Places a picture `aspect` (width over height) on a wrap twice: centered a quarter turn
 * either side of the mug's front (the handle is at the wrap's ends, so the copies face the
 * one drinking and everyone across the table), as large as the mug shows at once (about
 * its diameter) and the wrap's height allow. On a wrap shorter than the mug's round the two
 * copies move in toward the middle just enough to keep clear of the ends.
 */
export function printPlacement(size: Pick<MugSize, 'wrapW' | 'wrapH' | 'diameter'>, aspect: number): Placement {
  const quarter = (Math.PI * size.diameter) / 4;
  const maxW = Math.min(size.diameter * 1.1, size.wrapW / 2 - 2 * EDGE);
  const maxH = size.wrapH * 0.9;
  let w = Math.min(maxW, maxH * aspect);
  // the copies' middles, measured from the wrap's middle, and room to their outer ends
  const d = Math.max(w / 2 + EDGE, Math.min(quarter, size.wrapW / 2 - w / 2 - EDGE));
  w = Math.min(w, 2 * (size.wrapW / 2 - d - EDGE));
  const h = w / aspect;
  return { w, h, y: (size.wrapH - h) / 2, centers: [size.wrapW / 2 - d, size.wrapW / 2 + d] };
}
