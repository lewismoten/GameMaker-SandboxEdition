// The Credits page (#/credits): the software the site is built with, the third-party pieces in
// the engine and players, the original Game-Maker and its makers, the games' authors, where to find more Game-Maker games, the AI
// tools and the people, The Bard of Bizarre's table of who made what, and the BBSes' pictures. NOTICE.md stays the
// legal text; this page links to it. Linked from the header's ⋯ menu, the Guide's credits and
// the home page's Getting started.
import './credits.css';
import { h, clear } from '../editor/core/ui';
import { pageToc } from '../pageToc';
import { NOTICE_URL, PRODUCT } from '../edition';
import { REPO_URL } from '../seo/site';
import { softwareSection } from './softwareSection';
import { piecesSection } from './piecesSection';
import { originalSection } from './originalSection';
import { authorsSection } from './authorsSection';
import { moreGamesSection } from './moreGames';
import { peopleSection } from './peopleSection';
import { bardSection } from './bardTable';
import { bbsPicturesSection } from './bbsPicturesSection';
import './creditsLayout.css';

/** The sections, for a window too narrow for "On this page" beside the text (pageToc.css). */
const SECTIONS: [id: string, title: string, what: string][] = [
  ['credits-original', 'The original Game-Maker', 'RSD and the Stone family, part by part'],
  ['credits-authors', 'Game authors', 'The CD’s games, Sandbox Software and the Bard'],
  ['credits-more-games', 'Find more Game-Maker games', 'Other sites that keep the games players made'],
  ['credits-people', 'AI tools and the people', 'What each tool made, Lewis and the cast'],
  ['credits-bard-table', 'The Bard of Bizarre', 'Who made what, game by game'],
  ['credits-bbs-pictures', 'Pictures on the BBS', 'Who took each one; download one by modem'],
  ['credits-pieces', 'Third-party pieces', 'Fonts, headers and runtimes in the site and players'],
  ['credits-software', 'Software', 'The build and test tools and what they use'],
];

function jumpList(): HTMLElement {
  return h(
    'nav',
    { class: 'credits-jump', 'aria-label': 'Sections' },
    h(
      'ul',
      null,
      ...SECTIONS.map(([id, title, what]) =>
        h(
          'li',
          null,
          h(
            'a',
            {
              href: '#/credits',
              onclick: (e: Event) => {
                e.preventDefault();
                const head = document.getElementById(id);
                if (!head) return;
                head.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                head.setAttribute('tabindex', '-1');
                head.focus({ preventScroll: true });
              },
            },
            h('b', null, title),
            h('span', null, what),
          ),
        ),
      ),
    ),
  );
}

/** The page into `el`. */
export function renderCredits(el: HTMLElement): void {
  const ext = { target: '_blank', rel: 'noopener' };
  clear(
    el,
    h(
      'main',
      { class: 'credits-page' },
      h('p', { class: 'credits-back' }, h('a', { href: '#/' }, '← All games')),
      h('h1', null, 'Credits'),
      h(
        'p',
        { class: 'lead' },
        `Who and what made ${PRODUCT}: the original Game-Maker and its makers, the games’ authors, the tools and the people. The legal notices are in `,
        h('a', { href: NOTICE_URL, ...ext }, 'NOTICE.md'),
        ' and the license in ',
        h('a', { href: `${REPO_URL}/blob/master/LICENSE`, ...ext }, 'LICENSE'),
        ' (MIT).',
      ),
      jumpList(),
      originalSection(),
      authorsSection(),
      moreGamesSection(),
      peopleSection(),
      bardSection(),
      bbsPicturesSection(),
      piecesSection(),
      softwareSection(),
    ),
  );
  pageToc(el.querySelector('main')!);
}
