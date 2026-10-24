// An 80x25 color text mode screen (VGA mode 3) drawn on a canvas: character + attribute
// cells, the 16 color text palette (which Game-Maker reprogrammed), boxes with drop
// shadows, saved regions and a blinking cursor. Characters are CP437 codes.
import { FONT_CP437 } from './cp437';

export const COLS = 80;
export const ROWS = 25;
const CW = 8;
const CH = 16; // 8x8 glyphs drawn double height, like a 400 line VGA text screen

/** Default VGA text colors, as 6-bit DAC values. */
const VGA16: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 42],
  [0, 42, 0],
  [0, 42, 42],
  [42, 0, 0],
  [42, 0, 42],
  [42, 21, 0],
  [42, 42, 42],
  [21, 21, 21],
  [21, 21, 63],
  [21, 63, 21],
  [21, 63, 63],
  [63, 21, 21],
  [63, 21, 63],
  [63, 63, 21],
  [63, 63, 63],
];

/** attr = foreground + background * 16 */
export const attr = (fg: number, bg: number) => (fg & 15) | ((bg & 15) << 4);

export interface SavedRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  chars: Uint8Array;
  attrs: Uint8Array;
}

export class TextScreen {
  readonly chars = new Uint8Array(COLS * ROWS).fill(32);
  readonly attrs = new Uint8Array(COLS * ROWS).fill(7);
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private px: Uint32Array;
  private colors = new Uint32Array(16);
  /** Device pixels per VGA pixel: drawn sharper when the screen is shown larger. */
  private scale = 1;
  /** The exact device size to resample to, when the scale isn't a whole number. */
  private shrinkTo?: [number, number];
  private full?: CanvasRenderingContext2D;
  private dirty = true;
  private raf = 0;
  cursorX = 0;
  cursorY = 0;
  cursorVisible = true;
  private blinkOn = true;
  private blinkTimer: ReturnType<typeof setInterval>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = COLS * CW;
    canvas.height = ROWS * CH;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.image = this.ctx.createImageData(canvas.width, canvas.height);
    this.px = new Uint32Array(this.image.data.buffer);
    this.resetPalette();
    this.blinkTimer = setInterval(() => {
      this.blinkOn = !this.blinkOn;
      if (this.cursorVisible) this.dirty = true;
    }, 266);
    const loop = () => {
      if (this.dirty) this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    clearInterval(this.blinkTimer);
  }

  resetPalette(): void {
    VGA16.forEach(([r, g, b], i) => this.setColor(i, r, g, b));
  }

  /** Palette(): change the color an attribute index shows (6-bit components). */
  setColor(i: number, r: number, g: number, b: number): void {
    const c = (v: number) => ((v & 63) << 2) | ((v & 63) >> 4);
    this.colors[i & 15] = 0xff000000 | (c(b) << 16) | (c(g) << 8) | c(r);
    this.dirty = true;
  }

  /** Game-Maker's SetTextColors (GENC.C): darker blues and greys for its menus. */
  gameMakerColors(): void {
    this.resetPalette();
    this.setColor(5, 10, 10, 10);
    this.setColor(7, 16, 16, 16);
    this.setColor(1, 0, 0, 30);
    this.setColor(2, 0, 0, 50);
    this.setColor(3, 10, 10, 63);
    // Attribute 6 uses DAC register 20 in text mode, so Palette(6,…) did not change it.
  }

  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Fits the picture to `scale` device pixels per VGA pixel. At a whole scale each VGA
   * pixel is drawn as k x k device pixels; otherwise it is drawn at the next whole scale off
   * screen and resampled to the exact size with high-quality smoothing, so strokes stay
   * even (no doubled or dropped rows) and thin ones turn grey instead of vanishing.
   */
  setScale(scale: number): void {
    if (!(scale > 0)) return;
    const near = Math.round(scale);
    const whole = near >= 1 && Math.abs(scale - near) < 0.04;
    const k = Math.max(1, Math.min(4, whole ? near : Math.ceil(scale)));
    const size: [number, number] | undefined = whole ? undefined : [Math.round(COLS * CW * scale), Math.round(ROWS * CH * scale)];
    if (k === this.scale && size?.[0] === this.shrinkTo?.[0] && size?.[1] === this.shrinkTo?.[1]) return;
    this.scale = k;
    this.shrinkTo = size;
    const [w, h] = [COLS * CW * k, ROWS * CH * k];
    if (size) {
      if (!this.full) this.full = document.createElement('canvas').getContext('2d', { alpha: false })!;
      this.full.canvas.width = w;
      this.full.canvas.height = h;
      [this.canvas.width, this.canvas.height] = size;
      this.image = this.full.createImageData(w, h);
    } else {
      this.canvas.width = w;
      this.canvas.height = h;
      this.image = this.ctx.createImageData(w, h);
    }
    this.px = new Uint32Array(this.image.data.buffer);
    this.dirty = true;
  }

  put(x: number, y: number, ch: number, a: number): void {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    this.chars[y * COLS + x] = ch & 255;
    this.attrs[y * COLS + x] = a & 255;
    this.dirty = true;
  }

  /** writestr: text (CP437 codes) at (x, y) in one attribute, clipped to the row. */
  write(x: number, y: number, a: number, text: string): void {
    for (let i = 0; i < text.length && x + i < COLS; i++) this.put(x + i, y, text.charCodeAt(i), a);
  }

