// Where each line typed into a text screen ends up on the game's screen. Display_File reads
// the file with fgets(line, 32, fp): at most 31 characters at a time, so a longer line
// wraps (mid-word), and a line of exactly 31 (or 62...) characters leaves its newline for
// the next read, which shows as an extra blank line.

export const LINE_CHARS = 31;
export const PAGE_LINES = 16;

export interface TypedLine {
  /** The line as typed, without its newline. */
  text: string;
  /** The first screen line it is shown on. */
  start: number;
  /** How many screen lines it takes (0 for the empty end of a file ending in a newline). */
  count: number;
  /** Longer than 31 characters: the game wraps it. */
  wraps: boolean;
  /** A whole number of 31 character pieces followed by a newline: the game adds a blank line. */
  extraBlank: boolean;
  /** Screen pages (from 0) that start inside this line. */
  pageStarts: number[];
}

export interface TextLayout {
  lines: TypedLine[];
  screenLines: number;
  pages: number;
}

/** Lays out text typed with '\n' line ends (as in a textarea); stops at Ctrl-Z like DOS text mode. */
export function layoutText(text: string): TextLayout {
  const body = text.replace(/\r\n/g, '\n').replace(/\x1a.*$/s, '');
  const typed = body.split('\n');
  const lines: TypedLine[] = [];
  let screen = 0;
  typed.forEach((t, i) => {
    const newline = i < typed.length - 1;
    const len = t.length;
    let count = Math.ceil(len / LINE_CHARS);
    const extraBlank = newline && len > 0 && len % LINE_CHARS === 0;
    if (newline && (len === 0 || extraBlank)) count++;
    const pageStarts: number[] = [];
    for (let s = screen; s < screen + count; s++) if (s % PAGE_LINES === 0 && s > 0) pageStarts.push(s / PAGE_LINES);
    lines.push({ text: t, start: screen, count, wraps: len > LINE_CHARS, extraBlank, pageStarts });
    screen += count;
  });
  return { lines, screenLines: screen, pages: Math.max(1, Math.ceil(screen / PAGE_LINES)) };
}

/** The screen page (from 0) showing the typed line `index`. */
export function pageOfLine(layout: TextLayout, index: number): number {
  const l = layout.lines[Math.max(0, Math.min(index, layout.lines.length - 1))];
  if (!l) return 0;
  return Math.min(layout.pages - 1, Math.floor(l.start / PAGE_LINES));
}

/** Breaks lines longer than fit at word boundaries, at most 30 characters (31 adds a blank line). */
export function wrapLongLines(text: string): string {
  const max = LINE_CHARS - 1;
  return text
    .split('\n')
    .flatMap((line) => {
      if (line.length <= LINE_CHARS - 1) return [line];
      const out: string[] = [];
      let rest = line;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(' ', max);
        if (cut <= 0) cut = max;
        out.push(rest.slice(0, cut).trimEnd());
        rest = rest.slice(cut).trimStart();
      }
      out.push(rest);
      return out;
    })
    .join('\n');
}
