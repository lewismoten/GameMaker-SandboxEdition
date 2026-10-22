// A 256-color graphics screen for showing pictures: VGA's 320x200 (mode 13h) or the SVGA
// 640x400 mode most 1994 cards had (VESA mode 100h), with the BIOS 8x8 font for a line of
// text. Text mode can't show a picture, so the BBS's view-while-downloading and VPIC switch
// the monitor to one of these, then back.
//
// Like the designers' VGA screen (vga/shared/vga.ts) it fills the tube (4:3), so its
// pixels are a little taller than wide, drawn from a whole-number upscale so they stay even.
import { FONT_CP437 } from '../text/cp437';

/** The screen mode a picture of this size needs: 320x200 if it fits there, else 640x400. */
export function modeFor(width: number, height: number): [number, number] {
  return width <= 320 && height <= 200 ? [320, 200] : [640, 400];
}

/** Where a picture goes on the screen: centered, shrunk (keeping its shape) if it's too big. */
export function placeIn(width: number, height: number, sw: number, sh: number): { x: number; y: number; w: number; h: number } {
  const k = Math.min(1, sw / width, sh / height);
  const w = Math.max(1, Math.round(width * k));
  const h = Math.max(1, Math.round(height * k));
  return { x: (sw - w) >> 1, y: (sh - h) >> 1, w, h };
}

/** The palette entry nearest a color (0..63 components). */
export function nearestColor(palette: Uint8Array, r: number, g: number, b: number, count = 256): number {
  let best = 0;
  let d = Infinity;
  for (let i = 0; i < count; i++) {
    const e = (palette[i * 3] - r) ** 2 + (palette[i * 3 + 1] - g) ** 2 + (palette[i * 3 + 2] - b) ** 2;
    if (e < d) [d, best] = [e, i];
  }
  return best;
}

export class PictureScreen {
  readonly canvas: HTMLCanvasElement;
  /** One palette index per pixel. */
  readonly mem: Uint8Array;
  /** The DAC: 256 colors of 0..63. */
  readonly dac = new Uint8Array(768);
  private ctx: CanvasRenderingContext2D;
  private off: HTMLCanvasElement;
  private big?: HTMLCanvasElement;
  private frame: ImageData;
  private upscale = 0;
  private dirty = true;
  private raf = 0;
  private observer: ResizeObserver;
  private keys: string[] = [];
  private waiting?: () => void;
  private onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    e.preventDefault();
    this.keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    this.waiting?.();
  };

  constructor(
    readonly holder: HTMLElement,
    readonly width: number,
    readonly height: number,
  ) {
    this.mem = new Uint8Array(width * height);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vga-screen';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', `${width}x${height} graphics screen`);
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.off = document.createElement('canvas');
    [this.off.width, this.off.height] = [width, height];
    this.frame = this.off.getContext('2d')!.createImageData(width, height);
    holder.append(this.canvas);
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(holder);
    this.fit();
    // not the key press that switched modes
    setTimeout(() => !this.destroyed && addEventListener('keydown', this.onKey, true));
    const loop = () => {
      if (this.dirty) this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private destroyed = false;

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    removeEventListener('keydown', this.onKey, true);
    this.canvas.remove();
    this.waiting?.();
  }

  /** Draw the screen again (after changing mem or dac). */
  invalidate(): void {
    this.dirty = true;
  }

  /** A key pressed since the last call, if any. */
  poll(): string | undefined {
    return this.keys.shift();
  }

  /** Waits for a key. */
  async key(): Promise<string> {
    while (!this.keys.length && !this.destroyed) await new Promise<void>((r) => (this.waiting = r));
    this.waiting = undefined;
    return this.keys.shift() ?? 'Escape';
  }

  /** Copies indexed pixels onto the screen at (x, y), shrinking them to w x h if smaller. */
  blit(pixels: Uint8Array, pw: number, ph: number, at: { x: number; y: number; w: number; h: number }): void {
    for (let y = 0; y < at.h; y++) {
      const sy = Math.floor((y * ph) / at.h);
      const row = (at.y + y) * this.width + at.x;
      if (at.w === pw) this.mem.set(pixels.subarray(sy * pw, sy * pw + pw), row);
      else for (let x = 0; x < at.w; x++) this.mem[row + x] = pixels[sy * pw + Math.floor((x * pw) / at.w)];
    }
    this.dirty = true;
  }

  /** Text in the BIOS 8x8 font at a character cell, on a solid background like the BIOS draws it. */
  text(col: number, row: number, s: string, fg: number, bg: number): void {
    for (let i = 0; i < s.length; i++) {
      const glyph = s.charCodeAt(i) & 255;
      for (let y = 0; y < 8; y++) {
        const bits = FONT_CP437[glyph * 8 + y];
        const o = (row * 8 + y) * this.width + (col + i) * 8;
        if (o < 0 || o + 8 > this.mem.length) continue;
        for (let x = 0; x < 8; x++) this.mem[o + x] = bits & (1 << x) ? fg : bg;
      }
    }
    this.dirty = true;
  }

  private fit(): void {
    const dpr = devicePixelRatio || 1;
    const r = this.holder.getBoundingClientRect();
    const scale = Math.max((r.width * dpr) / this.width, (r.height * dpr) / this.height, 0.1);
    const k = Math.max(1, Math.min(6, Math.ceil(scale)));
    const exact = scale < 3 && Math.abs(scale - Math.round(scale)) > 0.04;
    const [w, h] = exact ? [Math.round(this.width * scale), Math.round(this.height * scale)] : [this.width * k, this.height * k];
    this.upscale = exact ? k : 0;
    if (this.canvas.width === w && this.canvas.height === h) return;
    [this.canvas.width, this.canvas.height] = [w, h];
    this.dirty = true;
  }

  private render(): void {
    const c = (v: number) => ((v & 63) << 2) | ((v & 63) >> 4);
    const rgba = new Uint32Array(256);
    for (let i = 0; i < 256; i++) rgba[i] = 0xff000000 | (c(this.dac[i * 3 + 2]) << 16) | (c(this.dac[i * 3 + 1]) << 8) | c(this.dac[i * 3]);
    const f = new Uint32Array(this.frame.data.buffer);
    for (let i = 0; i < this.mem.length; i++) f[i] = rgba[this.mem[i]];
    this.off.getContext('2d')!.putImageData(this.frame, 0, 0);
    if (this.upscale) {
      const big = (this.big ??= document.createElement('canvas'));
      if (big.width !== this.width * this.upscale) [big.width, big.height] = [this.width * this.upscale, this.height * this.upscale];
      const b = big.getContext('2d')!;
      b.imageSmoothingEnabled = false;
      b.drawImage(this.off, 0, 0, big.width, big.height);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.drawImage(big, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(this.off, 0, 0, this.canvas.width, this.canvas.height);
    }
    this.dirty = false;
  }
}
