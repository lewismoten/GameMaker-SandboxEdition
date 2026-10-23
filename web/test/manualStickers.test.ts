// Tests: Sticker sheets (manual/printables/stickerArt.ts, stickerGeom.ts).
import { describe, expect, it } from 'vitest';
import { BLEED, CUT_H, CUT_W, GAP, cutSvg, layoutStickers, placedOutline, pngWithDpi, sheetBounds, type Placed } from '../src/manual/printables/stickerArt';
import { CUT_OFFSET, cutGeom, edgeDistance, inside, outline, type Solid, type StickerGeom, type StickerShape } from '../src/manual/printables/stickerGeom';

/** A little character's silhouette: a head on a body with two legs (a gap between them). */
function figure(scale = 1): Solid {
  const rows = ['..XXXX..', '..XXXX..', 'XXXXXXXX', '.XXXXXX.', '.XXXXXX.', '.XX..XX.', '.XX..XX.'];
  const cols = 8;
  const bits = new Uint8Array(cols * rows.length);
  rows.forEach((r, y) => [...r].forEach((c, x) => (bits[y * cols + x] = c === 'X' ? 1 : 0)));
  return { cols, rows: rows.length, cell: 0.12 * scale, bits };
}

const SHAPES: [StickerShape, number, number][] = [
  ['circle', 1.6, 1.6],
  ['rect', 1.9, 1.3],
  ['star', 1.5, 1.5],
  ['badge', 1.9, 1.2],
  ['heart', 1.4, 1.3],
  ['burst', 1.6, 1.5],
  ['bubble', 1.8, 1.2],
  ['floppy', 1.5, 1.5],
  ['tv', 1.7, 1.5],
];

const stickers: StickerGeom[] = [...SHAPES.map(([shape, w, h]) => ({ shape, w, h })), cutGeom(figure()), cutGeom(figure(1.3))];
const fillers: StickerGeom[] = [cutGeom(figure(0.45)), { shape: 'star', w: 0.6, h: 0.6 }];

function minDistance(a: [number, number][], b: [number, number][]): number {
  let d = Infinity;
  for (const [x, y] of a) d = Math.min(d, edgeDistance(b, x, y));
  for (const [x, y] of b) d = Math.min(d, edgeDistance(a, x, y));
  return d;
}

describe('sticker sheets', () => {
  const pages = layoutStickers(stickers, fillers, 30);

  it('packs every sticker on one sheet, then fills the gaps', () => {
    expect(pages).toHaveLength(1);
    const ids = pages[0].map((p) => p.index);
    for (let i = 0; i < stickers.length; i++) expect(ids).toContain(i);
    expect(ids.filter((i) => i >= stickers.length).length).toBeGreaterThan(4);
  });

  it('keeps every sticker and its bleed inside the printable area', () => {
    for (const p of pages.flat())
      for (const [x, y] of placedOutline(p, BLEED)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(CUT_W);
        expect(y).toBeLessThanOrEqual(CUT_H);
      }
  });

  it('never lets two stickers overlap, and keeps a cutting gap between them', () => {
    for (const page of pages)
      page.forEach((a, i) =>
        page.slice(i + 1).forEach((b) => {
          const pa = placedOutline(a);
          const pb = placedOutline(b);
          expect(inside(pa, pb[0][0], pb[0][1])).toBe(false);
          expect(inside(pb, pa[0][0], pa[0][1])).toBe(false);
          expect(minDistance(pa, pb)).toBeGreaterThan(GAP * 0.95);
        }),
      );
  });

  it('keeps each cut line inside its own bleed, a bleed away from its edge', () => {
    for (const p of pages.flat()) {
      const bleed = placedOutline(p, BLEED);
      for (const [x, y] of placedOutline(p)) {
        expect(inside(bleed, x, y)).toBe(true);
        expect(edgeDistance(bleed, x, y)).toBeGreaterThan(BLEED * 0.8);
      }
    }
  });

  it('fits each plain shape in its box and follows a die-cut around its art', () => {
    for (const [shape, w, h] of SHAPES)
      for (const [x, y] of outline({ shape, w, h })) {
        expect(x).toBeGreaterThan(-1e-6);
        expect(y).toBeGreaterThan(-1e-6);
        expect(x).toBeLessThan(w + 1e-6);
        expect(y).toBeLessThan(h + 1e-6);
      }
    const g = cutGeom(figure());
    const cut = outline(g);
    // the cut runs CUT_OFFSET outside the art, and around the gap between the legs only if it is wide
    const solid = g.solid!;
    for (let y = 0; y < solid.rows; y++)
      for (let x = 0; x < solid.cols; x++)
        if (solid.bits[y * solid.cols + x]) expect(inside(cut, CUT_OFFSET + (x + 0.5) * solid.cell, CUT_OFFSET + (y + 0.5) * solid.cell)).toBe(true);
    expect(inside(cut, g.w + 0.05, g.h / 2)).toBe(false);
    for (const [x, y] of cut) expect(Math.abs(x) + Math.abs(y)).toBeLessThan(g.w + g.h + 0.01);
  });

  it('writes cut lines in inches, cropped to the stickers', () => {
    const page = pages[0];
    const [, , w, h] = sheetBounds(page);
    const svg = cutSvg(page, ['A & B']);
    expect(svg).toContain(`width="${Math.round(w * 1000) / 1000}in"`);
    expect(svg).toContain(`height="${Math.round(h * 1000) / 1000}in"`);
    expect(svg.match(/<path /g)).toHaveLength(page.length);
    expect(svg).toMatch(/<path id="sticker-1" d="M[\d.]+ [\d.]+L.*Z"/);
    if (page.some((p: Placed) => p.index === 0)) expect(svg).toContain('A &amp; B');
  });

  it('stamps a PNG with its print resolution', () => {
    const png = new Uint8Array(8 + 25 + 12);
    png.set([137, 80, 78, 71, 13, 10, 26, 10]);
    png.set([0x49, 0x48, 0x44, 0x52], 12);
    const out = pngWithDpi(png, 300);
    expect(out.length).toBe(png.length + 21);
    expect(String.fromCharCode(...out.subarray(37, 41))).toBe('pHYs');
    expect(new DataView(out.buffer).getUint32(41)).toBe(11811);
  });
});
