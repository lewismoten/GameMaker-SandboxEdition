// The picture a link preview shows for a game's play page (og:image, 1200 x 630 PNG), made
// at build time: the game's title screen (or its menu, story or credits picture) scaled up
// by whole pixels, with the game's title and "Play in your browser · Game-Maker: Sandbox
// Edition" in the PC's 8x8 font. Original games use their box colors.
import { deflateSync } from 'node:zlib';
import type { CdCatalogEntry } from './cdGames';
import { decodeGif, isGif } from '../src/formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../src/formats/fli';
import { parseGame, sceneKind } from '../src/formats/game';
import { parseBackdrop, parseSlideList } from '../src/formats/graphicScripts';
import { vga8 } from '../src/formats/palette';
import { FONT8X8 } from '../src/gfx/font8x8';
import { PRODUCT } from '../src/edition';

export const CARD_W = 1200;
export const CARD_H = 630;

/** A picture as 8-bit RGB. */
export interface Rgb {
  width: number;
  height: number;
  data: Uint8Array;
}

type Read = (name: string) => Uint8Array | undefined;

const SCREEN_W = 320;
const SCREEN_H = 200;

/** An indexed picture as PLAYGAME shows it: its top-left 320 x 200 (from x, y), in RGB. */
function screenRgb(w: number, h: number, pixels: Uint8Array, palette: Uint8Array, x0 = 0, y0 = 0): Rgb {
  x0 = Math.max(0, Math.min(x0, w - 1));
  y0 = Math.max(0, Math.min(y0, h - 1));
  const width = Math.min(SCREEN_W, w - x0);
  const height = Math.min(SCREEN_H, h - y0);
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const c = pixels[(y + y0) * w + x + x0];
      for (let i = 0; i < 3; i++) data[(y * width + x) * 3 + i] = vga8(palette[c * 3 + i]);
    }
  return { width, height, data };
}

function decodeGraphic(name: string, read: Read): Rgb | undefined {
  const bytes = read(name.toLowerCase());
  if (!bytes) return undefined;
  const ext = name.toLowerCase().split('.').pop();
  try {
    if (ext === 'gif' && isGif(bytes)) {
      const img = decodeGif(bytes);
      return screenRgb(img.width, img.height, img.pixels, img.palette);
    }
    if (ext === 'bkd') {
      const b = parseBackdrop(bytes);
      const gif = read(b.gif.toLowerCase());
      if (!gif || !isGif(gif)) return undefined;
      const img = decodeGif(gif);
      return screenRgb(img.width, img.height, img.pixels, img.palette, b.x, b.y);
    }
    if (ext === 'fli' && isFli(bytes)) {
      const anim = parseFli(bytes);
      const c = newFliCanvas(anim);
      applyFliFrame(anim, 0, c);
      return screenRgb(anim.width, anim.height, c.pixels, c.palette);
    }
  } catch {
    // a damaged picture: try the next one
  }
  return undefined;
}

