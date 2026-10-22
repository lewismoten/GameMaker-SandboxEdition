// Mug sizes and sublimation paper: the printable wrap of common blank mugs (as sublimation
// blank makers give them), where the pictures go on a wrap (one on the front, the same on the
// back), the paper sizes, and how an order of wraps is laid out over as many pages as it needs.

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

export const MUG_SIZES: MugSize[] = [
  { id: '11oz', name: '11 oz mug', wrapW: 8.5, wrapH: 3.5, diameter: 3.2, height: 3.8, handle: true },
  { id: '15oz', name: '15 oz mug', wrapW: 8.5, wrapH: 4, diameter: 3.4, height: 4.5, handle: true },
  { id: '12oz', name: '12 oz camp mug', wrapW: 8.5, wrapH: 3, diameter: 3.5, height: 3.3, handle: true },
  { id: '20oz', name: '20 oz skinny tumbler', wrapW: 9.3, wrapH: 8.2, diameter: 2.9, height: 8.3, handle: false },
];

export interface Paper {
  id: string;
  name: string;
  w: number;
  h: number;
}

export const PAPERS: Paper[] = [
  { id: 'letter', name: 'Letter (8.5 × 11 in)', w: 8.5, h: 11 },
  { id: 'a4', name: 'A4 (210 × 297 mm)', w: 210 / 25.4, h: 297 / 25.4 },
];

/** What a sublimation printer can't print at the paper's edge, inches. */
export const MARGIN = 0.125;
/** Room between wraps for cutting and the size label, inches. */
export const GAP = 0.3;

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

export interface Packed<T> {
  item: T;
  /** Top-left of the wrap on the page, inches. */
  x: number;
  y: number;
  /** Turned a quarter turn to fit the page. */
  rotated: boolean;
}

export interface PackedSheets<T> {
  pageW: number;
  pageH: number;
  landscape: boolean;
  pages: Packed<T>[][];
}

/**
 * Lays out wraps of any sizes over as few pages as it can: every page the same way round
 * (so the printer takes them all in one go) and every wrap turned the same way; rows of
 * wraps, tallest first, each page's wraps centered. Undefined when some wrap fits on no page.
 */
export function packWraps<T>(
  paper: Paper,
  items: T[],
  sizeOf: (item: T) => Pick<MugSize, 'wrapW' | 'wrapH'>,
  margin = MARGIN,
  gap = GAP,
): PackedSheets<T> | undefined {
  let best: PackedSheets<T> | undefined;
  for (const landscape of [true, false])
    for (const rotated of [false, true]) {
      const pageW = landscape ? Math.max(paper.w, paper.h) : Math.min(paper.w, paper.h);
      const pageH = landscape ? Math.min(paper.w, paper.h) : Math.max(paper.w, paper.h);
      const dims = (it: T) => {
        const s = sizeOf(it);
        return rotated ? { w: s.wrapH, h: s.wrapW } : { w: s.wrapW, h: s.wrapH };
      };
      const roomW = pageW - 2 * margin + 1e-9;
      const roomH = pageH - 2 * margin + 1e-9;
      if (items.some((it) => dims(it).w > roomW || dims(it).h > roomH)) continue;
      // tallest first, keeping the order within the same size
      const order = items.map((item, i) => ({ item, i, ...dims(item) })).sort((a, b) => b.h - a.h || b.w - a.w || a.i - b.i);
      const pages: { item: T; x: number; y: number; w: number; h: number }[][] = [];
      let page: (typeof pages)[number] = [];
      let x = 0;
      let y = 0;
      let rowH = 0;
      for (const o of order) {
        if (x > 0 && x + o.w > roomW) ((y += rowH + gap), (x = 0), (rowH = 0));
        if (y + o.h > roomH) (pages.push(page), (page = []), (x = 0), (y = 0), (rowH = 0));
        page.push({ item: o.item, x, y, w: o.w, h: o.h });
        x += o.w + gap;
        rowH = Math.max(rowH, o.h);
      }
      if (page.length) pages.push(page);
      if (best && pages.length >= best.pages.length) continue;
      best = {
        pageW,
        pageH,
        landscape,
        pages: pages.map((p) => {
          const usedW = Math.max(...p.map((q) => q.x + q.w));
          const usedH = Math.max(...p.map((q) => q.y + q.h));
          const x0 = (pageW - usedW) / 2;
          const y0 = (pageH - usedH) / 2;
          return p.map((q) => ({ item: q.item, x: x0 + q.x, y: y0 + q.y, rotated }));
        }),
      };
    }
  return best;
}
