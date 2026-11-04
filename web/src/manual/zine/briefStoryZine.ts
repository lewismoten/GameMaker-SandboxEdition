// KEEP IT BRIEF!'s Tiny Pockets Press series: six one-sided, fold-and-cut eight-page zines.
import './briefStoryZine.css';
import { h } from '../../editor/core/ui';
import { WINGS, story, type Story } from '../../../../games/brief/src/stories';
import { sheet, type Sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';
import type { Reader, ReaderOptions } from '../readView';

export const BRIEF_STORY_ZINE_ID = 'brief-story-zines';
const STORIES_PER_VOLUME = 6;

interface BriefStoryZinePage {
  page: number;
  kind: 'cover' | 'story' | 'index' | 'back';
  title: string;
  text: string;
  story?: Story;
}

interface BriefStoryZineVolume {
  number: number;
  stories: Story[];
  pages: BriefStoryZinePage[];
  printInstructions: string;
}

interface MiniZineCell {
  page: number;
  rotated: boolean;
}

/** The printed cells, left to right: the upper row is read after the folds, upside down on paper. */
export const CLASSIC_MINI_ZINE_CELLS: readonly MiniZineCell[] = [
  { page: 5, rotated: true },
  { page: 4, rotated: true },
  { page: 3, rotated: true },
  { page: 2, rotated: true },
  { page: 6, rotated: false },
  { page: 7, rotated: false },
  { page: 8, rotated: false },
  { page: 1, rotated: false },
];

/**
 * After folding the upper row down, cutting the center slot, and pinching the
 * strip into a book, turn pages around this exposed-paper route. The route
 * starts at the cover in the lower-right corner, follows the folded top edge
 * right-to-left, then returns along the lower edge. A top panel has travelled
 * through the lengthwise fold, so it must be rotated 180 degrees to read.
 */
const FOLDED_PAGE_ROUTE = [
  { row: 1, column: 3, rotated: false },
  { row: 0, column: 3, rotated: true },
  { row: 0, column: 2, rotated: true },
  { row: 0, column: 1, rotated: true },
  { row: 0, column: 0, rotated: true },
  { row: 1, column: 0, rotated: false },
  { row: 1, column: 1, rotated: false },
  { row: 1, column: 2, rotated: false },
] as const;

/** Simulate the folded-and-cut paper route, rejecting a non-classic panel map. */
export function classicMiniZineReadingOrder(cells: readonly MiniZineCell[]): number[] {
  if (cells.length !== 8) throw new Error('A classic mini-zine needs exactly eight panels.');

  const pages = FOLDED_PAGE_ROUTE.map(({ row, column, rotated }) => {
    const cell = cells[row * 4 + column];
    if (cell.rotated !== rotated) {
      throw new Error(`Panel at row ${row + 1}, column ${column + 1} is upside down after the fold.`);
    }
    return cell.page;
  });

  const expected = Array.from({ length: 8 }, (_, index) => index + 1);
  if (pages.some((page, index) => page !== expected[index])) {
    throw new Error(`The folded panel route reads ${pages.join('/')}, not ${expected.join('/')}.`);
  }
  return pages;
}

const sourceStories = (): Story[] => WINGS.flatMap((wing) => wing.books.map(story)).sort((a, b) => a.n - b.n);

const instructions =
  'Fold on the faint lines, then cut only the dashed center slot. A rubber band is recommended: the two spine notch marks keep a band on the fold without piercing pages. The center punch mark is optional, but a hole can tear and does not hold the folded stack closed as reliably. Laurence Simon’s weekly 100 Word Stories challenge and podcast inspired these stories.';

function cover(volume: number, stories: Story[]): BriefStoryZinePage {
  return {
    page: 1,
    kind: 'cover',
    title: 'KEEP IT BRIEF!',
    text: `Tiny Pockets Press · Volume ${volume} · ${stories.length} 100-word stories`,
  };
}

/** An index page: a share of the story titles, each with its volume, taken from the stories themselves. */
function filler(page: number, entries: { volume: number; story: Story }[], part: number, parts: number): BriefStoryZinePage {
  return {
    page,
    kind: 'index',
    title: parts > 1 ? `TINY POCKETS INDEX ${part}/${parts}` : 'TINY POCKETS INDEX',
    text: entries.map(({ volume, story: entry }) => `Vol. ${volume} · ${entry.title}`).join('\n'),
  };
}

const NUMBER_WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];

