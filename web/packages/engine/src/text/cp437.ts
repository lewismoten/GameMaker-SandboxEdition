// IBM code page 437 as Unicode: converting text written with Unicode symbols, accents and box
// characters to CP437 byte codes for DOS text screens, and back. The font that draws the
// codes is FONT_CP437 (gfx/cp437Glyphs.ts).

/** What a PC showed for each code 0-255 (NUL as itself; 1-31 and 127 as their glyphs). */
const CP437 =
  '\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼' +
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂' +
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»' +
  '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
  'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0';

/** Unicode character to CP437 code, for 1-31 and 127-255 (ASCII stays as it is). */
const CODE = new Map<string, number>();
for (let c = 1; c < 256; c++) if (c < 32 || c > 126) CODE.set(CP437[c], c);
// Look-alikes people type for the same glyph.
for (const [ch, c] of [
  ['\u03b2', 225], // β beta for ß
  ['\u03bc', 230], // μ mu for µ
  ['\u2126', 234], // Ω ohm for Ω
  ['\u2211', 228], // ∑ sum for Σ
  ['\u03d5', 237], // ϕ for φ
  ['\u2208', 238], // ∈ for ε
] as const)
  CODE.set(ch, c);

/** Typography with no CP437 code, as a DOS user would have typed it. */
const ASCII: Record<string, string> = { '–': '-', '—': '--', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', '×': 'x' };

/** Converts a string written with Unicode symbols, accents and box characters to CP437 byte codes. */
export function toCp437(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = CODE.get(ch);
    out += c !== undefined ? String.fromCharCode(c) : (ASCII[ch] ?? ch);
  }
  return out;
}

/** Converts CP437 byte codes to the Unicode characters a PC showed for them. */
export function fromCp437(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out += c < 256 ? CP437[c] : s[i];
  }
  return out;
}
