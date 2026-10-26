// The Ultimate Owner's Guide's running order and page arithmetic (no DOM, so it is testable):
// the cover, the contents, the chapters flowing one after another, note pages to fill out
// whole folded sheets, and the back cover.
import { bookletPageCount } from '../printables/imposition';
import type { Chapter } from './chapter';
import { BLOCKS, PALETTES } from './chaptersLook';
import { ACTORS, LOGIC, SCENES } from './chaptersPlay';
import { MUSIC, SOUND_SETS, VOICE } from './chaptersSound';
import { NUMBERS, SHOW, TESTING } from './chaptersShow';
import { CRAFT, UPLOAD } from './chaptersCraft';
import { LEVELS } from './chaptersLevels';
import { TRICKS } from './chaptersTricks';
import { CHECK } from './chaptersCheck';
import { LIMITS, PLAYERS } from './chaptersPlayers';
import { SHAREWARE } from './chaptersShareware';

export const CHAPTERS: Chapter[] = [
  PALETTES,
  BLOCKS,
  ACTORS,
  LOGIC,
  SCENES,
  SOUND_SETS,
  VOICE,
  MUSIC,
  SHOW,
  TESTING,
  CRAFT,
  LEVELS,
  TRICKS,
  CHECK,
  PLAYERS,
  LIMITS,
  SHAREWARE,
  NUMBERS,
  UPLOAD,
];

interface BookPlan {
  /** Note pages added before the back cover. */
  notes: number;
  /** Every page, covers included: a multiple of four. */
  total: number;
}

/** Page 0 is the cover and page 1 the contents; `text` pages of chapters follow, then notes and the back cover. */
export function planBook(text: number): BookPlan {
  const used = 2 + Math.max(1, text) + 1;
  const total = bookletPageCount(used);
  return { notes: total - used, total };
}

/**
 * The page number (as printed at its foot) each chapter starts on, from the chapters whose
 * openings are on each page of text (`opens[page]`); the text starts on page 2.
 */
export function chapterStarts(opens: number[][], chapters: number): number[] {
  const starts = new Array<number>(chapters).fill(0);
  opens.forEach((list, page) => list.forEach((c) => (starts[c] ||= page + 2)));
  return starts;
}