function back(volume: number): BriefStoryZinePage {
  return {
    page: 8,
    kind: 'back',
    title: 'TINY POCKETS PRESS',
    text: `Volume ${volume}. Stories by Lewis Moten, written for Laurence Simon’s weekly 100 Word Stories challenge and podcast. ...And, as always, keep it brief!`,
  };
}

/** The short volumes fill their spare pockets with the title index of every volume, split evenly. */
function indexPages(used: number): BriefStoryZinePage[] {
  const parts = STORIES_PER_VOLUME - used;
  const all = sourceStories().map((entry, i) => ({ volume: Math.floor(i / STORIES_PER_VOLUME) + 1, story: entry }));
  const size = Math.ceil(all.length / Math.max(parts, 1));
  return Array.from({ length: parts }, (_, i) => filler(used + i + 2, all.slice(i * size, (i + 1) * size), i + 1, parts));
}

function volume(number: number, stories: Story[]): BriefStoryZineVolume {
  const interior = [
    ...stories.map((entry, i) => ({ page: i + 2, kind: 'story' as const, title: entry.title, text: entry.text, story: entry })),
    ...indexPages(stories.length),
  ];
  return { number, stories, pages: [cover(number, stories), ...interior, back(number)], printInstructions: instructions };
}

export const BRIEF_STORY_ZINE_VOLUMES: readonly BriefStoryZineVolume[] = Array.from(
  { length: Math.ceil(sourceStories().length / STORIES_PER_VOLUME) },
  (_, i) => volume(i + 1, sourceStories().slice(i * STORIES_PER_VOLUME, (i + 1) * STORIES_PER_VOLUME)),
);

function storyText(text: string): HTMLElement[] {
  // The source keeps verse line breaks for the DOS reader; the printed pocket panels reflow them
  // so every word remains present at the required 8pt paper size.
  return text.split('\n\n').map((paragraph) => h('p', null, paragraph.replaceAll('\n', ' ')));
}

function foldingDiagram(): HTMLElement {
  return h(
    'div',
    {
      class: 'brief-zine-fold-diagram',
      'aria-label': 'Fold diagram: fold lengthwise, then across, open once, cut the dashed middle slot, and fold into a book.',
    },
    h('b', null, 'FOLD'),
    h('span', null, '1 ═'),
    h('span', null, '2 ║'),
    h('span', null, '3 ✂'),
    h('span', null, '4 BOOK'),
  );
}

function pagePanel(page: BriefStoryZinePage, volume: BriefStoryZineVolume): HTMLElement {
  const article = h('article', {
    class: `brief-zine-page brief-zine-${page.kind}${page.story ? ` brief-zine-story-${page.story.n}` : ''}`,
    dataset: { page: String(page.page) },
  });
  if (page.kind === 'cover') {
    article.append(
      h('p', { class: 'brief-zine-kicker' }, 'TINY POCKETS PRESS PRESENTS'),
      h('h1', null, page.title),
      h('p', { class: 'brief-zine-volume' }, `VOL. ${volume.number}`),
      h(
        'p',
        { class: 'brief-zine-blurb' },
        `${NUMBER_WORDS[volume.stories.length] ?? volume.stories.length} TINY ${volume.stories.length === 1 ? 'TALE' : 'TALES'}! BIG FOLD! ONE RAD SHEET!`,
      ),
      h('p', { class: 'brief-zine-stamp' }, '1994 COPY MACHINE MAGIC'),
    );
  } else if (page.kind === 'story' && page.story) {
    article.append(
      h('p', { class: 'brief-zine-story-no' }, `STORY ${page.story.n} · ${page.story.week}`),
      h('h2', null, page.title),
      h('p', { class: 'brief-zine-meta' }, `${page.story.date} · ${page.story.topic}`),
      ...storyText(page.text),
    );
  } else if (page.kind === 'back') {
    article.append(
      h('h2', null, page.title),
      h('p', null, page.text),
      foldingDiagram(),
      h(
        'p',
        { class: 'brief-zine-retention' },
        'BEST HOLD: rubber band in the two spine notches. The punch mark is optional; it can tear and does not keep the folded stack shut as well.',
      ),
      h('p', { class: 'brief-zine-tiny' }, 'Cut the dashed slot only. Fold on the faint rules.'),
    );
  } else {
    article.append(
      h('h2', null, page.title),
      h('ul', { class: 'brief-zine-titles' }, ...page.text.split('\n').map((line) => h('li', null, line))),
      h('p', { class: 'brief-zine-tiny' }, 'Tiny Pockets Press · every title, every volume.'),
    );
  }
  return article;
}

