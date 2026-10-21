// IBM code page 437 graphics characters (box drawing, shades, arrows) for the 8x8
// font, so DOS text screens and Game-Maker's .HLP files draw as they did.
// Rows are given most-significant-bit-left, as in the IBM ROM font, and stored in
// FONT8X8's least-significant-bit-left order.
import { FONT8X8 } from '../gfx/font8x8';

const GLYPHS: Record<number, string> = {
  16: '80e0f8fef8e08000', // ►
  17: '020e3efe3e0e0200', // ◄
  18: '183c7e18187e3c18', // ↕
  24: '183c7e1818181800', // ↑
  25: '181818187e3c1800', // ↓
  26: '00180cfe0c180000', // →
  27: '003060fe60300000', // ←
  30: '0018183c7eff0000', // ▲
  31: '00ff7e3c18180000', // ▼
  176: '2288228822882288', // ░
  177: '55aa55aa55aa55aa', // ▒
  178: 'dd77dd77dd77dd77', // ▓
  179: '1818181818181818', // │
  180: '181818f818181818', // ┤
  181: '1818f818f8181818', // ╡
  182: '363636f636363636', // ╢
  183: '000000fe36363636', // ╖
  184: '0000f818f8181818', // ╕
  185: '3636f606f6363636', // ╣
  186: '3636363636363636', // ║
  187: '0000fe06f6363636', // ╗
  188: '3636f606fe000000', // ╝
  189: '363636fe00000000', // ╜
  190: '1818f818f8000000', // ╛
  191: '000000f818181818', // ┐
  192: '1818181f00000000', // └
  193: '181818ff00000000', // ┴
  194: '000000ff18181818', // ┬
  195: '1818181f18181818', // ├
  196: '000000ff00000000', // ─
  197: '181818ff18181818', // ┼
  198: '18181f181f181818', // ╞
  199: '3636363736363636', // ╟
  200: '363637303f000000', // ╚
  201: '00003f3037363636', // ╔
  202: '3636f700ff000000', // ╩
  203: '0000ff00f7363636', // ╦
  204: '3636373037363636', // ╠
  205: '0000ff00ff000000', // ═
  206: '3636f700f7363636', // ╬
  207: '1818ff00ff000000', // ╧
  208: '363636ff00000000', // ╨
  209: '0000ff00ff181818', // ╤
  210: '000000ff36363636', // ╥
  211: '3636363f00000000', // ╙
  212: '18181f181f000000', // ╘
  213: '00001f181f181818', // ╒
  214: '0000003f36363636', // ╓
  215: '363636ff36363636', // ╫
  216: '1818ff18ff181818', // ╪
  217: '181818f800000000', // ┘
  218: '0000001f18181818', // ┌
  219: 'ffffffffffffffff', // █
  220: '00000000ffffffff', // ▄
  221: 'f0f0f0f0f0f0f0f0', // ▌
  222: '0f0f0f0f0f0f0f0f', // ▐
  223: 'ffffffff00000000', // ▀
  249: '0000001818000000', // ∙
  250: '0000000018000000', // ·
  254: '00003c3c3c3c0000', // ■
};

function reverseBits(b: number): number {
  let r = 0;
  for (let i = 0; i < 8; i++) if (b & (1 << i)) r |= 1 << (7 - i);
  return r;
}

/** FONT8X8 plus CP437 graphics characters (256 x 8 rows, LSB = leftmost pixel). */
export const FONT_CP437: Uint8Array = (() => {
  const f = FONT8X8.slice();
  for (const [code, hex] of Object.entries(GLYPHS)) {
    for (let row = 0; row < 8; row++) f[Number(code) * 8 + row] = reverseBits(parseInt(hex.slice(row * 2, row * 2 + 2), 16));
  }
  f.fill(0, 0, 8); // NUL is blank
  return f;
})();

// CP437 176..223 (shades, box drawing, blocks), then a few others.
const UNICODE = '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀■·∙►◄▲▼↑↓→←↕';
const CODES = [...Array.from({ length: 48 }, (_, i) => 176 + i), 254, 250, 249, 16, 17, 30, 31, 24, 25, 26, 27, 18];

/** Typography with no CP437 code, as a DOS user would have typed it. */
const ASCII: Record<string, string> = { '–': '-', '—': '--', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', '×': 'x', '½': '1/2' };

/** Converts a string written with Unicode box characters to CP437 byte codes. */
export function toCp437(s: string): string {
  let out = '';
  for (const ch of s) {
    const i = UNICODE.indexOf(ch);
    out += i >= 0 ? String.fromCharCode(CODES[i]) : (ASCII[ch] ?? ch);
  }
  return out;
}