/** Most of the picture is one color (a black screen, a blank backdrop). */
function plain(pic: Rgb): boolean {
  const counts = new Map<number, number>();
  const n = pic.width * pic.height;
  for (let i = 0; i < n; i++) {
    const k = (pic.data[i * 3] << 16) | (pic.data[i * 3 + 1] << 8) | pic.data[i * 3 + 2];
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Math.max(...counts.values()) > n * 0.9;
}

// Pictures that are not the game's own title: Game-Maker's and A-J Games' "presents"
// screens, the Sandbox Software logo, the RSD text box, fades, load/save and score screens.
const NOT_THE_GAME = /^(gmtitle|sandlogo|rsdtbox|ajgames|black\.|c?fade(in|out)|(load|save)(game)?\.|hiscore|scores)/;

/**
 * The game's title screen, else its menu, story or credits picture (slide shows give their
 * slides), else any GIF it has. Still pictures come before animations, whose first frame is
 * often a fade.
 */
export function titlePicture(entry: CdCatalogEntry, read: Read): Rgb | undefined {
  const slots: string[] = ['title.gif'];
  const gam = entry.gam && read(entry.gam);
  if (gam) {
    try {
      const start = parseGame(gam).scenes.find((s) => sceneKind(s) === 'start');
      for (const f of [0, 2, 4, 7].map((i) => start?.files[i]?.toLowerCase()))
        if (f?.endsWith('.lst')) {
          const list = read(f);
          if (list) slots.push(...parseSlideList(list).map((s) => s.name));
        } else if (f) slots.push(f);
    } catch {
      // not a game file we can read: fall back to its pictures
    }
  }
  slots.push(...entry.files.filter((f) => f.endsWith('.gif')));
  const names = [...new Set(slots.map((n) => n.toLowerCase()))].filter((n) => !NOT_THE_GAME.test(n) && entry.files.includes(n));
  let fallback: Rgb | undefined;
  for (const name of [...names.filter((n) => !n.endsWith('.fli')), ...names.filter((n) => n.endsWith('.fli'))]) {
    const pic = decodeGraphic(name, read);
    if (!pic || pic.width < 64 || pic.height < 48) continue;
    if (!plain(pic)) return pic;
    fallback ??= pic;
  }
  return fallback;
}

// ------------------------------------------------------------------ drawing

type Color = [number, number, number];

const hex = (s: string | undefined, d: Color): Color => {
  const m = /^#?([0-9a-f]{6})$/i.exec(s ?? '');
  if (!m) return d;
  const v = parseInt(m[1], 16);
  return [v >> 16, (v >> 8) & 255, v & 255];
};

class Canvas {
  readonly data: Uint8Array;
  constructor(
    readonly width: number,
    readonly height: number,
    bg: Color,
  ) {
    this.data = new Uint8Array(width * height * 3);
    this.fill(0, 0, width, height, bg);
  }
  fill(x0: number, y0: number, w: number, h: number, c: Color): void {
    for (let y = Math.max(0, y0); y < Math.min(this.height, y0 + h); y++)
      for (let x = Math.max(0, x0); x < Math.min(this.width, x0 + w); x++) this.data.set(c, (y * this.width + x) * 3);
  }
  /** Draws a picture scaled up `s` times by whole pixels. */
  blit(pic: Rgb, x0: number, y0: number, s: number): void {
    for (let y = 0; y < pic.height * s; y++) {
      const row = Math.floor(y / s) * pic.width;
      for (let x = 0; x < pic.width * s; x++) {
        const o = ((y0 + y) * this.width + x0 + x) * 3;
        const i = (row + Math.floor(x / s)) * 3;
        this.data[o] = pic.data[i];
        this.data[o + 1] = pic.data[i + 1];
        this.data[o + 2] = pic.data[i + 2];
      }
    }
  }
  /** Text in the 8x8 font, `s` pixels per font pixel, with a shadow one font pixel down-right. */
  text(str: string, x0: number, y0: number, s: number, c: Color, shadow?: Color): void {
    if (shadow) this.text(str, x0 + s, y0 + s, s, shadow);
    [...str].forEach((ch, i) => {
      const rows = glyph(ch);
      for (let r = 0; r < 8; r++) for (let b = 0; b < 8; b++) if (rows[r] & (1 << b)) this.fill(x0 + (i * 8 + b) * s, y0 + r * s, s, s, c);
    });
  }
}

const MIDDLE_DOT = [0, 0, 0, 0x18, 0x18, 0, 0, 0];
const ASCII: Record<string, string> = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', é: 'e', è: 'e', á: 'a', ö: 'o', ü: 'u' };

/** Characters the font has (and the middle dot), so text measures one cell per character. */
const fontText = (s: string): string =>
  [...s]
    .map((c) => ASCII[c] ?? c)
    .join('')
    .replace(/[^\x20-\x7e·]/g, '?');

function glyph(ch: string): ArrayLike<number> {
  if (ch === '·') return MIDDLE_DOT;
  const code = ch.charCodeAt(0);
  return FONT8X8.subarray(code * 8, code * 8 + 8);
}

/** Words wrapped to `cols` characters a line (a longer word is cut). */
export function wrap(text: string, cols: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(/\s+/).filter(Boolean)) {
    while (word.length > cols) {
      if (line) (lines.push(line), (line = ''));
      lines.push(word.slice(0, cols));
      word = word.slice(cols);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= cols) line += ` ${word}`;
    else (lines.push(line), (line = word));
  }
  if (line) lines.push(line);
  return lines;
}

