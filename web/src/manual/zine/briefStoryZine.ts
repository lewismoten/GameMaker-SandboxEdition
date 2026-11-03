// KEEP IT BRIEF!'s Tiny Pockets Press series: six one-sided, fold-and-cut eight-page zines.
import './briefStoryZine.css';
import { h } from '../../editor/core/ui';
import { WINGS, story, type Story } from '../../../../games/brief/src/stories';
import { sheet, type Sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';
import type { Reader, ReaderOptions } from '../readView';

export const BRIEF_STORY_ZINE_ID = 'brief-story-zines';
const STORIES_PER_VOLUME = 6;

export interface BriefStoryZinePage {
  page: number;
  kind: 'cover' | 'story' | 'index' | 'back';
  title: string;
  text: string;
  story?: Story;
}

export interface BriefStoryZineVolume {
  number: number;
  stories: Story[];
  pages: BriefStoryZinePage[];
  printInstructions: string;
}

export interface MiniZineCell {
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

/** The fold opens the physical cells into ordinary page order. */
export function classicMiniZineReadingOrder(cells: readonly MiniZineCell[]): number[] {
  return [...cells].map((cell) => cell.page).sort((a, b) => a - b);
}

const sourceStories = (): Story[] => WINGS.flatMap((wing) => wing.books.map(story)).sort((a, b) => a.n - b.n);

const instructions =
  'Fold on the faint lines, then cut only the dashed center slot. spine-notch rubber band recommended: the two notch marks keep a band on the fold without piercing pages. The center punch mark is optional, but a hole can tear and does not hold the folded stack closed as reliably. Laurence Simon’s weekly 100 Word Stories challenge and podcast inspired these stories.';

function cover(volume: number, stories: Story[]): BriefStoryZinePage {
  return {
    page: 1,
    kind: 'cover',
    title: 'KEEP IT BRIEF!',
    text: `Tiny Pockets Press · Volume ${volume} · ${stories.length} 100-word stories`,
  };
}

function filler(page: number, volume: number): BriefStoryZinePage {
  return {
    page,
    kind: 'index',
    title: 'TINY POCKETS INDEX',
    text: `Volume ${volume} is a short stack: this pocket is reserved for the next story. Keep this zine with the rest of the Tiny Pockets Press run.`,
  };
}

function back(volume: number): BriefStoryZinePage {
  return {
    page: 8,
    kind: 'back',
    title: 'TINY POCKETS PRESS',
    text: `Volume ${volume}. Stories by Lewis Moten, written for Laurence Simon’s weekly 100 Word Stories challenge and podcast. ...And, as always, keep it brief!`,
  };
}

function volume(number: number, stories: Story[]): BriefStoryZineVolume {
  const interior = [
    ...stories.map((entry, i) => ({ page: i + 2, kind: 'story' as const, title: entry.title, text: entry.text, story: entry })),
    ...Array.from({ length: STORIES_PER_VOLUME - stories.length }, (_, i) => filler(stories.length + i + 2, number)),
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
      h('p', { class: 'brief-zine-blurb' }, 'SIX TINY TALES! BIG FOLD! ONE RAD SHEET!'),
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
    article.append(h('h2', null, page.title), h('p', null, page.text), h('p', { class: 'brief-zine-tiny' }, 'Tiny Pockets Press · keep this pocket close.'));
  }
  return article;
}

function foldMarks(): HTMLElement[] {
  return [
    h('i', { class: 'brief-zine-fold v one', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold v two', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold v three', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-fold h', 'aria-hidden': 'true' }),
    h('i', { class: 'brief-zine-cut', 'aria-label': 'Cut this dashed center slot after folding' }, '✂ CUT'),
    h('i', { class: 'brief-zine-notch top', 'aria-label': 'Top rubber-band notch cut-out mark' }),
    h('i', { class: 'brief-zine-notch bottom', 'aria-label': 'Bottom rubber-band notch cut-out mark' }),
    h('i', { class: 'brief-zine-punch', 'aria-label': 'Optional center-spine punch-hole mark' }),
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
