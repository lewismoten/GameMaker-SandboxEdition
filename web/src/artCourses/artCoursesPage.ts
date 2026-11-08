// The art courses (#/art-courses): a contents page, and a page for each course (#/art-courses/<course>) with its lessons and
// figures. Text and figures come from courses.ts; the figures are PNGs drawn in code (scripts/artCourseFigures.ts).
import './artCourses.css';
import { h, clear } from '../editor/core/ui';
import { BOOK_TITLE, COMING, COURSES, courseById, type Course, type Part } from './courses';

const ROOT = '#/art-courses';
const figures = import.meta.glob<string>('./figures/*.png', { eager: true, query: '?url', import: 'default' });

const part = (p: Part): HTMLElement => {
  if ('p' in p) return h('p', null, p.p);
  if ('ul' in p) return h('ul', null, ...p.ul.map((t) => h('li', null, t)));
  const src = figures[`./figures/${p.fig}.png`];
  return h('figure', null, h('img', { src, alt: p.alt, loading: 'lazy' }), h('figcaption', null, p.caption));
};

function contents(el: HTMLElement): void {
  el.append(
    h(
      'main',
      { class: 'ac-page' },
      h('p', null, h('a', { href: '#/library' }, '← Library')),
      h('h1', null, BOOK_TITLE),
      h(
        'p',
        null,
        'How to draw the art for a Game-Maker game. Every picture here is a real block drawn in code, the same way the games’ own art is, so what you see is what a game spends. Each course points to the Starters on the Sample CD that show the editor side.',
      ),
      h(
        'ul',
        { class: 'ac-list' },
        ...COURSES.map((c) => h('li', null, h('a', { href: `${ROOT}/${c.id}` }, h('strong', null, c.title), h('span', { class: 'ac-about' }, c.about)))),
      ),
      h('h2', null, 'Coming'),
      h('ul', { class: 'ac-list' }, ...COMING.map((c) => h('li', { class: 'ac-soon' }, h('strong', null, c.title), h('span', { class: 'ac-about' }, c.about)))),
    ),
  );
}

function coursePage(el: HTMLElement, c: Course): void {
  const i = COURSES.indexOf(c);
  const prev = COURSES[i - 1];
  const next = COURSES[i + 1];
  const link = (to: Course | undefined, text: string, cls: string) =>
    to ? h('a', { href: `${ROOT}/${to.id}`, class: cls }, text, h('br'), h('strong', null, to.title)) : h('span');
  el.append(
    h(
      'main',
      { class: 'ac-page' },
      h('p', null, h('a', { href: ROOT }, `← ${BOOK_TITLE}`)),
      h('p', { class: 'ac-kicker' }, `Course ${i + 1}`),
      h('h1', null, c.title),
      h('p', null, c.about),
      ...c.lessons.flatMap((l) => [h('h2', { id: l.id }, l.title), ...l.parts.map(part)]),
      h('p', { class: 'ac-note' }, `Try it in Game-Maker: ${c.starters.join(' and ')}, on the Sample CD, show the editor side of these ideas.`),
      h('nav', { class: 'ac-pager', 'aria-label': 'Courses' }, link(prev, '← Previous', 'ac-prev'), link(next, 'Next →', 'ac-next')),
    ),
  );
}

/** The page into `el`: the contents with no `course`, or one course. Returns the title for the tab. */
export function renderArtCourses(el: HTMLElement, course?: string): string {
  clear(el);
  const c = course ? courseById(course) : undefined;
  if (c) {
    coursePage(el, c);
    return `${c.title} · ${BOOK_TITLE}`;
  }
  contents(el);
  return BOOK_TITLE;
}
