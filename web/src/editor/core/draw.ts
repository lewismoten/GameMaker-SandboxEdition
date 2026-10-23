// Canvas helpers for showing palette-indexed graphics in the editor.
import { BLEN, TRANSPARENT, orientIndex } from '../../formats/blocks';
import { paletteToRGBA, type Palette } from '../../formats/palette';

const lutCache = new WeakMap<Palette, Uint32Array>();

export function lut(pal: Palette): Uint32Array {
  let l = lutCache.get(pal);
  if (!l) {
    l = paletteToRGBA(pal);
    lutCache.set(pal, l);
  }
  return l;
}

/** Paints indexed pixels into a canvas (255 stays transparent when `transparent`). */
export function paintIndexed(canvas: HTMLCanvasElement, pixels: Uint8Array, width: number, height: number, pal: Palette, transparent = false): void {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  const out = new Uint32Array(img.data.buffer);
  const l = lut(pal);
  for (let i = 0; i < width * height; i++) out[i] = transparent && pixels[i] === TRANSPARENT ? 0 : l[pixels[i]];
  ctx.putImageData(img, 0, 0);
}

export function blockCanvas(pixels: Uint8Array, pal: Palette, opts: { transparent?: boolean; orient?: number; className?: string } = {}): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.className = `pixel ${opts.className ?? ''}`;
  paintBlock(c, pixels, pal, opts);
  return c;
}

export function paintBlock(c: HTMLCanvasElement, pixels: Uint8Array, pal: Palette, opts: { transparent?: boolean; orient?: number } = {}): void {
  let px = pixels;
  if (opts.orient) {
    px = new Uint8Array(BLEN * BLEN);
    for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) px[y * BLEN + x] = pixels[orientIndex(opts.orient, x, y)];
  }
  paintIndexed(c, px, BLEN, BLEN, pal, opts.transparent);
}

/** Draws a block onto a 2D context at (x, y) scaled by s, skipping transparent pixels if asked. */
export function drawBlockTo(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8Array,
  pal: Palette,
  x: number,
  y: number,
  s: number,
  transparent = false,
  orient = 0,
): void {
  const l = lut(pal);
  for (let yy = 0; yy < BLEN; yy++)
    for (let xx = 0; xx < BLEN; xx++) {
      const v = pixels[orient ? orientIndex(orient, xx, yy) : yy * BLEN + xx];
      if (transparent && v === TRANSPARENT) continue;
      const c = l[v];
      ctx.fillStyle = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
      ctx.fillRect(x + xx * s, y + yy * s, s, s);
    }
}

/** An ImageBitmap-like offscreen canvas per block for fast map drawing. */
export function blockImages(blocks: { pixels: Uint8Array }[], pal: Palette, transparent = false): HTMLCanvasElement[] {
  return blocks.map((b) => {
    const c = document.createElement('canvas');
    paintBlock(c, b.pixels, pal, { transparent });
    return c;
  });
}
