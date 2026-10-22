// Stickers drawn on a canvas and laid out on Print Then Cut sheets. One drawing makes the sheet
// on screen and on paper, the picture with bleed for a cutting machine (PNG) and its cut lines
// (SVG), so the three always match. Sizes are in inches.

export type StickerShape = 'circle' | 'rect' | 'star' | 'badge';

/** Cricut's largest Print Then Cut area; Silhouette and Brother machines take it too. */
export const CUT_W = 6.75;
export const CUT_H = 9.25;
/** Color printed past the cut line, so a cut a hair off never shows white paper. */
export const BLEED = 1 / 16;
/** Space between cut lines (enough for the bleed and the blade). */
export const GAP = 0.25;
const MARGIN = 0.1;

export interface Placed {
  /** Which sticker (index into the list given to layout). */
  index: number;
  /** Top-left of the cut shape on its sheet, in inches. */
  x: number;
  y: number;
  w: number;
  h: number;
  shape: StickerShape;
}

/** Size of a sticker by shape: [w, h] in inches. Tall rects and badges hold a character. */
export function stickerSize(shape: StickerShape, tall = false): [number, number] {
  if (shape === 'circle' || shape === 'star') return [1.6, 1.6];
  if (tall) return [1.35, 1.6];
  if (shape === 'badge') return [1.9, 1.3];
  return [1.9, 1.4];
}

/** Shelf packing: rows left to right, centered, new sheet when the area is full. */
export function layoutStickers(sizes: { w: number; h: number; shape: StickerShape }[], areaW = CUT_W, areaH = CUT_H): Placed[][] {
  const pages: Placed[][] = [];
  let page: Placed[] = [];
  let row: Placed[] = [];
  let y = MARGIN;
  const flushRow = () => {
    if (!row.length) return;
    const rowH = Math.max(...row.map((p) => p.h));
    const used = row.reduce((s, p) => s + p.w, 0) + GAP * (row.length - 1);
    let x = (areaW - used) / 2;
    for (const p of row) {
      p.x = x;
      p.y = y + (rowH - p.h) / 2;
      x += p.w + GAP;
    }
    page.push(...row);
    y += rowH + GAP;
    row = [];
  };
  sizes.forEach((s, index) => {
    const rowW = row.reduce((t, p) => t + p.w + GAP, 0);
    if (row.length && MARGIN + rowW + s.w > areaW - MARGIN) flushRow();
    const rowH = Math.max(s.h, ...row.map((p) => p.h));
    if (y + rowH > areaH - MARGIN && (page.length || row.length)) {
      // this row doesn't fit: the row so far goes on this sheet only if it fits alone
      if (row.length && y + Math.max(...row.map((p) => p.h)) <= areaH - MARGIN) flushRow();
      pages.push(page);
      page = [];
      y = MARGIN;
    }
    row.push({ index, x: 0, y: 0, w: s.w, h: s.h, shape: s.shape });
  });
  flushRow();
  if (page.length) pages.push(page);
  return pages;
}

const f = (n: number) => String(Math.round(n * 1000) / 1000);

/** Corner radius of a shape, in inches. */
function radius(shape: StickerShape): number {
  return shape === 'badge' ? 0.32 : shape === 'rect' ? 0.14 : 0;
}

/**
 * The outline of a sticker as SVG path data, grown by `grow` inches (negative shrinks), with
 * every coordinate multiplied by `scale` (pixels or SVG units per inch) and shifted by `ox, oy`.
 */
export function shapePath(p: Pick<Placed, 'x' | 'y' | 'w' | 'h' | 'shape'>, grow = 0, scale = 1, ox = 0, oy = 0): string {
  const x = (p.x - grow) * scale + ox;
  const y = (p.y - grow) * scale + oy;
  const w = (p.w + 2 * grow) * scale;
  const h = (p.h + 2 * grow) * scale;
  if (p.shape === 'circle') {
    const rx = w / 2;
    const ry = h / 2;
    return `M${f(x)} ${f(y + ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x + w)} ${f(y + ry)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x)} ${f(y + ry)}Z`;
  }
  if (p.shape === 'star') {
    // a starburst seal: shallow points a blade can follow
    const cx = x + w / 2;
    const cy = y + h / 2;
    const n = 14;
    const outer = w / 2;
    const inner = outer - Math.min(0.16 * scale, outer * 0.16);
    const pts: string[] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2;
      const r = i % 2 ? inner : outer;
      pts.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`);
    }
    return `M${pts.join('L')}Z`;
  }
  const r = Math.max(0, Math.min(w / 2, h / 2, (radius(p.shape) + grow) * scale));
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}` +
    `A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  );
}

/** Bounding box of a sheet's stickers grown by `grow`: [x, y, w, h] in inches. */
export function sheetBounds(page: Placed[], grow = 0): [number, number, number, number] {
  const x0 = Math.min(...page.map((p) => p.x)) - grow;
  const y0 = Math.min(...page.map((p) => p.y)) - grow;
  const x1 = Math.max(...page.map((p) => p.x + p.w)) + grow;
  const y1 = Math.max(...page.map((p) => p.y + p.h)) + grow;
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
    (p) =>
      `  <path id="sticker-${p.index + 1}" d="${shapePath(p, 0, S, -bx * S, -by * S)}">` +
      `<title>${escapeXml(names[p.index] || `Sticker ${p.index + 1}`)}</title></path>`,
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
