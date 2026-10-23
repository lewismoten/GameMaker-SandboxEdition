// The Credits page (#/credits): the software the site is built with, the third-party pieces in
// the engine and players, the original Game-Maker and its makers, the games' authors, the AI
// tools and the people, and The Bard of Bizarre's table of who made what. NOTICE.md stays the
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
import { peopleSection } from './peopleSection';
import { bardSection } from './bardTable';

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
      softwareSection(),
      piecesSection(),
      originalSection(),
      authorsSection(),
      peopleSection(),
      bardSection(),
    ),
  );
  pageToc(el.querySelector('main')!);
}
