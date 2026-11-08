// The Programmer's Guide to Game-Maker 3.0 (#/programmers-guide): a contents page, a page for each chapter
// (#/programmers-guide/<chapter>) and every chapter on one page for printing (#/programmers-guide/all).
import './programmersGuide.css';
import { h, clear } from '../editor/core/ui';
import { PRODUCT } from '../edition';
import { BOOK_TITLE, CHAPTERS, chapterById, loadChapter, type Chapter } from './chapters';
import { chapterElements } from './render';

const ROOT = '#/programmers-guide';
const label = (c: Chapter) => (c.no ? `Chapter ${c.no}` : 'Appendix');

const marksKey = (): HTMLElement =>
  h(
    'section',
    { class: 'pg-key', 'aria-labelledby': 'pg-key-h' },
    h('h2', { id: 'pg-key-h' }, 'How to read the marks'),
    h(
      'ul',
      null,
      h(
        'li',
        null,
        h('span', { class: 'pg-mark pg-tag' }, '16-bit'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, '64K'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, 'VGA'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, 'PIT'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, 'file'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, 'DOS'),
        ' ',
        h('span', { class: 'pg-mark pg-tag' }, 'design'),
        ': the cause of a limit (chapter 1 explains each).',
      ),
      h(
        'li',
        null,
        h('span', { class: 'pg-mark pg-inference' }, 'inference'),
        ': the source gives the number but not the reason. The reason is my reading and may be wrong.',
      ),
      h('li', null, h('span', { class: 'pg-mark pg-estimate' }, 'estimate'), ': arithmetic from the hardware of the time, not from the source.'),
      h(
        'li',
        null,
        h('span', { class: 'pg-mark pg-verify' }, 'not yet checked in DOSBox'),
        ': read from the source, not yet run in the real player. Treat it as a good reading, not a fact.',
      ),
    ),
  );

const credit = (): HTMLElement =>
  h(
    'p',
    { class: 'pg-credit' },
    'The research and the prose of this book were made by Claude (Sonnet 5.5 workers, reviewed by Opus) from the original Game-Maker source in this repository, ',
    h('code', null, 'code/GM'),
    '. Every citation links to the line it comes from. See the ',
    h('a', { href: '#/credits' }, 'credits'),
    '.',
  );

function contents(el: HTMLElement): void {
  el.append(
    h(
      'main',
      { class: 'pg-page' },
      h('p', { class: 'pg-back' }, h('a', { href: '#/library' }, '← Library')),
      h('h1', null, BOOK_TITLE),
      h(
        'p',
        { class: 'lead' },
        `Why each limit of the player is what it is. 150 blocks, 64 monsters, 36 steps in a sound, 20 links from a scene: each has a number, a line of source and a cause. For people who make games with ${PRODUCT} and want to plan around the real rules.`,
      ),
      credit(),
      h('p', null, h('a', { class: 'pg-button', href: `${ROOT}/all` }, 'Read it all on one page (print or save as PDF)')),
      h(
        'nav',
        { 'aria-labelledby': 'pg-toc-h' },
        h('h2', { id: 'pg-toc-h' }, 'Contents'),
        h(
          'ol',
          { class: 'pg-toc' },
          ...CHAPTERS.map((c) =>
            h(
              'li',
              null,
              h(
                'a',
                { href: `${ROOT}/${c.id}` },
                h('span', { class: 'pg-no' }, c.no || '＋'),
                h('span', null, h('strong', null, c.title), h('br'), h('span', { class: 'pg-about' }, c.about)),
              ),
            ),
          ),
        ),
      ),
      marksKey(),
    ),
  );
}

async function chapterPage(el: HTMLElement, c: Chapter): Promise<void> {
  const i = CHAPTERS.indexOf(c);
  const prev = CHAPTERS[i - 1];
  const next = CHAPTERS[i + 1];
  const body = chapterElements(await loadChapter(c.id), c.id);
  const link = (to: Chapter | undefined, text: string, cls: string) =>
    to ? h('a', { href: `${ROOT}/${to.id}`, class: cls }, text, h('br'), h('strong', null, to.title)) : h('span');
  clear(el);
  el.append(
    h(
      'main',
      { class: 'pg-page' },
      h('p', { class: 'pg-back' }, h('a', { href: ROOT }, `← ${BOOK_TITLE}`)),
      h('p', { class: 'pg-kicker' }, label(c)),
      h('h1', null, c.title),
      ...body,
      h('nav', { class: 'pg-pager', 'aria-label': 'Chapters' }, link(prev, '← Previous', 'pg-prev'), link(next, 'Next →', 'pg-next')),
    ),
  );
}

async function everything(el: HTMLElement): Promise<void> {
  const bodies = await Promise.all(CHAPTERS.map(async (c) => chapterElements(await loadChapter(c.id), c.id, 1)));
  clear(el);
  el.append(
    h(
      'main',
      { class: 'pg-page pg-all' },
      h(
        'p',
        { class: 'pg-back' },
        h('a', { href: ROOT }, `← ${BOOK_TITLE}`),
        ' · ',
        h('button', { type: 'button', class: 'pg-button', onclick: () => window.print() }, 'Print or save as PDF'),
      ),
      h('h1', null, BOOK_TITLE),
      credit(),
      marksKey(),
      ...CHAPTERS.flatMap((c, i) => [
        h('section', { class: 'pg-chapter' }, h('p', { class: 'pg-kicker' }, label(c)), h('h2', { class: 'pg-chapter-title' }, c.title), ...bodies[i]),
      ]),
    ),
  );
}

/** The page into `el`: the contents with no `chapter`, one chapter, or `all`. Returns the title for the tab. */
export async function renderProgrammersGuide(el: HTMLElement, chapter?: string): Promise<string> {
  clear(el);
  if (chapter === 'all') {
    await everything(el);
    return `${BOOK_TITLE} · all chapters`;
  }
  const c = chapter ? chapterById(chapter) : undefined;
  if (c) {
    await chapterPage(el, c);
    return `${c.title} · ${BOOK_TITLE}`;
  }
  contents(el);
  return BOOK_TITLE;
}
