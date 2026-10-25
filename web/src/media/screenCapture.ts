// Pictures of the PC's screen at the resolution the VGA card really put out:
//  - text mode (mode 3): 720x400, 80x25 cells of 9x16 dots. The ninth column of a cell is
//    the background, except for the line drawing characters C0h-DFh, which repeat their
//    eighth column so boxes join up (as the VGA's Line Graphics Enable did).
//  - mode 13h: 320x200, one pixel per palette index.
import { FONT_CP437 } from '../gfx/cp437Glyphs';
import { COLS, ROWS, type TextScreen } from '../retro/text/textScreen';
import type { Vga } from '../vga/shared/vga';

export const TEXT_W = COLS * 9; // 720
export const TEXT_H = ROWS * 16; // 400
export const VGA_W = 320;
export const VGA_H = 200;

/** Draws a text screen into 720x400 RGBA pixels (little-endian ABGR words). */
export function textPixels(chars: Uint8Array, attrs: Uint8Array, colors: Uint32Array, out: Uint32Array, cursor?: [number, number]): void {
  for (let cy = 0; cy < ROWS; cy++)
    for (let cx = 0; cx < COLS; cx++) {
      const i = cy * COLS + cx;
      const a = attrs[i];
      const fg = colors[a & 15];
      const bg = colors[(a >> 4) & 15];
      const ch = chars[i];
      const lineChar = ch >= 0xc0 && ch <= 0xdf;
      const isCursor = cursor && cursor[0] === cx && cursor[1] === cy;
      for (let row = 0; row < 8; row++) {
        let bits = FONT_CP437[ch * 8 + row];
        if (isCursor && row >= 6) bits = 0xff;
        for (let line = 0; line < 2; line++) {
          const o = (cy * 16 + row * 2 + line) * TEXT_W + cx * 9;
          for (let b = 0; b < 8; b++) out[o + b] = bits & (1 << b) ? fg : bg;
          out[o + 8] = lineChar && bits & 0x80 ? fg : bg;
        }
      }
    }
}

/** Draws a TextScreen as it shows now (its palette and blinking cursor) into a 720x400 canvas. */
export function drawText(screen: TextScreen, canvas: HTMLCanvasElement | OffscreenCanvas): void {
  if (canvas.width !== TEXT_W) canvas.width = TEXT_W;
  if (canvas.height !== TEXT_H) canvas.height = TEXT_H;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const img = ctx.createImageData(TEXT_W, TEXT_H);
  // the palette and cursor blink are the screen's own (private) state
  const colors = screen['colors'] as Uint32Array;
  const blinkOn = screen['blinkOn'];
  const cursor: [number, number] | undefined = screen.cursorVisible && blinkOn ? [screen.cursorX, screen.cursorY] : undefined;
  textPixels(screen.chars, screen.attrs, colors, new Uint32Array(img.data.buffer), cursor);
  ctx.putImageData(img, 0, 0);
}

/** Draws mode 13h video memory through the DAC into a 320x200 canvas. */
export function drawVga(vga: Pick<Vga, 'mem' | 'dac'>, canvas: HTMLCanvasElement | OffscreenCanvas): void {
  if (canvas.width !== VGA_W) canvas.width = VGA_W;
  if (canvas.height !== VGA_H) canvas.height = VGA_H;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const img = ctx.createImageData(VGA_W, VGA_H);
  const out = new Uint32Array(img.data.buffer);
  const c = (v: number) => ((v & 63) << 2) | ((v & 63) >> 4);
  const rgba = new Uint32Array(256);
  for (let i = 0; i < 256; i++) rgba[i] = 0xff000000 | (c(vga.dac[i * 3 + 2]) << 16) | (c(vga.dac[i * 3 + 1]) << 8) | c(vga.dac[i * 3]);
  for (let i = 0; i < VGA_W * VGA_H; i++) out[i] = rgba[vga.mem[i]];
  ctx.putImageData(img, 0, 0);
}

/** A canvas as PNG bytes. */
export function pngOf(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? void b.arrayBuffer().then((a) => resolve(new Uint8Array(a))) : reject(new Error('PNG failed'))), 'image/png'),
  );
}

/** A file name time stamp: 2026-10-20-1912. */
export function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
