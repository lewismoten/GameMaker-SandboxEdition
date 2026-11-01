// Fits a game's title onto a floppy label that has no title picture: the largest font size at
// which the words wrap into at most `maxLines` lines that each fit `maxWidth`. A word too long for
// a line keeps shrinking the font down to `minSize`, then is cut with an ellipsis, never overflowing.
export interface TitleFit {
  size: number;
  lines: string[];
}

export function fitTitle(
  measure: (text: string, size: number) => number,
  title: string,
  maxWidth: number,
  maxLines: number,
  maxSize: number,
  minSize: number,
): TitleFit {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const wrap = (size: number): string[] => {
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (!line || measure(next, size) <= maxWidth) line = next;
      else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  const fits = (lines: string[], size: number) => lines.length <= maxLines && lines.every((l) => measure(l, size) <= maxWidth);
  for (let size = maxSize; size >= minSize; size--) {
    const lines = wrap(size);
    if (fits(lines, size)) return { size, lines };
  }
  const lines = wrap(minSize).slice(0, maxLines);
  const last = maxLines - 1;
  if (lines.length) {
    let t = lines[Math.min(last, lines.length - 1)];
    while (t.length > 1 && measure(`${t}…`, minSize) > maxWidth) t = t.slice(0, -1);
    const i = Math.min(last, lines.length - 1);
    if (wrap(minSize).length > maxLines || measure(lines[i], minSize) > maxWidth) lines[i] = `${t}…`;
  }
  return { size: minSize, lines: lines.map((l) => (measure(l, minSize) > maxWidth ? `${l.slice(0, Math.max(1, l.length - 1))}…` : l)) };
}
