// Mug sizes and sublimation paper: the printable wrap of common blank mugs (as sublimation
// blank makers give them), the paper sizes, and how many wraps fit on a sheet.

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

export interface Slot {
  /** Top-left of the wrap on the page, inches. */
  x: number;
  y: number;
  /** Turned a quarter turn to fit the page. */
  rotated: boolean;
}

export interface SheetLayout {
  /** The page as it goes through the printer: portrait or landscape. */
  pageW: number;
  pageH: number;
  landscape: boolean;
  slots: Slot[];
}

/**
 * Lays out as many wraps as fit on one page, trying the page both ways and the wraps both
 * ways, with the wraps centered. Undefined when not even one fits.
 */
export function layoutSheet(paper: Paper, size: Pick<MugSize, 'wrapW' | 'wrapH'>, margin = MARGIN, gap = GAP): SheetLayout | undefined {
  let best: (SheetLayout & { cols: number; rows: number }) | undefined;
  for (const landscape of [true, false])
    for (const rotated of [false, true]) {
      const pageW = landscape ? Math.max(paper.w, paper.h) : Math.min(paper.w, paper.h);
      const pageH = landscape ? Math.min(paper.w, paper.h) : Math.max(paper.w, paper.h);
      const w = rotated ? size.wrapH : size.wrapW;
      const h = rotated ? size.wrapW : size.wrapH;
      const cols = Math.floor((pageW - 2 * margin + gap + 1e-9) / (w + gap));
      const rows = Math.floor((pageH - 2 * margin + gap + 1e-9) / (h + gap));
      if (cols < 1 || rows < 1 || (best && cols * rows <= best.cols * best.rows)) continue;
      const usedW = cols * w + (cols - 1) * gap;
      const usedH = rows * h + (rows - 1) * gap;
      const x0 = (pageW - usedW) / 2;
      const y0 = (pageH - usedH) / 2;
      const slots: Slot[] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push({ x: x0 + c * (w + gap), y: y0 + r * (h + gap), rotated });
      best = { pageW, pageH, landscape, slots, cols, rows };
    }
  if (!best) return undefined;
  const { pageW, pageH, landscape, slots } = best;
  return { pageW, pageH, landscape, slots };
}

/** Splits a list of designs (one entry per mug) into pages of `perPage`. */
export function paginateWraps<T>(wraps: T[], perPage: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < wraps.length; i += Math.max(1, perPage)) pages.push(wraps.slice(i, i + Math.max(1, perPage)));
  return pages;
}
