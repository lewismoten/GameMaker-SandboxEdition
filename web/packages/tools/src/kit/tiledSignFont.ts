// Compact and micro sign letters/layout by OpenAI Codex, adapted from the project's MIT 3×5 font.
// Keep compact counters open and micro words intact across the board.
import { MICRO_GLYPHS } from '../microFont';
const LETTERS: Readonly<Record<string, string>> = {
  '→': '0000/0000/0100/0010/1111/0010/0100/0000',
  A: '0110/1001/1001/1001/1111/1001/1001/1001',
  B: '1110/1001/1001/1110/1001/1001/1001/1110',
  C: '0111/1000/1000/1000/1000/1000/1000/0111',
  D: '1110/1001/1001/1001/1001/1001/1001/1110',
  E: '1111/1000/1000/1110/1000/1000/1000/1111',
  F: '1111/1000/1000/1110/1000/1000/1000/1000',
  G: '0111/1000/1000/1000/1011/1001/1001/0111',
  H: '1001/1001/1001/1111/1001/1001/1001/1001',
  I: '1110/0100/0100/0100/0100/0100/0100/1110',
  J: '0011/0001/0001/0001/0001/1001/1001/0110',
  K: '1001/1001/1010/1100/1010/1001/1001/1001',
  L: '1000/1000/1000/1000/1000/1000/1000/1111',
  M: '1001/1111/1111/1001/1001/1001/1001/1001',
  N: '1001/1001/1101/1101/1011/1011/1001/1001',
  O: '0110/1001/1001/1001/1001/1001/1001/0110',
  P: '1110/1001/1001/1001/1110/1000/1000/1000',
  Q: '0110/1001/1001/1001/1001/1011/0110/0001',
  R: '1110/1001/1001/1001/1110/1010/1001/1001',
  S: '0111/1000/1000/0110/0001/0001/0001/1110',
  T: '1111/0100/0100/0100/0100/0100/0100/0100',
  U: '1001/1001/1001/1001/1001/1001/1001/0110',
  V: '1001/1001/1001/1001/1001/1001/0110/0110',
  W: '1001/1001/1001/1001/1001/1111/1111/1001',
  X: '1001/1001/1001/0110/0110/1001/1001/1001',
  Y: '1001/1001/1001/0110/0100/0100/0100/0100',
  Z: '1111/0001/0001/0010/0100/1000/1000/1111',
  '0': '0110/1001/1001/1011/1101/1001/1001/0110',
  '1': '0100/1100/0100/0100/0100/0100/0100/1110',
  '2': '0110/1001/0001/0001/0010/0100/1000/1111',
  '3': '1110/0001/0001/0110/0001/0001/0001/1110',
  '4': '1001/1001/1001/1111/0001/0001/0001/0001',
  '5': '1111/1000/1000/1110/0001/0001/0001/1110',
  '6': '0111/1000/1000/1110/1001/1001/1001/0110',
  '7': '1111/0001/0001/0010/0010/0100/0100/0100',
  '8': '0110/1001/1001/0110/1001/1001/1001/0110',
  '9': '0110/1001/1001/0111/0001/0001/0001/1110',
};

/** Custom 3×5 symbols and punctuation retain their shape at 4×8; letters get open counters. */
export function compactGlyph(ch: string, micro: string): string {
  const letter = LETTERS[ch];
  if (letter) return letter.replaceAll('/', '');
  return Array.from({ length: 32 }, (_, i) => {
    const x = i % 4,
      y = Math.floor(i / 4) - 1;
    return x < 3 && y >= 0 && y < 5 ? micro[y * 3 + x] : '0';
  }).join('');
}

/** Capital N/M/W fallbacks and a tailed Q for narrow micro signs. */
const MICRO_SIGN_LETTERS: Readonly<Record<string, string>> = {
  N: '101111111111101',
  M: '101111101101101',
  W: '101101101111101',
  Q: '111101101111001',
};

/** Refine default letters only in micro signs; custom glyphs and other font modes stay intact. */
export function microSignGlyph(ch: string, glyph: string): string {
  return glyph === MICRO_GLYPHS[ch] ? (MICRO_SIGN_LETTERS[ch] ?? glyph) : glyph;
}

/** Wide forms expose the diagonal of capital N, the valleys of W and the notch of M. */
const WIDE_MICRO: Readonly<Record<string, string>> = {
  N: '10011101110110111001',
  W: '1000110001101011010101010',
  M: '1000111011101011000110001',
};

/** Spend the line's spare pixels on wide N/W/M, left to right; preserve custom forms. */
export function microSignLine(line: string, glyphs: Readonly<Record<string, string>>, capacity: number): { glyphs: string[]; width: number } {
  const narrow = [...line].map((ch) => {
    if (glyphs[ch] === undefined) throw new Error(`No tiny sign glyph for "${ch}"`);
    return microSignGlyph(ch, glyphs[ch]);
  });
  const measure = (forms: string[]) => forms.reduce((sum, form) => sum + form.length / 5 + 1, -1);
  let spare = capacity - measure(narrow);
  const forms = [...line].map((ch, i) => {
    const wide = glyphs[ch] === MICRO_GLYPHS[ch] ? WIDE_MICRO[ch] : undefined;
    const extra = wide ? (wide.length - narrow[i].length) / 5 : 0;
    if (!wide || spare < extra) return narrow[i];
    spare -= extra;
    return wide;
  });
  return { glyphs: forms, width: measure(forms) };
}

/** Four characters per block across the whole board, wrapping only at word boundaries. */
export function microSignLayout(source: string[], maxWidth: number | undefined, key: string): { lines: string[]; width: number } {
  const wrap = (capacity: number) =>
    source.flatMap((line) => {
      const lines: string[] = [];
      let current = '';
      for (const word of line.split(' ')) {
        const next = current ? `${current} ${word}` : word;
        if (next.length > capacity && current) {
          lines.push(current);
          current = word;
        } else current = next;
      }
      lines.push(current);
      return lines;
    });
  const longest = Math.max(...source.flatMap((line) => line.split(' ').map((word) => word.length)));
  let width = Math.ceil(longest / 4);
  if (maxWidth !== undefined && width > maxWidth) throw new Error(`Sign ${key} word exceeds maxWidth ${maxWidth}`);
  // Prefer a single block row with two lines. An explicit cap can require more rows.
  const limit = Math.min(maxWidth ?? Infinity, Math.ceil(Math.max(...source.map((line) => line.length)) / 4));
  let lines = wrap(width * 4);
  while (lines.length > Math.max(2, source.length) && width < limit) lines = wrap(++width * 4);
  return { lines, width };
}
