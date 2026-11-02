// The IBM PC's code page 437 glyphs past printable ASCII (1-31, 127-255) for the 8x8
// font, so DOS text screens, Game-Maker's .HLP files and PLAYGAME's text show every byte
// as a real PC's BIOS font did. Glyphs marked (ext_latin), (greek) or (misc) are from Daniel
// Hepper's public-domain font8x8 sets of those names (github.com/dhepper/font8x8); the rest
// were drawn for this project in the same style. None are copied from IBM's ROM.
// Rows are given most-significant-bit-left, and stored in FONT8X8's least-significant-bit-left order.
import { FONT8X8 } from './font8x8';

const GLYPHS: Record<number, string> = {
  1: '3c42a581a599423c', // ☺
  2: '3c7edbffdbe77e3c', // ☻
  3: '6cfefefe7c381000', // ♥
  4: '10387cfe7c381000', // ♦
  5: '387c38fefed61038', // ♣
  6: '10387cfefe543800', // ♠
  7: '0000183c3c180000', // •
  8: 'ffffe7c3c3e7ffff', // ◘
  9: '003c424242423c00', // ○
  10: 'ffc3bdbdbdbdc3ff', // ◙
  11: '0f03057988888870', // ♂
  12: '3844444438107c10', // ♀
  13: '181c16121070f060', // ♪
  14: '3f21212163e7c600', // ♫
  15: '925438ee38549200', // ☼
  16: '80e0f8fef8e08000', // ►
  17: '020e3efe3e0e0200', // ◄
  18: '183c7e18187e3c18', // ↕
  19: '6c6c6c6c6c006c00', // ‼
  20: '7fdbdb7b1b1b1b00', // ¶ (ext_latin)
  21: '3e63386c6c38cc78', // § (ext_latin)
  22: '00000000fefefe00', // ▬
  23: '183c7e187e3c18ff', // ↨
  24: '183c7e1818181800', // ↑
  25: '181818187e3c1800', // ↓
  26: '00180cfe0c180000', // →
  27: '003060fe60300000', // ←
  28: '0000c0c0c0fefe00', // ∟
  29: '002466ff66240000', // ↔
  30: '0018183c7eff0000', // ▲
  31: '00ff7e3c18180000', // ▼
  127: '102844828282fe00', // ⌂
  128: '78ccc0cc78180c78', // Ç (ext_latin)
  129: '00cc00cccccc7e00', // ü (ext_latin)
  130: '1c0078ccfcc07800', // é (ext_latin)
  131: '7ec33c063e663f00', // â (ext_latin)
  132: 'cc00780c7ccc7e00', // ä (ext_latin)
  133: 'e000780c7ccc7e00', // à (ext_latin)
  134: '3030780c7ccc7e00', // å (ext_latin)
  135: '000078c0c0780c38', // ç (ext_latin)
  136: '7ec33c667e603c00', // ê (ext_latin)
  137: 'cc0078ccfcc07800', // ë (ext_latin)
  138: 'e00078ccfcc07800', // è (ext_latin)
  139: 'cc00703030307800', // ï (ext_latin)
  140: '7cc6381818183c00', // î (ext_latin)
  141: 'e000703030307800', // ì (ext_latin)
  142: 'c6386cc6fec6c600', // Ä (ext_latin)
  143: '30300078ccfccc00', // Å (ext_latin)
  144: '1c00fc607860fc00', // É (ext_latin)
  145: '00007f0c7fcc7f00', // æ (ext_latin)
  146: '3e6cccfeccccce00', // Æ (ext_latin)
  147: '78cc0078cccc7800', // ô (ext_latin)
  148: '00cc0078cccc7800', // ö (ext_latin)
  149: '00e00078cccc7800', // ò (ext_latin)
  150: '78cc00cccccc7e00', // û (ext_latin)
  151: '00e000cccccc7e00', // ù (ext_latin)
  152: '00cc00cccc7c0cf8', // ÿ (ext_latin)
  153: 'c3183c66663c1800', // Ö (ext_latin)
  154: 'cc00cccccccc7800', // Ü (ext_latin)
  155: '18187ec0c07e1818', // ¢ (ext_latin)
  156: '386c64f060e6fc00', // £ (ext_latin)
  157: 'cccc78fc30fc3030', // ¥ (ext_latin)
  158: 'f8ccccfac6cfc6c7', // ₧ (misc)
  159: '0e1b183c1818d870', // ƒ (misc)
  160: '1c00780c7ccc7e00', // á (ext_latin)
  161: '3800703030307800', // í (ext_latin)
  162: '001c0078cccc7800', // ó (ext_latin)
  163: '001c00cccccc7e00', // ú (ext_latin)
  164: '00f800f8cccccc00', // ñ (ext_latin)
  165: 'fc00ccecfcdccc00', // Ñ (ext_latin)
  166: '3c6c6c3e007e0000', // ª (misc)
  167: '386c6c38007c0000', // º (misc)
  168: '30003060c0cc7800', // ¿ (ext_latin)
  169: '000000fcc0c00000', // ⌐ (misc)
  170: '000000fc0c0c0000', // ¬ (ext_latin)
  171: 'c3c6ccde3366cc0f', // ½ (ext_latin)
  172: 'c3c6ccbd376fcfc0', // ¼ (ext_latin)
  173: '1818001818181800', // ¡ (ext_latin)
  174: '003366cc66330000', // « (ext_latin)
  175: '00cc663366cc0000', // » (ext_latin)
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
  224: '000076dcc8dc7600', // α (greek)
  225: '0078ccf8ccf8c0c0', // ß (ext_latin)
  226: 'fcccc0c0c0c0c000', // Γ (greek)
  227: '0000fe6c6c6c6c00', // π (greek)
  228: 'fec6603060c6fe00', // Σ (greek)
  229: '00007ed8d8d87000', // σ (greek)
  230: '00006666667c60c0', // µ (ext_latin)
  231: '00007e18181a0c00', // τ (greek)
  232: '187edbdbdb7e1800', // Φ (greek)
  233: '386cc6fec66c3800', // Θ (greek)
  234: '7cc6c6c66c6cee00', // Ω (greek)
  235: '1c30187ccccc7800', // δ (greek)
  236: '00006c92926c0000', // ∞
  237: '00006edbdb7e1800', // φ (greek)
  238: '000078c070c07800', // ε (greek)
  239: '003c666666666600', // ∩
  240: '007e007e007e0000', // ≡
  241: '18187e1818007e00', // ± (ext_latin)
  242: '30180c1830007e00', // ≥ (misc)
  243: '0c1830180c007e00', // ≤ (misc)
  244: '0e1b1b1818181818', // ⌠
  245: '18181818d8d87000', // ⌡
  246: '1818007e00181800', // ÷ (ext_latin)
  247: '0076dc0076dc0000', // ≈
  248: '386c6c3800000000', // ° (ext_latin)
  249: '0000001818000000', // ∙
  250: '0000000018000000', // ·
  251: '0f08080888482818', // √
  252: 'f8cccccc00000000', // ⁿ
  253: '380c18303c000000', // ² (ext_latin)
  254: '00003c3c3c3c0000', // ■
  255: '0000000000000000', // NBSP (ext_latin)
};

function reverseBits(b: number): number {
  let r = 0;
  for (let i = 0; i < 8; i++) if (b & (1 << i)) r |= 1 << (7 - i);
  return r;
}

/** The whole CP437 8x8 font: FONT8X8's ASCII plus GLYPHS, with NUL blank (256 x 8 rows, LSB = leftmost pixel). */
export const FONT_CP437: Uint8Array = (() => {
  const f = FONT8X8.slice();
  for (const [code, hex] of Object.entries(GLYPHS)) {
    for (let row = 0; row < 8; row++) f[Number(code) * 8 + row] = reverseBits(parseInt(hex.slice(row * 2, row * 2 + 2), 16));
  }
  f.fill(0, 0, 8); // NUL is blank
  return f;
})();
