// Mode 13h emulation: a 320x200 framebuffer of palette indices plus a 256 entry
// 6-bit VGA palette, presented on an HTML canvas.
import { FONT_CP437 } from './cp437Glyphs';
import { BLEN, TRANSPARENT, orientIndex } from '../formats/blocks';
import { PALETTE_SIZE, vga8 } from '../formats/palette';

export const SIZEX = 320;
export const SIZEY = 200;

export class Screen {
  readonly pixels = new Uint8Array(SIZEX * SIZEY);
  /** Palette currently shown by the "DAC" (6-bit components). */
  readonly palette = new Uint8Array(PALETTE_SIZE);
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private rgba: Uint32Array;
  private lut = new Uint32Array(256);
  private dirty = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = SIZEX;
    canvas.height = SIZEY;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.image = this.ctx.createImageData(SIZEX, SIZEY);
    this.rgba = new Uint32Array(this.image.data.buffer);
    this.updateLut();
  }

  // ---- palette -------------------------------------------------------------

  setPalette(pal: ArrayLike<number>): void {
    for (let i = 0; i < PALETTE_SIZE; i++) this.palette[i] = (pal[i] ?? 0) & 63;
    this.updateLut();
  }

  /** SetAllPalTo: every entry the same color. */
  setPaletteTo(r: number, g: number, b: number): void {
    for (let i = 0; i < 256; i++) this.palette.set([r, g, b], i * 3);
    this.updateLut();
  }

  setColor(index: number, r: number, g: number, b: number): void {
    this.palette.set([r & 63, g & 63, b & 63], index * 3);
    this.updateLut();
  }

  private updateLut(): void {
    for (let i = 0; i < 256; i++) {
      this.lut[i] = 0xff000000 | (vga8(this.palette[i * 3 + 2]) << 16) | (vga8(this.palette[i * 3 + 1]) << 8) | vga8(this.palette[i * 3]);
    }
    this.dirty = true;
  }

  // ---- presentation --------------------------------------------------------

  markDirty(): void {
    this.dirty = true;
  }

  present(): void {
    if (!this.dirty) return;
    const px = this.pixels;
    const lut = this.lut;
    const out = this.rgba;
    for (let i = 0; i < px.length; i++) out[i] = lut[px[i]];
    this.ctx.putImageData(this.image, 0, 0);
    this.dirty = false;
  }

  // ---- primitives (GRAPHC.C / GENA.ASM) ------------------------------------

  clear(col = 0): void {
    this.pixels.fill(col);
    this.dirty = true;
  }

  point(x: number, y: number, col: number): void {
    if (x < 0 || y < 0 || x >= SIZEX || y >= SIZEY) return;
    this.pixels[y * SIZEX + x] = col;
    this.dirty = true;
  }

  getCol(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= SIZEX || y >= SIZEY) return 0;
    return this.pixels[y * SIZEX + x];
  }

  /** BoxFill: inclusive corners. */
  boxFill(x: number, y: number, x1: number, y1: number, col: number): void {
    const xa = Math.max(0, Math.min(x, x1));
    const xb = Math.min(SIZEX - 1, Math.max(x, x1));
    const ya = Math.max(0, Math.min(y, y1));
    const yb = Math.min(SIZEY - 1, Math.max(y, y1));
    for (let yy = ya; yy <= yb; yy++) this.pixels.fill(col, yy * SIZEX + xa, yy * SIZEX + xb + 1);
    this.dirty = true;
  }

  /** Box: rectangle outline. */
  box(x: number, y: number, x1: number, y1: number, col: number): void {
    this.line(x, y, x1, y, col);
    this.line(x, y1, x1, y1, col);
    this.line(x, y, x, y1, col);
    this.line(x1, y, x1, y1, col);
  }

  line(x0: number, y0: number, x1: number, y1: number, col: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.point(x0, y0, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** GPutChar: transparent background, 8x8 glyph from the BIOS font (GetROMFont), all of CP437. */
  putChar(x: number, y: number, col: number, code: number): void {
    const base = (code & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      const bits = FONT_CP437[base + row];
      if (!bits) continue;
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) this.point(x + b, y + row, col);
    }
  }

  /** GWrite: '\n' moves to the next line at the starting column. */
  write(x: number, y: number, col: number, text: string): void {
    let cx = x;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 10) {
        y += 8;
        cx = x;
      } else {
        this.putChar(cx, y, col, c);
        cx += 8;
      }
    }
  }

  // ---- blocks ----------------------------------------------------------------

  /** drawblk / BufDrawBlk: opaque 20x20 block, clipped. */
  drawBlock(x: number, y: number, pixels: Uint8Array): void {
    for (let yy = 0; yy < BLEN; yy++) {
      const sy = y + yy;
      if (sy < 0 || sy >= SIZEY) continue;
      for (let xx = 0; xx < BLEN; xx++) {
        const sx = x + xx;
        if (sx < 0 || sx >= SIZEX) continue;
        this.pixels[sy * SIZEX + sx] = pixels[yy * BLEN + xx];
      }
    }
    this.dirty = true;
  }

  /** BufDrawSpBlk: transparent (255) sprite with one of 8 orientations, clipped. */
  drawSprite(x: number, y: number, orient: number, pixels: Uint8Array): void {
    for (let yy = 0; yy < BLEN; yy++) {
      const sy = y + yy;
      if (sy < 0 || sy >= SIZEY) continue;
      for (let xx = 0; xx < BLEN; xx++) {
        const sx = x + xx;
        if (sx < 0 || sx >= SIZEX) continue;
        const v = pixels[orientIndex(orient, xx, yy)];
        if (v !== TRANSPARENT) this.pixels[sy * SIZEX + sx] = v;
      }
    }
    this.dirty = true;
  }

  /** Copies an indexed image (e.g. a GIF) with its top-left at (-sx, -sy). */
  drawImage(pixels: Uint8Array, width: number, height: number, sx = 0, sy = 0): void {
    for (let y = 0; y < SIZEY; y++) {
      const iy = y + sy;
      if (iy < 0 || iy >= height) continue;
      for (let x = 0; x < SIZEX; x++) {
        const ix = x + sx;
        if (ix < 0 || ix >= width) continue;
        this.pixels[y * SIZEX + x] = pixels[iy * width + ix];
      }
    }
    this.dirty = true;
  }

  snapshot(): Uint8Array {
    return this.pixels.slice();
  }

  restore(snap: Uint8Array): void {
    this.pixels.set(snap);
    this.dirty = true;
  }
}