function foldMarks(): HTMLElement[] {
  return [
    h('i', { class: 'brief-zine-fold v one', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold v two', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold v three', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold h', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-cut', role: 'img', 'aria-label': 'Cut this dashed center slot after folding' }, '✂ CUT'),
    h('i', { class: 'brief-zine-notch top', role: 'img', 'aria-label': 'Top rubber-band notch cut-out mark' }),
    h('i', { class: 'brief-zine-notch bottom', role: 'img', 'aria-label': 'Bottom rubber-band notch cut-out mark' }),
    h('i', { class: 'brief-zine-punch', role: 'img', 'aria-label': 'Optional center-spine punch-hole mark' }),
  ];
}

function printedVolume(volume: BriefStoryZineVolume): Sheet {
  const byPage = new Map(volume.pages.map((page) => [page.page, page]));
  const panels = CLASSIC_MINI_ZINE_CELLS.map((cell) =>
    h(
      'div',
      { class: `brief-zine-panel${cell.rotated ? ' upside-down' : ''}`, dataset: { page: String(cell.page), rotated: String(cell.rotated) } },
      pagePanel(byPage.get(cell.page)!, volume),
    ),
  );
  return sheet(11, 8.5, 'brief-zine-sheet', ...panels, ...foldMarks());
}

function readingPanel(page: BriefStoryZinePage, volume: BriefStoryZineVolume): Sheet {
  return sheet(2.75, 4.25, 'brief-zine-reader', pagePanel(page, volume));
}

function turner(o: ReaderOptions): Reader {
  const pages = BRIEF_STORY_ZINE_VOLUMES.flatMap((volume) => volume.pages.map((page) => ({ volume, page })));
  let at = 0;
  const content = h('div', { class: 'brief-zine-turner' });
  const count = h('span', { 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', onclick: () => show(at - 1) }, '◀ Back');
  const next = h('button', { type: 'button', onclick: () => show(at + 1) }, 'Next ▶');
  const bar = h('div', { class: 'brief-zine-bar' }, prev, count, next);
  const show = (n: number) => {
    at = Math.max(0, Math.min(pages.length - 1, n));
    const current = pages[at];
    const page = readingPanel(current.page, current.volume);
    page.el.style.width = 'min(100%, 330px, calc((100dvh - 200px) * 2.75 / 4.25))';
    count.textContent = `Vol. ${current.volume.number} · Page ${current.page.page} of 8`;
    prev.disabled = at === 0;
    next.disabled = at === pages.length - 1;
    content.replaceChildren(page.el, bar);
    o.shown(100);
  };
  show(0);
  return { el: content, view: () => undefined, size: () => undefined, step: (dir) => show(at + dir) };
}

export function briefStoryZineItem(): BoxItem {
  return {
    id: BRIEF_STORY_ZINE_ID,
    title: 'KEEP IT BRIEF! 100 Word Story Zines',
    note: `${BRIEF_STORY_ZINE_VOLUMES.length} one-sided letter sheets · fold, cut, and band`,
    icon: '📎',
    render: () => Promise.resolve(BRIEF_STORY_ZINE_VOLUMES.map(printedVolume)),
    reader: (options) => Promise.resolve(turner(options)),
  };
}
