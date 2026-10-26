// The guide for today's web Game-Maker, shown at #/help.
import './webManual.css';
import { h, clear } from '../editor/core/ui';
import { decorateBbsName } from '../retro/bbs/bbsName';
import { GUIDE_SECTIONS } from './guideSections';
import { hashParam } from '../urlState';

const SECTIONS = GUIDE_SECTIONS;

/**
 * The guide, one section at a time so it fits the window: the contents beside it (a
 * "Contents" menu on a phone), the section at #/help/<id>, and Previous / Next under it.
 */
export function renderWebManual(el: HTMLElement, sectionId?: string): void {
  const at = Math.max(
    0,
    SECTIONS.findIndex(([id]) => id === sectionId),
  );
  const [id, title, html] = SECTIONS[at];
  const article = h('article', { 'aria-labelledby': `help-${id}` });
  article.innerHTML = `${at === 0 ? '<p class="guide-kicker">Game-Maker: Sandbox Edition guide</p>' : '<p class="guide-kicker">Guide</p>'}
    <h1 id="help-${id}">${title}</h1>
    ${at === 0 ? '<p class="lead">How to design, play and share games with today’s web version.</p>' : ''}
    ${html.replace(/<(\/?)h3\b/g, '<$1h2')}`;
  const link = (i: number, label: string, cls = '') =>
    h('a', { href: `#/help/${SECTIONS[i][0]}`, class: cls, 'aria-current': i === at ? 'page' : undefined }, label);
  article.append(
    h(
      'nav',
      { class: 'guide-pager', 'aria-label': 'Previous and next section' },
      at > 0 ? link(at - 1, `← ${SECTIONS[at - 1][1]}`, 'prev') : h('span'),
      at < SECTIONS.length - 1 ? link(at + 1, `${SECTIONS[at + 1][1]} →`, 'next') : h('span'),
    ),
  );
  const toc = h(
    'details',
    { class: 'guide-toc', open: matchMedia('(min-width: 761px)').matches },
    h('summary', null, h('span', null, 'Contents: '), title),
    h('nav', { 'aria-label': 'Guide contents' }, h('a', { href: '#/' }, '← Home'), ...SECTIONS.map(([, t], i) => link(i, t))),
  );
  for (const b of article.querySelectorAll('.guide-open-ultimate'))
    b.addEventListener('click', () => void import('./ultimate/openUltimate').then((m) => m.openUltimateGuide()));
  for (const b of article.querySelectorAll('.guide-open-owners')) b.addEventListener('click', () => void import('./dosManual').then((m) => m.openDosManual()));
  // #/help/ultimate?chapter=levels opens the guide at that chapter (the level check links here)
  const chapter = hashParam('chapter');
  if (id === 'ultimate' && chapter)
    void import('./ultimate/openUltimate').then((m) => {
      // closing the guide comes back to its Open button, not to the top of the page
      article.querySelector<HTMLElement>('.guide-open-ultimate')?.focus({ preventScroll: true });
      return m.openUltimateGuide(chapter);
    });
  decorateBbsName(article);
  clear(el, h('div', { class: 'guide' }, toc, article));
}
