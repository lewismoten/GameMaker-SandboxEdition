// CHK.C manualcheck(): the copy protection of an unregistered Game-Maker. It asked for a word
// in the printed manual (COPYTECT.DAT held RSD's encoded list: a section number, a line and a
// word, "Count every line with text, not including numbered headings"). RSD's book can't be
// shown here, so the questions come from this edition's own Game-Maker SE Owner's Guide
// (manual/dosManual.ts: the guide in the box, which the desk opens beside the monitor while GM
// asks), by the page number printed at the foot of its pages. A browser wraps lines differently
// at every size, so they count paragraphs instead of lines: the paragraphs of text on the page,
// not headings, tables, lists, boxed notes or captions. test/gmRegistration.test.ts checks every
// answer against the guide.

export interface CopyQuestion {
  /** The page number printed at the foot of the Owner's Guide page. */
  page: number;
  paragraph: number;
  word: number;
  answer: string;
}

export const QUESTIONS: CopyQuestion[] = [
  { page: 2, paragraph: 2, word: 10, answer: 'BIOS' },
  { page: 2, paragraph: 3, word: 13, answer: 'OLDER' },
  { page: 2, paragraph: 4, word: 6, answer: 'MONITOR' },
  { page: 3, paragraph: 1, word: 31, answer: 'TRANSFER' },
  { page: 4, paragraph: 1, word: 15, answer: 'HELP' },
  { page: 4, paragraph: 2, word: 11, answer: 'DRIVE' },
  { page: 5, paragraph: 1, word: 17, answer: 'APPEARS' },
  { page: 5, paragraph: 2, word: 18, answer: 'LETTER' },
  { page: 6, paragraph: 1, word: 13, answer: 'PIPEMARE' },
  { page: 6, paragraph: 2, word: 21, answer: 'KEYPAD' },
  { page: 7, paragraph: 2, word: 25, answer: 'PICKS' },
  { page: 7, paragraph: 4, word: 39, answer: 'RECORDING' },
  { page: 8, paragraph: 1, word: 21, answer: 'GRAPHICAL' },
  { page: 9, paragraph: 1, word: 35, answer: 'SCROLLS' },
  { page: 10, paragraph: 2, word: 7, answer: 'YOURS' },
  { page: 10, paragraph: 3, word: 33, answer: 'YELLOW' },
  { page: 11, paragraph: 1, word: 6, answer: 'ORDER' },
  { page: 12, paragraph: 1, word: 20, answer: 'BLACK' },
  { page: 12, paragraph: 2, word: 30, answer: 'ROTATE' },
  { page: 13, paragraph: 2, word: 40, answer: 'WALLS' },
  { page: 13, paragraph: 3, word: 26, answer: 'ZOOMS' },
  { page: 14, paragraph: 1, word: 26, answer: 'DRAWING' },
  { page: 14, paragraph: 3, word: 11, answer: 'GREEN' },
  { page: 17, paragraph: 3, word: 10, answer: 'BLANK' },
  { page: 18, paragraph: 1, word: 6, answer: 'RED' },
  { page: 18, paragraph: 2, word: 12, answer: 'PERMISSION' },
  { page: 20, paragraph: 2, word: 6, answer: 'PILE' },
  { page: 20, paragraph: 3, word: 12, answer: 'COPIES' },
  { page: 21, paragraph: 2, word: 7, answer: 'SEALED' },
  { page: 25, paragraph: 1, word: 28, answer: 'EIGHT' },
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
