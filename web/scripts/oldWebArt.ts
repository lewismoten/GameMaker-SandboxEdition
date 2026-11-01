// Pixel art for the Dandelion Pages mockup (oldWebPages.ts): a 468 x 60 banner, the tiled name
// background and four textured buttons, drawn pixel by pixel with a few colors, the way a 1996
// GIF was, and written as small indexed PNGs (data URIs). Bevels and shadows are baked into the
// pixels, since a page could not draw them. Drawn fresh for this repo: no real logo or font.
import { deflateSync } from 'node:zlib';

const FONT: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001',
  B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01111 10000 10000 10000 10000 10000 01111',
  D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111',
  F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01111 10000 10000 10011 10001 10001 01111',
  H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111',
  J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001',
  N: '10001 11001 10101 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101',
  R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110',
  T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001',
  X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100',
  Z: '11111 00001 00010 00100 01000 10000 11111',
  '-': '00000 00000 00000 11111 00000 00000 00000',
  '!': '00100 00100 00100 00100 00100 00000 00100',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
};

type Rgb = [number, number, number];

class Canvas {
  readonly px: Uint8Array;
  readonly palette: Rgb[] = [];
  constructor(
    readonly w: number,
    readonly h: number,
    fill: Rgb,
  ) {
    this.px = new Uint8Array(w * h).fill(this.idx(fill));
  }
  idx(c: Rgb): number {
    const i = this.palette.findIndex((p) => p[0] === c[0] && p[1] === c[1] && p[2] === c[2]);
    if (i >= 0) return i;
    this.palette.push(c);
    return this.palette.length - 1;
  }
  set(x: number, y: number, c: Rgb): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = this.idx(c);
  }
  rect(x: number, y: number, w: number, h: number, c: Rgb): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** A one-pixel frame, lit from the top left (light) or the bottom right (dark). */
  bevel(x: number, y: number, w: number, h: number, light: Rgb, dark: Rgb, depth = 2): void {
    for (let d = 0; d < depth; d++) {
      this.rect(x + d, y + d, w - 2 * d, 1, light);
      this.rect(x + d, y + d, 1, h - 2 * d, light);
      this.rect(x + d, y + h - 1 - d, w - 2 * d, 1, dark);
      this.rect(x + w - 1 - d, y + d, 1, h - 2 * d, dark);
    }
  }
  text(s: string, x: number, y: number, scale: number, c: Rgb, shadow?: Rgb): number {
    for (const pass of shadow ? [shadow, c] : [c]) {
      const o = pass === shadow ? scale : 0;
      let cx = x;
      for (const ch of s) {
        FONT[ch]
          ?.split(' ')
          .forEach((row, r) => [...row].forEach((bit, col) => bit === '1' && this.rect(cx + o + col * scale, y + o + r * scale, scale, scale, pass)));
        cx += 6 * scale;
      }
    }
    return s.length * 6 * scale - scale;
  }
  /** A filled disc. */
  disc(cx: number, cy: number, r: number, c: Rgb): void {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r / 2) this.set(cx + x, cy + y, c);
  }
  png(): string {
    const raw = Buffer.alloc((this.w + 1) * this.h);
    for (let y = 0; y < this.h; y++) Buffer.from(this.px.subarray(y * this.w, (y + 1) * this.w)).copy(raw, y * (this.w + 1) + 1);
    const chunk = (type: string, data: Buffer): Buffer => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const body = Buffer.concat([Buffer.from(type), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(body) >>> 0);
      return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr.set([8, 3, 0, 0, 0], 8);
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('PLTE', Buffer.from(this.palette.flat())),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    return `data:image/png;base64,${png.toString('base64')}`;
  }
}

function crc32(b: Buffer): number {
  let c = ~0;
  for (const byte of b) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

const YEL: Rgb = [255, 225, 74];
const GOLD: Rgb = [240, 180, 0];
const PALE: Rgb = [246, 201, 58];
const RED: Rgb = [204, 0, 0];
const DRED: Rgb = [112, 0, 0];
const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];
const SKIN: Rgb = [242, 185, 140];
const CREAM: Rgb = [243, 217, 160];

/** The 468 x 60 banner: a rotary dial with a finger in a hole, and the name in chunky yellow letters. */
export function dandelionBanner(): string {
  const c = new Canvas(468, 60, RED);
  c.bevel(0, 0, 468, 60, [255, 96, 96], DRED, 3);
  c.disc(32, 30, 22, BLACK);
  c.disc(32, 30, 8, CREAM);
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * (0.55 + i * 0.16) + 0.2;
    c.disc(Math.round(32 + Math.cos(a) * 15), Math.round(30 + Math.sin(a) * 15), 3, YEL);
  }
  c.rect(40, 36, 6, 20, SKIN);
  c.rect(37, 44, 12, 12, SKIN);
  c.rect(46, 36, 1, 20, BLACK);
  c.text('DANDELION', 66, 8, 4, YEL, BLACK);
  c.text('PAGES', 290, 8, 4, YEL, BLACK);
  c.rect(66, 42, 378, 2, GOLD);
  c.text('THE YELLOW PAGES OF THE NET', 66, 47, 1, WHITE);
  return c.png();
}

/** The page background: the site's own name over and over in two shades of yellow. */
export function dandelionTile(): string {
  const c = new Canvas(140, 24, YEL);
  c.text('DANDELION PAGES', 2, 2, 1, GOLD);
  c.text('DANDELION PAGES', 50, 14, 1, PALE);
  return c.png();
}

/** A textured brown-orange button, with its lit and shaded edges baked in. */
export function textureButton(label: string): Picture {
  const w = Math.max(60, label.length * 12 + 16);
  const c = new Canvas(w, 26, [232, 162, 26]);
  for (let y = 0; y < 26; y++) for (let x = 0; x < w; x++) if ((x + y) % 4 < 2) c.set(x, y, [212, 138, 8]);
  c.bevel(0, 0, w, 26, [247, 210, 122], [110, 60, 0], 2);
  c.text(label, Math.round((w - (label.length * 12 - 2)) / 2) + 1, 6, 2, [42, 21, 0], [247, 210, 122]);
  return { src: c.png(), w, h: 26 };
}

export interface Picture {
  src: string;
  w: number;
  h: number;
}

/** A 468 x 56 banner of chunky letters on a color, with a baked-in bevel and drop shadow. */
export function textBanner(bg: Rgb, fg: Rgb, text: string, sub: string): string {
  const c = new Canvas(468, 56, bg);
  c.bevel(0, 0, 468, 56, [Math.min(255, bg[0] + 90), Math.min(255, bg[1] + 90), Math.min(255, bg[2] + 90)], [0, 0, 20], 3);
  const w = text.length * 24 - 4;
  c.text(text, Math.round((468 - w) / 2), 7, 4, fg, BLACK);
  c.text(sub, Math.round((468 - (sub.length * 6 - 1)) / 2), 45, 1, WHITE);
  return c.png();
}
