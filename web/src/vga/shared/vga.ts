// VGA mode 13h as Game-Maker's designers used it: a 320x200 screen of palette indexes,
// a 256-color DAC of 6-bit components, the BIOS 8x8 font, the mouse cursor, BIOS key
// reads and the 18.2 Hz clock. The drawing routines are ports of code/GM/GRAPHC.C.
// Like a real monitor, the picture fills its box; it is drawn from a whole-number
// upscale of 320x200 so pixels keep hard edges.
import { FONT_CP437 } from '../../retro/text/cp437';
import { ProgramAborted } from '../../retro/text/textInput';
import { Keyboard, type TypedKey } from '../../input/keyboard';

export const SIZEX = 320;
export const SIZEY = 200;

export interface RGBdata {
  red: number;
  green: number;
  blue: number;
}

/** The standard Microsoft mouse arrow: 1 = black outline, 2 = white. Hot spot (1, 0). */
const ARROW = [
  '1           ',
  '11          ',
  '121         ',
  '1221        ',
  '12221       ',
  '122221      ',
  '1222221     ',
  '12222221    ',
  '122222221   ',
  '1222222221  ',
  '1222221111  ',
  '1221221     ',
  '121 1221    ',
  '11  1221    ',
  '1    1221   ',
  '     1221   ',
  '      11    ',
];
const HOT_X = 1;
const HOT_Y = 0;

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Vga {
  readonly canvas: HTMLCanvasElement;
  /** Video memory at A000:0000: one palette index per pixel. */
  readonly mem = new Uint8Array(SIZEX * SIZEY);
  /** The DAC: 256 colors of 0..63 red, green and blue. */
  readonly dac = new Uint8Array(768);
  readonly keyboard = new Keyboard();
  private ctx: CanvasRenderingContext2D;
  private frame: ImageData;
  private frame32: Uint32Array;
  private scaled: HTMLCanvasElement;
  private raf = 0;
  private dirty = true;
  private observer: ResizeObserver;
  /** When resampling: the whole multiple drawn first (0 = draw straight to the canvas). */
  private upscale = 0;
  private onResize: () => void;
  private big?: HTMLCanvasElement;
  private started = performance.now();
  // the mouse, in screen pixels
  private mx = 160;
  private my = 100;
  private buttons = 0;
  /** Buttons pressed since the last moustats(), so a click shorter than a frame still counts. */
  private pressed = 0;
  private destroyed = false;
  private limit = [0, 0, SIZEX - 1, SIZEY - 1];
  private cursorShown = false;
  private listeners: [EventTarget, string, EventListener][] = [];
  private attachTimer: ReturnType<typeof setTimeout>;

  constructor(readonly holder: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vga-screen';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'VGA screen');
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.scaled = document.createElement('canvas');
    this.scaled.width = SIZEX;
    this.scaled.height = SIZEY;
    this.frame = this.scaled.getContext('2d')!.createImageData(SIZEX, SIZEY);
    this.frame32 = new Uint32Array(this.frame.data.buffer);
    holder.append(this.canvas);
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(holder);
    this.onResize = () => requestAnimationFrame(() => this.fit());
    addEventListener('resize', this.onResize);
    this.fit();

    const on = (t: EventTarget, type: string, f: EventListener) => {
      t.addEventListener(type, f);
      this.listeners.push([t, type, f]);
    };
    const move = (e: Event) => {
      const p = e as PointerEvent;
      const r = this.canvas.getBoundingClientRect();
      this.goto(((p.clientX - r.left) / r.width) * SIZEX, ((p.clientY - r.top) / r.height) * SIZEY);
      this.buttons = (p.buttons & 1 ? 1 : 0) | (p.buttons & 2 ? 2 : 0);
      this.pressed |= this.buttons;
    };
    on(this.canvas, 'pointermove', move);
    on(this.canvas, 'pointerdown', (e) => {
      this.canvas.setPointerCapture((e as PointerEvent).pointerId);
      this.canvas.focus();
      move(e);
    });
    on(this.canvas, 'pointerup', move);
    on(this.canvas, 'contextmenu', (e) => e.preventDefault());
    // Not during the key press that started the graphics (it would be read twice).
    this.attachTimer = setTimeout(() => this.keyboard.attach(window));
    const loop = () => {
      if (this.dirty) this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy(): void {
    this.destroyed = true;
    this.buttons = this.pressed = 0;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.attachTimer);
    this.observer.disconnect();
    removeEventListener('resize', this.onResize);
    this.keyboard.detach();
    for (const [t, type, f] of this.listeners) t.removeEventListener(type, f);
    this.canvas.remove();
  }

  /**
   * Backing store. Shown large (3x or more), the smallest whole multiple of 320x200 at least
   * as big as the box: crisp pixels for editing. Shown small (the desk's monitor), the exact
   * device size, resampled smoothly from the next whole multiple so pixels stay even.
   */
  private fit(): void {
    const dpr = devicePixelRatio || 1;
    const r = this.holder.getBoundingClientRect(); // as shown, after any scaling around it
    const scale = Math.max((r.width * dpr) / SIZEX, (r.height * dpr) / SIZEY);
    const k = Math.max(1, Math.min(6, Math.ceil(scale)));
    const exact = scale < 3 && Math.abs(scale - Math.round(scale)) > 0.04;
    const [w, h] = exact ? [Math.round(SIZEX * scale), Math.round(SIZEY * scale)] : [SIZEX * k, SIZEY * k];
    this.upscale = exact ? k : 0;
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.dirty = true;
  }

  private render(): void {
    const { mem, dac, frame32 } = this;
    const c = (v: number) => ((v & 63) << 2) | ((v & 63) >> 4);
    const rgba = new Uint32Array(256);
    for (let i = 0; i < 256; i++) rgba[i] = 0xff000000 | (c(dac[i * 3 + 2]) << 16) | (c(dac[i * 3 + 1]) << 8) | c(dac[i * 3]);
    for (let i = 0; i < mem.length; i++) frame32[i] = rgba[mem[i]];
    if (this.cursorShown) {
      const x0 = Math.round(this.mx) - HOT_X;
      const y0 = Math.round(this.my) - HOT_Y;
      ARROW.forEach((row, y) =>
        [...row].forEach((p, x) => {
          const px = x0 + x;
          const py = y0 + y;
          if (p === ' ' || px < 0 || py < 0 || px >= SIZEX || py >= SIZEY) return;
          frame32[py * SIZEX + px] = p === '1' ? 0xff000000 : 0xffffffff;
        }),
      );
    }
    this.scaled.getContext('2d')!.putImageData(this.frame, 0, 0);
    if (this.upscale) {
      // blow the pixels up evenly, then shrink to the exact size smoothly
      const big = (this.big ??= document.createElement('canvas'));
      if (big.width !== SIZEX * this.upscale) [big.width, big.height] = [SIZEX * this.upscale, SIZEY * this.upscale];
      const b = big.getContext('2d')!;
      b.imageSmoothingEnabled = false;
      b.drawImage(this.scaled, 0, 0, big.width, big.height);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.drawImage(big, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(this.scaled, 0, 0, this.canvas.width, this.canvas.height);
    }
    this.dirty = false;
  }

  // ---- time ---------------------------------------------------------------------------

  /** The BIOS clock: 18.2 ticks a second. */
  get clock(): number {
    return Math.floor(((performance.now() - this.started) * 18.2065) / 1000);
  }

  /** Set when the program is being stopped from outside: tick() throws from then on. */
  private aborted = false;

  /** Stops the designer running on this screen (Computer.stopProgram). */
  abort(): void {
    this.aborted = true;
  }

  /** Lets the browser draw and take input; the designers' busy loops call this. */
  tick(): Promise<void> {
    if (this.aborted) return Promise.reject(new ProgramAborted());
    return new Promise((r) => requestAnimationFrame(() => r()));
  }

  delay(ms: number): Promise<void> {
    return sleep(ms);
  }

  // ---- mouse (MOUSEFN / TRANMOUS) ---------------------------------------------------

  private goto(x: number, y: number): void {
    const [x0, y0, x1, y1] = this.limit;
    this.mx = Math.max(x0, Math.min(x1, Math.floor(x)));
    this.my = Math.max(y0, Math.min(y1, Math.floor(y)));
    if (this.cursorShown) this.dirty = true;
  }

  /** moustats: x, y and buttons (1 = left, 2 = right). */
  moustats(): { x: number; y: number; but: number } {
    const but = this.buttons | this.pressed;
    this.pressed = 0;
    return { x: this.mx, y: this.my, but };
  }

  moucur(show: boolean): void {
    this.cursorShown = show;
    this.dirty = true;
  }

  moucurbox(x: number, y: number, x1: number, y1: number): void {
    this.limit = [x, y, x1, y1];
    this.goto(this.mx, this.my);
  }

  setmoupos(x: number, y: number): void {
    this.goto(x, y);
  }

  /** mouclearbut: waits until the buttons are up. */
  async mouclearbut(): Promise<void> {
    while (this.buttons && !this.destroyed) await this.tick();
    this.pressed = 0;
  }

  // ---- keyboard (bioskey) -------------------------------------------------------------

  /** bioskey(1) */
  keyReady(): boolean {
    return this.keyboard.peekKey() !== undefined;
  }

  /** bioskey(0), without waiting: the next typed key. */
  readKey(): TypedKey | undefined {
    return this.keyboard.readKey();
  }

  /** bioskey(0): waits for a key. */
  async getKey(): Promise<TypedKey> {
    for (;;) {
      const k = this.keyboard.readKey();
      if (k) return k;
      await this.tick();
    }
  }

  // ---- the DAC (PALA.ASM / PALC.C) ------------------------------------------------------

  /** Palette(): one DAC register. */
  palette(i: number, red: number, green: number, blue: number): void {
    this.dac.set([red & 63, green & 63, blue & 63], (i & 255) * 3);
    this.dirty = true;
  }

  setAllPal(pal: RGBdata[]): void {
    pal.forEach((c, i) => this.dac.set([c.red & 63, c.green & 63, c.blue & 63], i * 3));
    this.dirty = true;
  }

  setAllPalTo(c: RGBdata): void {
    for (let i = 0; i < 256; i++) this.dac.set([c.red & 63, c.green & 63, c.blue & 63], i * 3);
    this.dirty = true;
  }

  getAllPal(): RGBdata[] {
    return Array.from({ length: 256 }, (_, i) => ({ red: this.dac[i * 3], green: this.dac[i * 3 + 1], blue: this.dac[i * 3 + 2] }));
  }

  /** FadeTo: steps every DAC register toward `dest`, one step per vertical retrace (70 Hz). */
  async fadeTo(dest: RGBdata[], time = 65): Promise<void> {
    const cur = this.getAllPal();
    const start = performance.now();
    for (;;) {
      const f = Math.min(1, (performance.now() - start) / ((time * 1000) / 70));
      for (let i = 0; i < 256; i++) {
        const a = cur[i];
        const b = dest[i];
        this.dac.set(
          [Math.round(a.red + (b.red - a.red) * f), Math.round(a.green + (b.green - a.green) * f), Math.round(a.blue + (b.blue - a.blue) * f)],
          i * 3,
        );
      }
      this.dirty = true;
      if (f >= 1) return;
      await this.tick();
    }
  }

  // ---- drawing (GRAPHC.C) -------------------------------------------------------------

  /** Low256Point */
  point(x: number, y: number, col: number): void {
    if (x < 0 || y < 0 || x >= SIZEX || y >= SIZEY) return;
    this.mem[y * SIZEX + x] = col & 255;
    this.dirty = true;
  }

  getCol(x: number, y: number): number {
    return x < 0 || y < 0 || x >= SIZEX || y >= SIZEY ? 0 : this.mem[y * SIZEX + x];
  }

  line(x1: number, y1: number, x2: number, y2: number, col: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sdx = sign(dx);
    const sdy = sign(dy);
    const absdx = sdx * dx;
    const absdy = sdy * dy;
    let x = 0;
    let y = 0;
    this.point(x1, y1, col);
    if (absdx >= absdy) {
      for (let l = 0; l < absdx; l++) {
        y += absdy;
        if (y >= absdx) {
          y -= absdx;
          y1 += sdy;
        }
        x1 += sdx;
        this.point(x1, y1, col);
      }
    } else {
      for (let l = 0; l < absdy; l++) {
        x += absdx;
        if (x >= absdy) {
          x -= absdy;
          x1 += sdx;
        }
        y1 += sdy;
        this.point(x1, y1, col);
      }
    }
  }

  box(x: number, y: number, x1: number, y1: number, col: number): void {
    this.line(x, y, x1, y, col);
    this.line(x1, y, x1, y1, col);
    this.line(x1, y1, x, y1, col);
    this.line(x, y1, x, y, col);
  }

  /** BoxFill: inclusive corners, in either order. */
  boxFill(x: number, y: number, x1: number, y1: number, col: number): void {
    const [ax, bx] = x <= x1 ? [x, x1] : [x1, x];
    const [ay, by] = y <= y1 ? [y, y1] : [y1, y];
    for (let yy = Math.max(0, ay); yy <= Math.min(SIZEY - 1, by); yy++)
      this.mem.fill(col & 255, yy * SIZEX + Math.max(0, ax), yy * SIZEX + Math.min(SIZEX - 1, bx) + 1);
    this.dirty = true;
  }

  /** GPutChar: the ROM 8x8 font, transparent background. */
  putChar(x: number, y: number, col: number, code: number): void {
    for (let row = 0; row < 8; row++) {
      const bits = FONT_CP437[(code & 255) * 8 + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) this.point(x + b, y + row, col);
    }
  }

  /** GWrite: text with \n starting a new line 8 pixels down. */
  write(x: number, y: number, col: number, text: string): void {
    let cx = x;
    for (const ch of text) {
      if (ch === '\n') {
        y += 8;
        cx = x;
      } else {
        this.putChar(cx, y, col, ch.charCodeAt(0));
        cx += 8;
      }
    }
  }

  /**
   * draw4dat: a picture of 2-bit pixels (4 per byte, high bits first) using four colors;
   * a color of 255 is not drawn. Pictures are (len+1) x (wid+1) pixels.
   */
  draw4dat(x: number, y: number, pict: ArrayLike<number>, len: number, wid: number, col: ArrayLike<number>, rotation = 0): void {
    let x1 = rotation === 1 || rotation === 2 ? len : 0;
    let y1 = rotation === 2 || rotation === 3 ? wid : 0;
    let loop = 0;
    let pindex = 0;
    do {
      for (loop = 0; loop < 4; loop++) {
        const temp = ((pict[pindex] ?? 0) >> ((3 - loop) * 2)) & 3;
        if (!(rotation & 8 && temp === 0) && col[temp] !== 255) this.point(x + x1, y + y1, col[temp]);
        switch (rotation & 3) {
          case 0:
            x1++;
            if (x1 > len) {
              x1 = 0;
              y1++;
              if (y1 > wid) loop = 5;
            }
            break;
          case 1:
            y1++;
            if (y1 > len) {
              y1 = 0;
              x1--;
              if (x1 < 0) loop = 5;
            }
            break;
          case 2:
            x1--;
            if (x1 < 0) {
              x1 = len;
              y1--;
              if (y1 < 0) loop = 5;
            }
            break;
          case 3:
            y1--;
            if (y1 < 0) {
              y1 = len;
              x1++;
              if (x1 > wid) loop = 5;
            }
            break;
        }
      }
      pindex++;
    } while (loop < 5);
  }

  /**
   * GGet: types a short answer at (x, y) with a blinking box cursor. Returns the text
   * (and its length via the promise), or null for Esc.
   */
  async gget(x: number, y: number, col: number, bcol: number, start: string, maxlen: number): Promise<string | null> {
    let ans = start;
    this.write(x, y, col, ans);
    for (;;) {
      let on = false;
      let k: TypedKey | undefined;
      while (!(k = this.readKey())) {
        const blink = Math.floor(performance.now() / 450) % 2 === 0;
        if (blink !== on) {
          on = blink;
          const c = on ? col : bcol;
          if (ans.length < maxlen) this.box(x + ans.length * 8, y, x + (ans.length + 1) * 8 - 2, y + 7, c);
          else this.line(x + ans.length * 8 - 1, y, x + ans.length * 8 - 1, y + 7, c);
        }
        await this.tick();
      }
      if (ans.length < maxlen) this.box(x + ans.length * 8, y, x + (ans.length + 1) * 8 - 2, y + 7, bcol);
      else this.line(x + ans.length * 8 - 1, y, x + ans.length * 8 - 1, y + 7, bcol);
      if (k.ascii === 27) return null;
      if (k.ascii === 13) return ans;
      if (k.ascii === 8 || k.scan === 75) {
        if (ans.length) {
          ans = ans.slice(0, -1);
          this.boxFill(x + ans.length * 8, y, x + (ans.length + 1) * 8 - 1, y + 7, bcol);
        }
      } else if (k.ascii >= 32 && ans.length < maxlen) {
        ans += String.fromCharCode(k.ascii);
        this.write(x, y, col, ans);
      }
    }
  }
}