  /** Changes attributes only (cursor bars, shadows). */
  paint(x: number, y: number, x1: number, y1: number, a: number): void {
    for (let yy = Math.max(0, y); yy <= Math.min(ROWS - 1, y1); yy++)
      for (let xx = Math.max(0, x); xx <= Math.min(COLS - 1, x1); xx++) this.attrs[yy * COLS + xx] = a;
    this.dirty = true;
  }

  /** clrbox */
  fill(x: number, y: number, x1: number, y1: number, a: number, ch = 32): void {
    for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) this.put(xx, yy, ch, a);
  }

  clear(a = 7): void {
    this.chars.fill(32);
    this.attrs.fill(a);
    this.cursorX = this.cursorY = 0;
    this.dirty = true;
  }

  /** drawbox: single (1) or double (2) line box with an optional 2x1 drop shadow. */
  box(x: number, y: number, x1: number, y1: number, a: number, type: 1 | 2 = 2, shadow?: number): void {
    const [h, v, tl, tr, bl, br] = type === 2 ? [205, 186, 201, 187, 200, 188] : [196, 179, 218, 191, 192, 217];
    for (let xx = x + 1; xx < x1; xx++) {
      this.put(xx, y, h, a);
      this.put(xx, y1, h, a);
    }
    for (let yy = y + 1; yy < y1; yy++) {
      this.put(x, yy, v, a);
      this.put(x1, yy, v, a);
    }
    this.put(x, y, tl, a);
    this.put(x1, y, tr, a);
    this.put(x, y1, bl, a);
    this.put(x1, y1, br, a);
    if (shadow !== undefined) {
      this.paint(x1 + 1, y + 1, x1 + 2, y1 + 1, shadow);
      this.paint(x + 2, y1 + 1, x1 + 2, y1 + 1, shadow);
    }
  }

  /** openmenu: a filled double-line box with a shadow; returns the inner area. */
  window(x: number, y: number, w: number, h: number, a: number, shadow = attr(8, 0)): SavedRegion {
    const saved = this.save(x - 1, y - 1, w + 4, h + 3);
    this.fill(x, y, x + w - 1, y + h - 1, a);
    this.box(x - 1, y - 1, x + w, y + h, a, 2, shadow);
    return saved;
  }

  save(x: number, y: number, w: number, h: number): SavedRegion {
    const chars = new Uint8Array(w * h);
    const attrs = new Uint8Array(w * h);
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        const sx = x + xx;
        const sy = y + yy;
        if (sx < 0 || sy < 0 || sx >= COLS || sy >= ROWS) continue;
        chars[yy * w + xx] = this.chars[sy * COLS + sx];
        attrs[yy * w + xx] = this.attrs[sy * COLS + sx];
      }
    return { x, y, w, h, chars, attrs };
  }

  restore(r: SavedRegion): void {
    for (let yy = 0; yy < r.h; yy++) for (let xx = 0; xx < r.w; xx++) this.put(r.x + xx, r.y + yy, r.chars[yy * r.w + xx], r.attrs[yy * r.w + xx]);
  }

  snapshot(): SavedRegion {
    return this.save(0, 0, COLS, ROWS);
  }

  /** Scrolls the whole screen up one line (TTY output). */
  scrollUp(a = 7): void {
    this.chars.copyWithin(0, COLS);
    this.attrs.copyWithin(0, COLS);
    this.chars.fill(32, (ROWS - 1) * COLS);
    this.attrs.fill(a, (ROWS - 1) * COLS);
    this.dirty = true;
  }

  /** DOS console output at the cursor, handling \n, \r and \b, scrolling at the bottom. */
  print(text: string, a = 7): void {
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 10) this.newline(a);
      else if (c === 13) this.cursorX = 0;
      else if (c === 8) this.cursorX = Math.max(0, this.cursorX - 1);
      else {
        this.put(this.cursorX, this.cursorY, c, a);
        this.cursorX++;
        if (this.cursorX >= COLS) this.newline(a);
      }
    }
    this.dirty = true;
  }

  private newline(a: number): void {
    this.cursorX = 0;
    this.cursorY++;
    if (this.cursorY >= ROWS) {
      this.scrollUp(a);
      this.cursorY = ROWS - 1;
    }
  }

  /** Draws immediately (for capturing the screen as a picture). */
  renderNow(): void {
    this.render();
  }

  private render(): void {
    const { px, colors, scale: k } = this;
    const W = COLS * CW * k;
    for (let cy = 0; cy < ROWS; cy++)
      for (let cx = 0; cx < COLS; cx++) {
        const i = cy * COLS + cx;
        const a = this.attrs[i];
        const fg = colors[a & 15];
        const bg = colors[(a >> 4) & 15];
        const glyph = this.chars[i] * 8;
        const cursorHere = this.cursorVisible && this.blinkOn && cx === this.cursorX && cy === this.cursorY;
        for (let row = 0; row < 8; row++) {
          let bits = FONT_CP437[glyph + row];
          if (cursorHere && row >= 6) bits = 0xff;
          // each font row is two VGA lines tall
          const o0 = (cy * CH + row * 2) * k * W + cx * CW * k;
          for (let b = 0; b < 8; b++) {
            const c = bits & (1 << b) ? fg : bg;
            for (let line = 0; line < 2 * k; line++) px.fill(c, o0 + line * W + b * k, o0 + line * W + b * k + k);
          }
        }
      }
    if (this.shrinkTo && this.full) {
      this.full.putImageData(this.image, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.drawImage(this.full.canvas, 0, 0, this.shrinkTo[0], this.shrinkTo[1]);
    } else this.ctx.putImageData(this.image, 0, 0);
    this.dirty = false;
  }
}
