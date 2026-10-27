// What the narration's text-to-speech is handed for a tour line (scripts/narrate.ts): the
// bubble's words in a spoken form, so the voices say them right. The bubbles and captions keep
// the written words. Found with npm run voice:check (Whisper), which showed what went wrong:
// Pocket TTS's tokenizer has no curly apostrophe or ellipsis (it reads their bytes), and it spells
// digits one at a time, so 1994 came out cut short and 286 was heard as 206; initialisms and
// names in capitals (BBS, DOS, PLAYGAME, THE CHEZ) came out mumbled or misread. Pure, no models.

/** Which engine speaks the line: Pocket TTS (Lewis's cloned voices) or Kokoro (stock voices). */
export type Engine = 'pocket' | 'kokoro';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const TEENS = ['thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** A whole number in words: 0 to 999,999 ("two hundred eighty-six"); larger ones stay digits. */
export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return String(n);
  if (n <= 12) return ONES[n];
  if (n < 20) return TEENS[n - 13];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`;
  return `${numberWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberWords(n % 1000)}` : ''}`;
}

/**
 * A number the way it is said in the tour: a year in two halves ("nineteen ninety-four",
 * "nineteen oh five", but "two thousand", "two thousand five"), a model number in two halves
 * (286 → "two eighty-six", 486 → "four eighty-six"), anything else plainly.
 */
export function sayNumber(digits: string): string {
  const n = Number(digits);
  if (digits.length === 4 && n >= 1100 && n < 2100 && !(n >= 2000 && n < 2010)) {
    const [hi, lo] = [Math.floor(n / 100), n % 100];
    return `${numberWords(hi)} ${lo === 0 ? 'hundred' : lo < 10 ? `oh ${ONES[lo]}` : numberWords(lo)}`;
  }
  // the PC chips: 286, 386, 486
  if (/^[2-5]86$/.test(digits)) return `${ONES[Number(digits[0])]} eighty-six`;
  return numberWords(n);
}

/** Words said differently from how they're written, in order; whole words, case as given. */
const SAY: [RegExp, string][] = [
  [/\bTHE CHEZ\b/g, 'the Shay'],
  [/\bPLAYGAME\b/g, 'Play Game'],
  [/\bGame-Maker\b/g, 'Game Maker'],
  [/\bBBS\b/g, 'bee bee ess'],
  [/\bDOS\b/g, 'doss'],
  [/\bGM\b/g, 'G M'],
  [/\bOPL2\b/g, 'O P L two'],
  // a drive letter: "drive A:" is said "drive A"
  [/\b([A-D]):(?=[\s.,;!?]|$)/g, '$1'],
  // money and halves before the plain numbers
  [/\$(\d+)\b/g, '$1 dollars'],
  [/(\d+)½/g, '$1 and a half'],
];

/** Typography Pocket TTS's tokenizer doesn't have (it falls back to raw bytes). */
const PLAIN: [RegExp, string][] = [
  [/[‘’]/g, "'"],
  [/[“”]/g, '"'],
  [/…/g, '...'],
  [/\s*—\s*/g, ', '],
  [/–/g, '-'],
  [/\u00a0/g, ' '],
];

/** The words to hand the text-to-speech for a line written as `text`. */
export function spokenText(text: string, engine: Engine = 'pocket'): string {
  let s = text;
  if (engine === 'pocket') for (const [from, to] of PLAIN) s = s.replace(from, to);
  for (const [from, to] of SAY) s = s.replace(from, to);
  // names in capitals (TURBO BUTTON, GRAVITAS) are said as words, not spelled
  s = s.replace(/\b[A-Z]{4,}\b/g, (w) => w[0] + w.slice(1).toLowerCase());
  return s.replace(/\d+(?:,\d{3})*/g, (d) => sayNumber(d.replace(/,/g, '')));
}
