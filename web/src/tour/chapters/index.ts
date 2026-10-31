// The whole tour in order, one chapter a page. A new chapter: its data in a file of its own
// beside these, added to CHAPTERS where it plays in the whole tour, its page in tourPages.ts
// CHAPTER_PAGES, and its page's sources in tourData.test.ts SOURCES. The DOS page's chapter is
// last: it is a page of its own (dos.html), and the whole tour goes on there with a page load.
import type { Chapter } from '../steps';
import { achievementsChapter } from './achievements';
import { bbsChapter } from './bbs';
import { boxChapter } from './box';
import { castChapter } from './cast';
import { deskChapter } from './desk';
import { dosChapter } from './dos';
import { editAnimationChapter } from './editAnimation';
import { editAroundChapter } from './editAround';
import { editBlocksChapter } from './editBlocks';
import { editMapChapter } from './editMap';
import { editMonstersChapter } from './editMonsters';
import { editPaletteChapter } from './editPalette';
import { editSoundsChapter } from './editSounds';
import { editIntegratorChapter } from './editIntegrator';
import { editPlayerChapter } from './editPlayer';
import { editCheckChapter } from './editCheck';
import { editExportChapter } from './editExport';
import { editorChapter } from './editor';
import { guideChapter } from './guide';
import { homeChapter } from './home';
import { libraryChapter } from './library';
import { settingsChapter } from './settings';

export const CHAPTERS: Chapter[] = [
  homeChapter,
  libraryChapter,
  achievementsChapter,
  castChapter,
  guideChapter,
  settingsChapter,
  editorChapter,
  editAroundChapter,
  editMapChapter,
  editBlocksChapter,
  editMonstersChapter,
  editPaletteChapter,
  editSoundsChapter,
  editAnimationChapter,
  editIntegratorChapter,
  editPlayerChapter,
  editCheckChapter,
  editExportChapter,
  deskChapter,
  boxChapter,
  bbsChapter,
  dosChapter,
];
