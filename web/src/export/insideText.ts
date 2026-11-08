// A text screen of the game (a .txt file) as real text on the exported page, and back again byte for
// byte. DOS text is code page 437, so each byte above 0x7F maps to one letter or box-drawing
// character. Only files that survive the round trip go on the page as text: printable ASCII, tabs,
// and line ends that are all CRLF or all LF (with an optional closing Ctrl-Z). Anything else stays in
// the game's data (insideGame.ts checks `textFromBytes` against `bytesFromText`).
const HIGH = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
const BACK = new Map([...HIGH].map((c, i) => [c, 0x80 + i]));

export interface TextLayout {
  /** The code page of the bytes. */
  code: 'cp437';
  eol: 'crlf' | 'lf';
  /** A closing Ctrl-Z (DOS's end-of-file mark) follows the text. */
  eof: boolean;
}

/** The text and layout of a file's bytes, or undefined when it is not plain enough to be text. */
export function textFromBytes(bytes: Uint8Array): { text: string; layout: TextLayout } | undefined {
  let end = bytes.length;
  const eof = end > 0 && bytes[end - 1] === 0x1a;
  if (eof) end--;
  let crlf = 0;
  let lf = 0;
  let out = '';
  for (let i = 0; i < end; i++) {
    const b = bytes[i];
    if (b === 0x0d) {
      if (bytes[i + 1] !== 0x0a) return undefined;
      crlf++;
    } else if (b === 0x0a) {
      lf++;
      out += '\n';
    } else if (b === 0x09 || (b >= 0x20 && b < 0x7f)) out += String.fromCharCode(b);
    else if (b >= 0x80) out += HIGH[b - 0x80];
    else return undefined;
  }
  if (crlf && crlf !== lf) return undefined;
  return { text: out, layout: { code: 'cp437', eol: crlf ? 'crlf' : 'lf', eof } };
}

/** The bytes of text in a layout (undefined if a character has no place in the code page). */
export function bytesFromText(text: string, layout: TextLayout): Uint8Array | undefined {
  const out: number[] = [];
  for (const c of text) {
    if (c === '\n') {
      if (layout.eol === 'crlf') out.push(0x0d);
      out.push(0x0a);
    } else if (c === '\t' || (c >= ' ' && c < '\x7f')) out.push(c.charCodeAt(0));
    else {
      const b = BACK.get(c);
      if (b === undefined) return undefined;
      out.push(b);
    }
  }
  if (layout.eof) out.push(0x1a);
  return Uint8Array.from(out);
}
