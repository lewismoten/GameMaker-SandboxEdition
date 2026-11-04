// The postcard-and-grille generator (decoder math: web/src/manual/printables/postcardMath.ts). It draws the pictures
// along a postcard's border and writes the message's words so that:
//  - the one placement of the grille the game wants (both marks on matching pictures) reads exactly the answer;
//  - every other placement whose marks match reads a decoy (a red herring the game does not accept);
//  - no cell is asked to be two words at once, and the rest of the message is whole sentences.
// The message is rows of three-word clauses; a clause may hold one slot for a noun, so a cell that must be a given word
// takes a clause with its slot there, and every other cell reads as ordinary postcard talk. A seed that cannot be
// satisfied (too few matches, two forced cells in one clause) is skipped and the next one tried, so the result is
// deterministic. Fails loudly if nothing fits.
import { bare, holeCells, places, reading, valid, type Border, type Grille, type Place } from '../../web/src/manual/printables/postcardMath';

export interface Clause {
  /** Three tokens; the one equal to '{}' (if any) takes a noun. */
  t: [string, string, string];
}

export interface PostcardSpec {
  rows: number;
  cols: number; // a multiple of 3
  grille: Grille;
  /** The pictures to draw along the border (names), at least 3. */
  symbols: string[];
  /** The words the answer's holes must read, hole 1 first. */
  answer: string[];
  /** Readings (hole 1 first) for the other matching placements: red herrings. The first is the trap that uses only answer words. */
  decoys: string[][];
  /** The nouns any slot may take besides the answer's. */
  nouns: string[];
  clauses: Clause[];
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
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const why: Record<number, number> = {};
const fail = (n: number) => ((why[n] = (why[n] ?? 0) + 1), undefined);
function attempt(spec: PostcardSpec, seed: number): PostcardBuilt | undefined {
  const rand = rng(seed);
  const pick = <T>(a: T[]): T => a[Math.floor(rand() * a.length)];
  const mk = (n: number) => Array.from({ length: n }, () => pick(spec.symbols));
  const border: Border = { top: mk(spec.cols), bottom: mk(spec.cols), left: mk(spec.rows), right: mk(spec.rows) };
  const all = places(spec.grille, spec.rows, spec.cols).filter((p) => valid(spec.grille, border, p));
  if (all.length < spec.matches[0] || all.length > spec.matches[1] || all.length - 1 > spec.decoys.length) return fail(64);
  const answer = all[Math.floor(rand() * all.length)];
  const forced = new Map<string, string>(); // "r,c" -> word
  const force = (p: Place, words: string[]): boolean => {
    const cells = holeCells(spec.grille, p);
    for (let k = 0; k < cells.length; k++) {
      const cell = cells[k].join(',');
      if (forced.has(cell) && bare(forced.get(cell)!) !== bare(words[k])) return false;
      forced.set(cell, words[k]);
    }
    return true;
  };
  if (!force(answer, spec.answer)) return fail(76);
  let d = 0;
  for (const p of all) if (key(p) !== key(answer) && !force(p, spec.decoys[d++])) return fail(78);
  // write each row's clauses; the text is tried again a few hundred times on this border
  let words: string[][] = [];
  let ok = false;
  for (let tries = 0; tries < 300 && !ok; tries++) {
    words = [];
    const used = new Set<Clause>();
    ok = true;
    for (let r = 0; r < spec.rows && ok; r++) {
      const row: string[] = [];
      for (let k = 0; k < spec.cols / 3 && ok; k++) {
        const want = [0, 1, 2].map((j) => forced.get(`${r},${k * 3 + j}`));
        const need = want.map((w, j) => (w ? j : -1)).filter((j) => j >= 0);
        const free = spec.clauses.filter((c) => !used.has(c));
        const pool = need.length
          ? free.filter((c) => need.every((j) => c.t[j].startsWith('{}')) && c.t.filter((t) => t.startsWith('{}')).length === need.length)
          : free.filter((c) => !c.t.some((t) => t.startsWith('{}')) || rand() < 0.3);
        if (!pool.length) {
          ok = false;
          break;
        }
        const c = pick(pool);
        used.add(c);
        row.push(
          ...c.t.map((t, j) => {
            if (!t.startsWith('{}')) return t;
            const noun = want[j] ?? pick(spec.nouns);
            return (j === 0 ? cap(noun) : noun.toLowerCase()) + t.slice(2);
          }),
        );
      }
      words.push(row);
    }
  }
  if (!ok) return fail(92);
  // a cell the plan did not ask for must not turn a placement into a reading of its own
  const matching = all.map((place) => ({ place, reads: reading(spec.grille, words, place) }));
  const ans = spec.answer.map(bare).join(' ');
  for (const p of places(spec.grille, spec.rows, spec.cols)) {
    const says = reading(spec.grille, words, p).map(bare).join(' ');
    if (says === ans && key(p) !== key(answer)) return fail(105);
  }
  return { seed, border, words, answer, matching };
}

export function buildPostcard(spec: PostcardSpec, from = 1): PostcardBuilt {
  for (let seed = from; seed < from + 200000; seed++) {
    const built = attempt(spec, seed);
    if (built) return built;
  }
  throw new Error('no postcard fits: add clauses or decoys ' + JSON.stringify(why));
}
