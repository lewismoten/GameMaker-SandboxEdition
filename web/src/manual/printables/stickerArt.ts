// Stickers laid out on Print Then Cut sheets, packed tight in any shape (stickerGeom.ts), and
// their cut lines (SVG). One layout makes the sheet on screen and on paper, the picture with
// bleed for a cutting machine (PNG) and its cut lines, so the three always match. Sizes are in inches.

import { edgeDistance, inside, outline, type Pt, type StickerGeom } from './stickerGeom';

/** Cricut's largest Print Then Cut area; Silhouette and Brother machines take it too. */
export const CUT_W = 6.75;
export const CUT_H = 9.25;
/** Color printed past the cut line, so a cut a hair off never shows white paper. */
export const BLEED = 1 / 16;
/** The least space between two cut lines: both bleeds and a little white for the blade. */
export const GAP = 0.2;
/** The packing grid, in inches. */
const CELL = 0.05;

/** A sticker on its sheet: its cut shape's top-left at (x, y) inches. */
export interface Placed extends StickerGeom {
  /** Which sticker: an index into the list given to layout, then into its fillers. */
  index: number;
  x: number;
  y: number;
}

/** A sticker's footprint on the packing grid: rows of [row, from, to) cells, from its top-left cell. */
type Footprint = [number, number, number][];

function footprint(g: StickerGeom): Footprint {
  // every cell within half the gap of the cut line (plus half a cell's diagonal, so cells that only
  // touch count too); two stickers whose footprints miss each other are a full gap apart
  const cut = outline(g);
  const r = GAP / 2 + CELL * 0.71;
  const cols = Math.ceil((g.w + 2 * r) / CELL) + 1;
  const rows = Math.ceil((g.h + 2 * r) / CELL) + 1;
  const o = Math.ceil(r / CELL);
  const out: Footprint = [];
  for (let j = 0; j < rows; j++) {
    let from = -1;
    for (let i = 0; i <= cols; i++) {
      const x = (i - o + 0.5) * CELL;
      const y = (j - o + 0.5) * CELL;
      const on = i < cols && (inside(cut, x, y) || edgeDistance(cut, x, y) <= r);
      if (on && from < 0) from = i;
      if (!on && from >= 0) {
        out.push([j - o, from - o, i - o]);
        from = -1;
      }
    }
  }
  return out;
}

/** One sheet's packing grid: which cells are taken, and how many free cells run right from each. */
class Grid {
  readonly cols = Math.floor(CUT_W / CELL);
  readonly rows = Math.floor(CUT_H / CELL);
  readonly taken = new Uint8Array(this.cols * this.rows);
  readonly run = new Int32Array(this.cols * this.rows);
  constructor() {
    this.update();
  }
  update(): void {
    for (let j = 0; j < this.rows; j++) {
      let n = 0;
      for (let i = this.cols - 1; i >= 0; i--) {
        n = this.taken[j * this.cols + i] ? 0 : n + 1;
        this.run[j * this.cols + i] = n;
      }
    }
  }
  /** The first top-left cell (row by row) where the sticker fits, its bleed inside the sheet. */
  find(g: StickerGeom, fp: Footprint): [number, number] | undefined {
    const m = Math.ceil(BLEED / CELL);
    const maxI = Math.floor((CUT_W - g.w - BLEED) / CELL);
    const maxJ = Math.floor((CUT_H - g.h - BLEED) / CELL);
    for (let j = m; j <= maxJ; j++)
      for (let i = m; i <= maxI; i++) {
        let ok = true;
        for (const [dj, a, b] of fp) {
          const row = j + dj;
          if (row < 0 || row >= this.rows) continue;
          const lo = Math.max(0, i + a);
          const hi = Math.min(this.cols, i + b);
          if (hi > lo && this.run[row * this.cols + lo] < hi - lo) {
            ok = false;
            break;
          }
        }
        if (ok) return [i, j];
      }
    return undefined;
  }
  take(i: number, j: number, fp: Footprint): void {
    for (const [dj, a, b] of fp) {
      const row = j + dj;
      if (row < 0 || row >= this.rows) continue;
      for (let x = Math.max(0, i + a); x < Math.min(this.cols, i + b); x++) this.taken[row * this.cols + x] = 1;
    }
    this.update();
  }
}

