// CHK.C manualcheck(): the copy protection of an unregistered Game-Maker. It asked for a word
// in the printed manual (COPYTECT.DAT held RSD's encoded list: a section number, a line and a
// word, "Count every line with text, not including numbered headings"). Here the questions come
// from the printed Game-Maker 3.0 Owner's Manual (the spiral-bound "Create Your Own Games with
// Game-Maker" book), by the page number printed at the foot of the page. Lines depend on the
// printing, so they count paragraphs: every paragraph of text on the page, including the text in
// a boxed note, but not headings, menus, tables or figure captions. A paragraph carried over from
// the page before would be ambiguous, so every question is on a page that starts fresh. Each
// answer was read off a scan of the book; test/gmRegistration.test.ts checks the list's shape.

export interface CopyQuestion {
  /** The page number printed at the foot of the Owner's Manual page. */
  page: number;
  paragraph: number;
  word: number;
  answer: string;
}

export const QUESTIONS: CopyQuestion[] = [
  { page: 1, paragraph: 1, word: 5, answer: 'EXPERIENCED' },
  { page: 7, paragraph: 1, word: 5, answer: 'POWERFUL' },
  { page: 7, paragraph: 2, word: 10, answer: 'UNLIMITED' },
  { page: 7, paragraph: 6, word: 8, answer: 'RESTRAINED' },
  { page: 9, paragraph: 1, word: 10, answer: 'ARRANGED' },
  { page: 9, paragraph: 3, word: 8, answer: 'SCENES' },
  { page: 13, paragraph: 1, word: 6, answer: 'WHICH' },
  { page: 20, paragraph: 1, word: 14, answer: 'COPYRIGHTED' },
  { page: 22, paragraph: 3, word: 12, answer: 'CONFIGURATION' },
  { page: 23, paragraph: 1, word: 5, answer: 'GRAPHICAL' },
  { page: 23, paragraph: 2, word: 5, answer: 'RETURN' },
  { page: 25, paragraph: 1, word: 8, answer: 'DESCRIBED' },
  { page: 28, paragraph: 1, word: 7, answer: 'SUGGEST' },
  { page: 29, paragraph: 1, word: 11, answer: 'POP' },
  { page: 33, paragraph: 1, word: 5, answer: 'ZOOMED' },
  { page: 33, paragraph: 3, word: 5, answer: 'FOUNDATION' },
  { page: 45, paragraph: 1, word: 7, answer: 'MOVE' },
  { page: 47, paragraph: 1, word: 10, answer: 'CLEAR' },
  { page: 56, paragraph: 1, word: 3, answer: 'SHOOT' },
  { page: 57, paragraph: 1, word: 15, answer: 'SIXTY' },
  { page: 72, paragraph: 1, word: 4, answer: 'TOGETHER' },
  { page: 78, paragraph: 1, word: 4, answer: 'CERTAIN' },
  { page: 79, paragraph: 1, word: 4, answer: 'UTILITIES' },
  { page: 82, paragraph: 1, word: 8, answer: 'INTERESTING' },
  { page: 85, paragraph: 1, word: 8, answer: 'SCORPION' },
  { page: 98, paragraph: 1, word: 7, answer: 'DIRECTORY' },
  { page: 99, paragraph: 1, word: 7, answer: 'HEART' },
  { page: 100, paragraph: 1, word: 6, answer: 'ENCOURAGES' },
  { page: 101, paragraph: 2, word: 7, answer: 'COVERED' },
  { page: 104, paragraph: 1, word: 15, answer: 'DISKETTE' },
];

/** stricmp(answeren, answer): the word typed, any case (stray punctuation around it is forgiven). */
export const rightAnswer = (q: CopyQuestion, typed: string): boolean =>
  typed
    .trim()
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
    .toUpperCase() === q.answer;

/** The question for this start: the one PLAYGAME.EXE remembers, or any (random(87)+1 in CHK.C). */
export function questionFor(remembered: number | undefined, random = Math.random): number {
  if (remembered !== undefined && remembered >= 0 && remembered < QUESTIONS.length) return remembered;
  return Math.floor(random() * QUESTIONS.length);
}
