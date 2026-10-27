// The whole tour in order. Only the chapters written so far are here; the rest are planned
// (PLANNED), and the tour's menus offer what there is. A new chapter: its data in a file of
// its own beside home.ts, listed here, and its page in tourPages.ts CHAPTER_PAGES.
import type { Chapter } from '../steps';
import { homeChapter } from './home';

export const CHAPTERS: Chapter[] = [homeChapter];

/** The chapters still to write, in the order the whole tour will play them. */
export const PLANNED = ['games', 'editor', 'library', 'achievements', 'cast', 'settings', 'dos', 'desk'] as const;
