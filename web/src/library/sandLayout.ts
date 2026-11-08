// Where the marks of a Sandscript line go (games/kit/sandscript.ts has the letters), in grid
// steps, for the Library's key (sandNote.ts) to draw in SVG. No DOM, so sandscript.test.ts can
// check the key's letters against the source.
import { SANDSCRIPT, sandText } from '../../../games/kit/sandscript';

/** A letter is 2 steps wide, with 0.8 of rim between letters and 2 steps between words. */
const GAP = 0.8;
const SPACE = 2;

/** The letters the key lists, A to Z. */
export const KEY_LETTERS = Object.keys(SANDSCRIPT).sort();

interface SandLayout {
  width: number;
  /** One rim along each word: [x0, x1] at the top. */
  rims: [number, number][];
  /** Strokes: [x1, y1, x2, y2]. */
  lines: [number, number, number, number][];
  /** Pebbles: [x, y]. */
  dots: [number, number][];
}

/** A message laid out: every word's rim, and each letter's strokes and pebbles from the source. */
export function sandLayout(text: string): SandLayout {
  const words = sandText(text).split(' ').filter(Boolean);
  const wordW = (w: string) => w.length * 2 + (w.length - 1) * GAP;
  const out: SandLayout = { width: 0, rims: [], lines: [], dots: [] };
  let x = 0;
  for (const w of words) {
    out.rims.push([x, x + wordW(w)]);
    [...w].forEach((ch, i) => {
      const at = x + i * (2 + GAP);
      const g = SANDSCRIPT[ch];
      for (const [[ax, ay], [bx, by]] of g.strokes) out.lines.push([at + ax, ay, at + bx, by]);
      for (const [dx, dy] of g.dots) out.dots.push([at + dx, dy]);
    });
    x += wordW(w) + SPACE;
  }
  out.width = Math.max(0, x - SPACE);
  return out;
}
