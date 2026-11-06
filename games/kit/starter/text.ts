// Words for Game-Maker's text pages: 30 characters a line, 16 lines a page. `wrap` breaks
// paragraphs for you (a line starting with | is kept as written, a blank line is a gap).
/** Wraps paragraphs to the text screens' 30 characters a line. */
export function wrap(text: string, width = 30): string {
  const out: string[] = [];
  for (const para of text.trim().split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    if (para.startsWith('|')) {
      out.push(para.slice(1));
      continue;
    }
    let line = '';
    for (const word of para.trim().split(/\s+/)) {
      if (line && (line + ' ' + word).length > width) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) out.push(line);
  }
  for (const l of out) if (l.length > width) throw new Error(`Line too long: "${l}"`);
  return out.join('\n') + '\n';
}
