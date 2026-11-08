// The postcard-and-grille generator (decoder math: web/src/manual/printables/postcardMath.ts). The message is ordinary
// handwriting-style prose laid on an invisible grid; this tool lays the text on it, finds the one placement of the
// grille that reads the answer, and draws the border pictures so that:
//  - the one placement the game wants (both marks on matching pictures) reads exactly the answer, and nothing else does;
//  - a few other placements whose marks match read decoys (words from the same sentences, nothing the game accepts);
//  - every other matching placement reads at least two story words, so a wrong try still sounds like the maze.
// The text is written by hand (see tools/postcard.ts), so the words under the answer's holes sit in real sentences; if
// the text does not read the answer exactly once, building fails and says where it reads it. The border is drawn from
// a seed, the first that fits, so the result is deterministic.
import { bare, places, reading, slots, valid, type Border, type Grille, type Place } from '../../web/src/manual/printables/postcardMath';

export interface PostcardSpec {
  rows: number;
  cols: number; // a multiple of 3
  grille: Grille;
  /** The pictures to draw along the border (names), at least 3. */
  symbols: string[];
  /** The words the answer's holes must read, hole 1 first. */
  answer: string[];
  /** Words a decoy reads; at least `decoys` of the other matching placements read three of their four from these. */
  plausible: string[];
  decoys: number;
  /**
   * The message. A word takes one cell per 5 characters. `/` ends a line, `|` is an empty cell, `~` is a space inside
   * one cell (two short words in one: "of~it"); a cell a hole may land on holds one word.
   */
  text: string;
  /** How many matching placements to accept (answer included). */
  matches: [number, number];
}

export interface PostcardBuilt {
  seed: number;
  border: Border;
  words: string[][];
  answer: Place;
  /** Every placement whose marks match, and what it reads. */
  matching: { place: Place; reads: string[] }[];
}

/** Lays the text on the grid: a word in its first cell, the cells it spills over left empty. */
export function layout(text: string, rows: number, cols: number): string[][] {
  const out: string[][] = [];
  let line: string[] = [];
  const end = () => {
    out.push([...line, ...Array<string>(cols - line.length).fill('')]);
    line = [];
  };
  for (const tok of text.split(/\s+/).filter(Boolean)) {
    if (tok === '/') {
      end();
      continue;
    }
    const shown = tok === '|' ? '' : tok.replace(/~/g, ' ');
    const cells = Math.max(1, Math.ceil(shown.length / 5));
    if (cells > cols) throw new Error(`"${shown}" is wider than a line`);
    if (line.length + cells > cols) end();
    line.push(shown, ...Array<string>(cells - 1).fill(''));
  }
  if (line.length) end();
  if (out.length !== rows) throw new Error(`the text makes ${out.length} lines, not ${rows}`);
  return out;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (p: Place) => `${p.r},${p.c},${p.rot},${p.flip}`;

export function buildPostcard(spec: PostcardSpec, from = 1): PostcardBuilt {
  const g = spec.grille;
  const words = layout(spec.text, spec.rows, spec.cols);
  const ans = spec.answer.map(bare).join(' ');
  const all = places(g, spec.rows, spec.cols);
  const hits = all.filter((p) => reading(g, words, p).map(bare).join(' ') === ans);
  if (hits.length !== 1) throw new Error(`the text must read "${ans}" at exactly one placement; it reads it at ${JSON.stringify(hits)}`);
  const answer = hits[0];
  const plausible = new Set(spec.plausible);
  for (let seed = from; seed < from + 100000; seed++) {
    const rand = rng(seed);
    const mk = (n: number) => Array.from({ length: n }, () => spec.symbols[Math.floor(rand() * spec.symbols.length)]);
    const border: Border = { top: mk(spec.cols), bottom: mk(spec.cols), left: mk(spec.rows), right: mk(spec.rows) };
    const [sa, sb] = slots(g, answer);
    border[sa.side][sa.i] = g.a.name;
    border[sb.side][sb.i] = g.b.name;
    const matching = all.filter((p) => valid(g, border, p)).map((place) => ({ place, reads: reading(g, words, place) }));
    if (matching.length < spec.matches[0] || matching.length > spec.matches[1]) continue;
    const others = matching.filter((m) => key(m.place) !== key(answer));
    if (others.some((m) => m.reads.filter((w) => plausible.has(bare(w))).length < 2)) continue; // every red herring reads at least two story words
    if (others.filter((m) => m.reads.filter((w) => plausible.has(bare(w))).length >= 3).length < spec.decoys) continue;
    return { seed, border, words, answer, matching };
  }
  throw new Error('no border fits: loosen matches or decoys');
}
