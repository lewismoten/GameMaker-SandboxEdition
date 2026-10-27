// Compares what a tour clip should say with what Whisper heard in it (scripts/narrate/verify.ts):
// both are brought to plain lowercase words first (numbers in words, no punctuation or
// apostrophes, spelled-out letters joined), then lined up word by word, and the differences that
// a listener would hear are kept. Spellings Whisper can't know (Lewie or Louie, disk or disc,
// Game Maker or GameMaker) aren't differences. Pure, no models, so tests can run it.
import { sayNumber } from './spoken';

/** Words that sound alike, each mapped to one spelling. */
const ALIKE: Record<string, string> = {
  disc: 'disk',
  discs: 'disks',
  louie: 'lewie',
  gwyn: 'gwinn',
  gwin: 'gwinn',
  too: 'to',
  two: 'to',
  shay: 'chez',
  doss: 'dos',
  okay: 'ok',
  bizarres: 'bizarre',
  bazaar: 'bizarre',
  bazaars: 'bizarre',
};

/** Little words a take can drop or swap without changing what the line means. */
const SMALL = new Set(['a', 'an', 'the', 'this', 'and', 'then', 'of', 'to', 'in', 'on', 'is', 'its', 'it', 'or', 'with', 'for', 'oh', 'so', 'now', 'well']);

/** Contractions, said either way. */
const LONG: Record<string, string> = { im: 'i am', youre: 'you are', theyre: 'they are', youll: 'you will', dont: 'do not', cant: 'can not', thats: 'that is' };

/** A difference's words without little words or a plural s: equal when only those differ. */
const core = (words: string[]): string =>
  words
    .filter((w) => !SMALL.has(w))
    .map((w) => w.replace(/s$/, ''))
    .join('');

const NUMBER_WORD =
  /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)$/;

/** A letter said on its own (not the words a and I). */
const letter = (x: string | undefined) => x !== undefined && /^[b-hj-z]$/.test(x);

/** A line as plain words to compare: lowercase, numbers in words, no punctuation. */
export function plainWords(text: string): string[] {
  const s = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\$(\d[\d,]*)/g, '$1 dollars')
    .replace(/(\d)½/g, '$1 and a half')
    .replace(/½/g, ' half')
    .replace(/\d[\d,]*/g, (d) => ` ${sayNumber(d.replace(/,/g, ''))} `)
    .replace(/'/g, '')
    .replace(/\b(im|youre|theyre|youll|dont|cant|thats)\b/g, (w) => LONG[w])
    .replace(/[-–—/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
  const words = s.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // "two hundred and six" is "two hundred six"
    if (w === 'and' && NUMBER_WORD.test(out[out.length - 1] ?? '') && NUMBER_WORD.test(words[i + 1] ?? '')) continue;
    // letters said one at a time ("b b s", from "B.B.S.") are one word
    if (letter(w) && letter(words[i - 1])) {
      out[out.length - 1] += w;
      continue;
    }
    out.push(ALIKE[w] ?? w);
  }
  return out;
}

/** One difference: the words it should say there and the words heard instead (either may be empty). */
export interface Hunk {
  said: string[];
  heard: string[];
  /** Only little words (a, the, and…) or a plural differ. */
  small: boolean;
}

/** The differences between two word lists, by their longest common run of words. */
export function wordDiff(a: string[], b: string[]): Hunk[] {
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const hunks: Hunk[] = [];
  let cur: Hunk | undefined;
  const flush = () => {
    if (cur && cur.said.join('') !== cur.heard.join('')) {
      cur.small = core(cur.said) === core(cur.heard);
      hunks.push(cur);
    }
    cur = undefined;
  };
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      flush();
      (i++, j++);
    } else {
      cur ??= { said: [], heard: [], small: false };
      if (j >= m || (i < n && lcs[i + 1][j] >= lcs[i][j + 1])) cur.said.push(a[i++]);
      else cur.heard.push(b[j++]);
    }
  }
  flush();
  return hunks;
}

export interface Comparison {
  /** The differences a listener would notice (not just little words). */
  misses: Hunk[];
  /** Differences in little words or plurals only. */
  small: Hunk[];
}

/**
 * What differs between a line's written words and what was heard. A take that matches the
 * spoken form it was recorded from (a deliberate rewording, `spoken`) has no misses.
 */
export function compareSpeech(written: string, heard: string, spoken?: string): Comparison {
  const heardWords = plainWords(heard);
  const split = (h: Hunk[]): Comparison => ({ misses: h.filter((x) => !x.small), small: h.filter((x) => x.small) });
  const result = split(wordDiff(plainWords(written), heardWords));
  if (result.misses.length && spoken !== undefined) {
    const alt = split(wordDiff(plainWords(spoken), heardWords));
    if (!alt.misses.length) return alt;
  }
  return result;
}
