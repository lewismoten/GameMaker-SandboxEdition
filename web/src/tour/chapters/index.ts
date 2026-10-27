// The whole tour in order, one chapter a page. A new chapter: its data in a file of its own
// beside these, added to CHAPTERS where it plays in the whole tour, its page in tourPages.ts
// CHAPTER_PAGES, and its page's sources in tourData.test.ts SOURCES. The chapters still to
// write are in PLANNED, in the order they will join the end.
import type { Chapter } from '../steps';
import { achievementsChapter } from './achievements';
import { castChapter } from './cast';
import { editorChapter } from './editor';
import { guideChapter } from './guide';
import { homeChapter } from './home';
import { libraryChapter } from './library';
import { settingsChapter } from './settings';

export const CHAPTERS: Chapter[] = [homeChapter, libraryChapter, achievementsChapter, castChapter, guideChapter, settingsChapter, editorChapter];

/** The chapters still to write, in the order the whole tour will play them (after the editor). */
export const PLANNED = ['dos', 'desk'] as const;