/**
 * Packs stickers onto as few Print Then Cut sheets as they need: biggest first, each in the first
 * place it fits, so shapes nest into each other's gaps. Then `fillers` (small extras) go into
 * whatever room is left on every sheet, round and round, until none fits or `maxFill` are down.
 */
export function layoutStickers(stickers: StickerGeom[], fillers: StickerGeom[] = [], maxFill = 60): Placed[][] {
  const pages: { grid: Grid; placed: Placed[] }[] = [];
  const order = stickers.map((_, i) => i).sort((a, b) => stickers[b].w * stickers[b].h - stickers[a].w * stickers[a].h || a - b);
  const put = (page: { grid: Grid; placed: Placed[] }, g: StickerGeom, fp: Footprint, index: number): boolean => {
    const at = page.grid.find(g, fp);
    if (!at) return false;
    page.grid.take(at[0], at[1], fp);
    page.placed.push({ ...g, index, x: at[0] * CELL, y: at[1] * CELL });
    return true;
  };
  for (const i of order) {
    const fp = footprint(stickers[i]);
    if (pages.some((p) => put(p, stickers[i], fp, i))) continue;
    const page = { grid: new Grid(), placed: [] };
    pages.push(page);
    if (!put(page, stickers[i], fp, i)) throw new Error('A sticker is bigger than the sheet');
  }
  if (!pages.length) return [];
  const prints = fillers.map(footprint);
  let left = maxFill;
  for (const page of pages) {
    for (let placed = true; placed && left > 0;) {
      placed = false;
      for (let f = 0; f < fillers.length && left > 0; f++)
        if (put(page, fillers[f], prints[f], stickers.length + f)) {
          placed = true;
          left--;
        }
    }
  }
  return pages.map((p) => p.placed);
}

const f = (n: number) => String(Math.round(n * 1000) / 1000);

/** A sticker's outline on its sheet, grown by `grow` inches. */
export function placedOutline(p: Placed, grow = 0): Pt[] {
  return outline(p, grow).map(([x, y]): Pt => [p.x + x, p.y + y]);
}

/**
 * The outline of a sticker as SVG path data, grown by `grow` inches (negative shrinks), with
 * every coordinate multiplied by `scale` (pixels or SVG units per inch) and shifted by `ox, oy`.
 */
function shapePath(p: Placed, grow = 0, scale = 1, ox = 0, oy = 0): string {
  const pts = placedOutline(p, grow);
  return `M${pts.map(([x, y]) => `${f(x * scale + ox)} ${f(y * scale + oy)}`).join('L')}Z`;
}

/** Bounding box of a sheet's stickers' outlines grown by `grow`: [x, y, w, h] in inches. */
export function sheetBounds(page: Placed[], grow = 0): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of page)
    for (const [x, y] of placedOutline(p, grow)) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  return [x0, y0, x1 - x0, y1 - y0];
}

/**
 * The cut lines as an SVG file in real inches, cropped to the stickers, so it is exactly the
 * size of the bleed picture less the bleed on every side (center one on the other).
 */
export function cutSvg(page: Placed[], names: string[] = []): string {
  const [bx, by, bw, bh] = sheetBounds(page);
  const S = 100; // SVG units per inch
  const paths = page.map(
    (p, k) =>
      `  <path id="sticker-${k + 1}" d="${shapePath(p, 0, S, -bx * S, -by * S)}">` + `<title>${escapeXml(names[p.index] || `Sticker ${k + 1}`)}</title></path>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${f(bw)}in" height="${f(bh)}in" viewBox="0 0 ${f(bw * S)} ${f(bh * S)}">`,
    '  <title>Cut lines</title>',
    ` <g id="cut" fill="none" stroke="#ff0000" stroke-width="1">`,
    ...paths,
    ' </g>',
    '</svg>',
    '',
  ].join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
}

// ------------------------------------------------------------------ PNG resolution

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (const x of b) c = CRC_TABLE[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Tells programs that open the PNG how big to print it: a pHYs chunk right after IHDR. */
export function pngWithDpi(png: Uint8Array, dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1; // meters
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 25; // signature + IHDR (4 length, 4 type, 13 data, 4 crc)
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, ihdrEnd));
  out.set(chunk, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}
