// The Credits page (#/credits): the software the site is built with, the third-party pieces in
// the engine and players, the original Game-Maker and its makers, the games' authors, where to find more Game-Maker games, the AI
// tools and the people, The Bard of Bizarre's table of who made what, and the BBSes' pictures. NOTICE.md stays the
// legal text; this page links to it. Linked from the header's ⋯ menu, the Guide's credits and
// the home page's Getting started.
import './credits.css';
import { h, clear } from '../editor/core/ui';
import { NOTICE_URL, PRODUCT } from '../edition';
import { REPO_URL } from '../seo/site';
import { softwareSection } from './softwareSection';
import { piecesSection } from './piecesSection';
import { originalSection } from './originalSection';
import { authorsSection } from './authorsSection';
import { moreGamesSection } from './moreGames';
import { aiToolsSection, peopleSection } from './peopleSection';
import { bardSection } from './bardTable';
import { bbsPicturesSection } from './bbsPicturesSection';
import { creditsTabs, gotoCredit, type CreditsTab } from './tabs';
import './creditsLayout.css';

/** The sections, one tab each. */
const SECTIONS: CreditsTab[] = [
  { id: 'credits-original', key: 'original', title: 'The original', what: 'RSD and the Stone family, part by part' },
  { id: 'credits-authors', key: 'authors', title: 'Game authors', what: 'The CD’s games, Sandbox Software and the Bard' },
  { id: 'credits-people', key: 'people', title: 'The people', what: 'Lewis, and the cast who appear as themselves' },
  { id: 'credits-more-games', key: 'more-games', title: 'More games', what: 'Other sites that keep the games players made' },
  { id: 'credits-bard-table', key: 'bard', title: 'The Bard', what: 'Who made what, game by game' },
  { id: 'credits-bbs-pictures', key: 'bbs', title: 'BBS pictures', what: 'Who took each one; download one by modem' },
  { id: 'credits-ai', key: 'ai', title: 'AI tools', what: 'What each tool made' },
  { id: 'credits-pieces', key: 'pieces', title: 'Third-party pieces', what: 'Fonts, headers and runtimes in the site and players' },
  { id: 'credits-software', key: 'software', title: 'Software', what: 'The build and test tools and what they use' },
];

/** The page into `el`. */
export function renderCredits(el: HTMLElement): void {
  const ext = { target: '_blank', rel: 'noopener' };
  const panels = [
    originalSection(),
    authorsSection(),
    peopleSection(),
    moreGamesSection(),
    bardSection(),
    bbsPicturesSection(),
    aiToolsSection(),
    piecesSection(),
    softwareSection(),
  ];
  const main = h(
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
    h('div', { class: 'credits-tabs-wrap' }),
    ...panels,
  );
  main.querySelector('.credits-tabs-wrap')!.append(creditsTabs(SECTIONS, panels, main));
  clear(el, main);
  const open = new URLSearchParams(location.hash.split('?')[1] ?? '').get('go');
  if (open) gotoCredit(open);
}
