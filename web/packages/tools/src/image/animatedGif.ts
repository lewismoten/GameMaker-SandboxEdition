// An animated GIF (GIF89a) from indexed frames that each carry their own 6-bit VGA palette, as an
// FLI animation's frames do. Used for the previews on the one-page web export. Looping, 1/100 s delays.
import { lzwEncode } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { PALETTE_SIZE, vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

export interface AnimatedFrame {
  /** width * height palette indexes. */
  pixels: Uint8Array;
  /** 768 bytes, 6 bits per channel. */
  palette: Uint8Array;
  /** Hundredths of a second this frame shows. */
  delay: number;
}

export function encodeAnimatedGif(width: number, height: number, frames: AnimatedFrame[]): Uint8Array {
  const out: number[] = [];
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a
  u16(width);
  u16(height);
  out.push(0x00, 0, 0); // no global color table
  // loop forever
  out.push(0x21, 0xff, 0x0b, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 0x03, 0x01, 0, 0, 0);
  for (const f of frames) {
    // graphic control: no disposal, delay
    out.push(0x21, 0xf9, 0x04, 0x00);
    u16(Math.max(2, Math.round(f.delay)));
    out.push(0, 0);
    out.push(0x2c);
    u16(0);
    u16(0);
    u16(width);
    u16(height);
    out.push(0x87); // local color table, 256 entries
    for (let i = 0; i < PALETTE_SIZE; i++) out.push(vga8(f.palette[i]));
    out.push(8);
    const data = lzwEncode(f.pixels, 8);
    for (let i = 0; i < data.length; i += 255) {
      const n = Math.min(255, data.length - i);
      out.push(n);
      for (let j = 0; j < n; j++) out.push(data[i + j]);
    }
    out.push(0);
  }
  out.push(0x3b);
  return Uint8Array.from(out);
}
