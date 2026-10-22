// CHK.C manualcheck(): the copy protection of an unregistered Game-Maker. It asked for a word
// by section, line and word in the printed manual (COPYTECT.DAT has RSD's list, for a manual
// this desk doesn't have). Here the questions come from the Owner's Guide in the Game-Maker
// box on the desk (manual/dosManual.ts), by its printed page numbers. A browser wraps lines
// differently at every size, so they count paragraphs instead of lines: the <p> paragraphs
// of a page, not headings, tables, notes or captions. test/gmCopyCheck.test.ts checks every
// answer against the guide.

export interface CopyQuestion {
  /** The page number printed at the bottom of the Owner's Guide page. */
  page: number;
  paragraph: number;
  word: number;
  answer: string;
}

export const QUESTIONS: CopyQuestion[] = [
  { page: 2, paragraph: 2, word: 11, answer: 'COUNTS' },
  { page: 2, paragraph: 3, word: 2, answer: 'TURBO' },
  { page: 3, paragraph: 1, word: 31, answer: 'TRANSFER' },
  { page: 4, paragraph: 1, word: 15, answer: 'HELP' },
  { page: 5, paragraph: 1, word: 9, answer: 'GAME-MAKER' },
  { page: 5, paragraph: 2, word: 28, answer: 'ESC' },
  { page: 6, paragraph: 1, word: 13, answer: 'PIPEMARE' },
  { page: 6, paragraph: 2, word: 22, answer: 'F1' },
  { page: 7, paragraph: 1, word: 24, answer: 'MOUSE' },
  { page: 8, paragraph: 2, word: 16, answer: 'RESTORE' },
  { page: 8, paragraph: 3, word: 33, answer: 'YELLOW' },
  { page: 10, paragraph: 1, word: 24, answer: 'INTEGRATOR' },
  { page: 13, paragraph: 1, word: 6, answer: 'RED' },
  { page: 13, paragraph: 2, word: 18, answer: 'README' },
  { page: 14, paragraph: 2, word: 6, answer: 'PILE' },
  { page: 14, paragraph: 3, word: 24, answer: 'FEE' },
  { page: 17, paragraph: 1, word: 12, answer: 'PINK' },
  { page: 17, paragraph: 4, word: 13, answer: 'MIT' },
];

/** stricmp(answeren, answer): the word typed, any case. */
export const rightAnswer = (q: CopyQuestion, typed: string): boolean => typed.trim().toUpperCase() === q.answer;

/** The question for this start: the one PLAYGAME.EXE remembers, or any (random(87)+1 in CHK.C). */
export function questionFor(remembered: number | undefined, random = Math.random): number {
  if (remembered !== undefined && remembered >= 0 && remembered < QUESTIONS.length) return remembered;
  return Math.floor(random() * QUESTIONS.length);
}
