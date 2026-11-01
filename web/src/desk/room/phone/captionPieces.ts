// A phone caption's words cut at sentence ends into pieces short enough to show without scrolling.

/** About four lines of the dial pad's caption. */
const MAX = 150;

/** `text` in order, as sentences grouped up to about MAX characters (a longer sentence stays whole). */
export function captionPieces(text: string, max = MAX): string[] {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const last = out.length - 1;
    if (last >= 0 && out[last].length + 1 + s.length <= max) out[last] += ` ${s}`;
    else out.push(s);
  }
  return out.length ? out : [text];
}