// ------------------------------------------------------------------ PNG

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A PNG chunk: length, type, data and CRC (also for scripts/gameShots.ts). */
export function pngChunk(type: string, data: Uint8Array): Uint8Array {
  return chunk(type, data);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc(out.subarray(4, 8 + data.length)));
  return out;
}

/** An RGB PNG. Rows the same as the one above use the Up filter (all zeros); others use Sub. */
export function encodePng(img: Rgb): Uint8Array {
  const stride = img.width * 3;
  const raw = new Uint8Array((stride + 1) * img.height);
  for (let y = 0; y < img.height; y++) {
    const row = img.data.subarray(y * stride, (y + 1) * stride);
    const o = y * (stride + 1);
    const same = y > 0 && row.every((v, i) => v === img.data[(y - 1) * stride + i]);
    raw[o] = same ? 2 : 1;
    if (same) continue; // Up: the differences are all zero
    for (let i = 0; i < stride; i++) raw[o + 1 + i] = (row[i] - (i >= 3 ? row[i - 3] : 0)) & 255;
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, img.width);
  dv.setUint32(4, img.height);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) out.set(p, (at += p.length) - p.length);
  return out;
}

// ------------------------------------------------------------------ the card

const TAGLINE = 'Play in your browser';

/** The 1200 x 630 card for a game, as RGB. */
export function gameCard(entry: CdCatalogEntry, pic: Rgb | undefined): Rgb {
  const box = entry.original?.box;
  const bg = hex(box?.background, [0x12, 0x12, 0x2a]);
  const accent = hex(box?.accent, [0xff, 0xff, 0x55]);
  const ink = hex(box?.ink, [0xe8, 0xe8, 0xf0]);
  const shadow: Color = [0, 0, 0];
  const muted: Color = [0, 1, 2].map((i) => Math.round(ink[i] * 0.65 + bg[i] * 0.35)) as Color;
  const c = new Canvas(CARD_W, CARD_H, bg);
  const M = 40;
  // the picture on the right, as big as whole pixels allow in 640 x 400 (2x a 320 x 200 screen)
  let textW = CARD_W - 2 * M;
  let top = M;
  let bottom = CARD_H - M;
  if (pic) {
    const s = Math.max(1, Math.min(Math.floor(640 / pic.width), Math.floor(400 / pic.height)));
    const pw = pic.width * s;
    const ph = pic.height * s;
    const px = CARD_W - M - 640 + (640 - pw) / 2;
    const py = (CARD_H - ph) / 2;
    c.fill(px - 6, py - 6, pw + 12, ph + 12, muted);
    c.fill(px - 2, py - 2, pw + 4, ph + 4, shadow);
    c.blit(pic, px, py, s);
    textW = CARD_W - M - 640 - M - M;
    top = py;
    bottom = py + ph;
  }
  // the title, as big as fits in a few lines
  const title = fontText(entry.title);
  const maxLines = pic ? 5 : 3;
  let scale = 6;
  let lines = wrap(title, Math.floor(textW / (8 * scale)));
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  while (scale > 2 && (lines.length > maxLines || longest * 8 * scale > textW)) lines = wrap(title, Math.floor(textW / (8 * --scale)));
  let y = top;
  for (const line of lines) {
    c.text(line, M, y, scale, accent, shadow);
    y += 10 * scale;
  }
  const credit = fontText([entry.author ?? entry.company, entry.year].filter(Boolean).join(', '));
  if (credit) {
    y += 8;
    for (const line of wrap(credit, Math.floor(textW / 16)).slice(0, 2)) {
      c.text(line, M, y, 2, muted, shadow);
      y += 22;
    }
  }
  // "Play in your browser · Game-Maker: Sandbox Edition" along the bottom
  const product = fontText(PRODUCT);
  const one = `${TAGLINE} · ${product}`;
  const foot = one.length * 16 <= textW ? [one] : [`${TAGLINE} ·`, product];
  foot.forEach((line, i) => c.text(line, M, bottom - (foot.length - i) * 26 + 10, 2, ink, shadow));
  return { width: CARD_W, height: CARD_H, data: c.data };
}

/** The game's preview card as a PNG. `read` gives the game's files by lower-case name. */
export function gameCardPng(entry: CdCatalogEntry, read: Read): Uint8Array {
  return encodePng(gameCard(entry, titlePicture(entry, read)));
}
