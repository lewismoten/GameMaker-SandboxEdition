// The postcard-and-grille decoder's math (no DOM): a grille card with a few holes is laid over a postcard's message,
// a grid of words, turned a quarter at a time and maybe flipped face down. Two marks on the grille's edges (A on one
// side, B on another) each look straight along their row or column out to the postcard's border, where a small
// picture is printed at every row and column; a placement is valid only when both pictures are the grille's marks.
// A valid placement reads one word per hole, in the holes' number order. Used by the printed card, the live one and
// the generator (games/kit/postcardGrille.ts); postcardGrille.test.ts runs every placement.

export interface Grille {
  /** The square patch of the message the holes sit over: n by n words. */
  n: number;
  /** The holes as [row, col] in the grille's own view, numbered 1.. in this order. */
  holes: [number, number][];
  /** Mark A: its picture and the row of the grille's left margin it sits in. */
  a: { name: string; row: number };
  /** Mark B: its picture and the column of the grille's top margin it sits in. */
  b: { name: string; col: number };
}

/** The pictures printed along the postcard's four edges: a name per row (left, right) and per column (top, bottom). */
export interface Border {
  top: string[];
  bottom: string[];
  left: string[];
  right: string[];
}

export interface Place {
  /** The patch's top-left word on the postcard. */
  r: number;
  c: number;
  /** Quarter turns clockwise, 0 to 3, after flipping. */
  rot: number;
  /** Face down: the grille mirrored left to right before it is turned. */
  flip: boolean;
}

/** A point in the grille's frame (rows and columns -1..n, the margins outside 0..n-1) as it lies on the card. */
export function turn(g: Grille, p: [number, number], rot: number, flip: boolean): [number, number] {
  let [i, j] = p;
  if (flip) j = g.n - 1 - j;
  for (let k = 0; k < rot; k++) [i, j] = [j, g.n - 1 - i];
  return [i, j];
}

/** The border pictures marks A and B look out to at this place. */
export function hits(g: Grille, border: Border, place: Place): [string, string] {
  const look = (p: [number, number]): string => {
    const [i, j] = turn(g, p, place.rot, place.flip);
    const r = place.r + i;
    const c = place.c + j;
    if (j === -1) return border.left[r];
    if (j === g.n) return border.right[r];
    if (i === -1) return border.top[c];
    return border.bottom[c];
  };
  return [look([g.a.row, -1]), look([-1, g.b.col])];
}

/** Every place the grille's patch lies wholly on the message of `rows` by `cols` words. */
export function places(g: Grille, rows: number, cols: number): Place[] {
  const out: Place[] = [];
  for (const flip of [false, true])
    for (let rot = 0; rot < 4; rot++) for (let r = 0; r <= rows - g.n; r++) for (let c = 0; c <= cols - g.n; c++) out.push({ r, c, rot, flip });
  return out;
}

/** Whether both marks meet their own pictures at this place. */
export function valid(g: Grille, border: Border, place: Place): boolean {
  const [a, b] = hits(g, border, place);
  return a === g.a.name && b === g.b.name;
}

/** The message cells ([row, col]) under holes 1.. at this place. */
export function holeCells(g: Grille, place: Place): [number, number][] {
  return g.holes.map((h) => {
    const [i, j] = turn(g, h, place.rot, place.flip);
    return [place.r + i, place.c + j];
  });
}

/** A word with its punctuation and capital stripped, to compare. */
export const bare = (w: string): string => w.toLowerCase().replace(/[^a-z']/g, '');

/** What the holes show at this place, hole 1 first, as printed. */
export function reading(g: Grille, words: string[][], place: Place): string[] {
  return holeCells(g, place).map(([r, c]) => words[r]?.[c] ?? '');
}
