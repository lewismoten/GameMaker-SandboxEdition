// The Graduations section of the Starters tab: one tile per graduation game (project/ceremonies.ts). One that is
// still locked is a padlock tile with its one-line rule and how far the player has got; one that is open or earned
// is the game's own tile. Clicking a padlock tile lists the courses still short of a B. Nothing here is stored:
// the states are worked out from the grades and the finished set each time. Under the Show picker's Done the
// section has only the earned ones, under Not done yet only the locked ones (the open ones are in readyStrip).
import { h, modal } from '../core/ui';
import { CEREMONIES, DIPLOMA, ceremonyState, ceremonyTitle, courseNumber, unlockRule, type Ceremony, type CeremonyState } from '../../project/ceremonies';
import type { Grades } from '../../project/grades';
import { withFinished } from '../../project/grades';
import type { HomeGame } from './homeCards';
import type { DoneFilter } from './homeDone';

const SVG = 'http://www.w3.org/2000/svg';

/** The padlock tile's picture: a gray rolled scroll with a padlock on it (a drawing, not the game's screen). */
function lockedPicture(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 320 200');
  svg.setAttribute('class', 'card-shot grad-art');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<rect width="320" height="200" fill="#2b2f36"/>' +
    '<rect x="50" y="48" width="220" height="104" rx="4" fill="#9aa0a8"/>' +
    '<rect x="56" y="54" width="208" height="92" fill="#c9cdd2"/>' +
    '<rect x="36" y="40" width="20" height="120" rx="10" fill="#7b8189"/>' +
    '<rect x="264" y="40" width="20" height="120" rx="10" fill="#7b8189"/>' +
    '<g fill="#8f959d"><rect x="80" y="64" width="160" height="6"/><rect x="90" y="78" width="140" height="6"/><rect x="100" y="92" width="120" height="6"/></g>' +
    '<path d="M138 104v-14a22 22 0 0 1 44 0v14" fill="none" stroke="#3b4048" stroke-width="9" stroke-linecap="round"/>' +
    '<rect x="128" y="102" width="64" height="48" rx="8" fill="#4a5058"/>' +
    '<circle cx="160" cy="122" r="7" fill="#c9cdd2"/><rect x="157" y="126" width="6" height="14" rx="2" fill="#c9cdd2"/>';
  return svg;
}

/** The padlock tile of a locked graduation. `onOpen` shows what is missing. */
function lockedTile(c: Ceremony, state: Extract<CeremonyState, { state: 'locked' }>, onOpen: () => void): HTMLElement {
  const pct = Math.round((state.done / state.needed) * 100);
  const select = h(
    'button',
    { class: 'tile-select', type: 'button', onclick: onOpen },
    h('span', { class: 'tile-title' }, h('span', { 'aria-hidden': 'true' }, '🔒 '), ceremonyTitle(c), h('span', { class: 'sr-only' }, ', locked')),
    h('span', { class: 'tile-meta grad-rule' }, unlockRule(c)),
    h(
      'span',
      { class: 'grad-progress', 'aria-hidden': 'true' },
      h('span', { class: 'grad-bar' }, h('span', { style: `width:${pct}%` })),
      h('span', {}, `${state.done} of ${state.needed}`),
    ),
  );
  const picture = h('div', { class: 'tile-shot' }, lockedPicture());
  picture.addEventListener('click', onOpen);
  return h('article', { class: 'card game-tile grad-tile', dataset: { grad: 'locked', search: ceremonyTitle(c).toLowerCase() } }, picture, select);
}

/** The "Keep going" dialog: the courses of a locked graduation still short of a B, or its honors still to earn. */
function keepGoing(c: Ceremony, state: Extract<CeremonyState, { state: 'locked' }>, titles: Map<string, string>, grades: Grades): void {
  const rows = state.missing.map((id) => {
    const n = courseNumber(id);
    const g = grades[id];
    return h('li', {}, n ? h('b', {}, `COURSE ${n} `) : null, titles.get(id) ?? id, h('span', { class: 'meta' }, g ? `, now ${g}` : ', not played yet'));
  });
  void modal('Keep going', () => [
    h(
      'p',
      {},
      h('b', {}, ceremonyTitle(c)),
      ` opens when you have ${state.needed} (${state.done} so far). ${c === DIPLOMA ? 'Still to earn:' : 'These courses still need a B or better:'}`,
    ),
    h('ul', { class: 'grad-missing', 'data-list-area': '' }, ...rows),
    h('p', { class: 'meta' }, 'You can retake any course to raise your grade.'),
  ]);
}

/** The graduations that are open but not yet earned (and whose game is on this site), in stage order, the diploma last. */
export function readyCeremonies(games: readonly HomeGame[], finished: ReadonlySet<string>, grades: Grades): { ceremony: Ceremony; game: HomeGame }[] {
  return [...CEREMONIES, DIPLOMA].flatMap((ceremony) => {
    const game = games.find((g) => g.entry?.id === ceremony.id);
    return game && ceremonyState(ceremony, grades, finished).state === 'open' ? [{ ceremony, game }] : [];
  });
}

/** The "Ready to graduate" strip above every group: a picture, a title and a Graduate button (which starts the ceremony) per open graduation, none when nothing is ready. */
export function readyStrip(
  ready: { ceremony: Ceremony; game: HomeGame }[],
  playHref: (g: HomeGame) => string,
  shot?: (g: HomeGame) => HTMLElement,
): HTMLElement[] {
  if (!ready.length) return [];
  return [
    h(
      'section',
      { class: 'grad-ready', 'aria-labelledby': 'grad-ready-h', dataset: { gradReady: '' } },
      h('h3', { id: 'grad-ready-h' }, 'Ready to graduate'),
      h(
        'ul',
        {},
        ...ready.map(({ ceremony, game }) =>
          h(
            'li',
            {},
            shot ? h('a', { class: 'grad-ready-pic', href: playHref(game), tabindex: -1, 'aria-hidden': 'true' }, shot(game)) : null,
            h('span', { class: 'grad-ready-title' }, ceremonyTitle(ceremony)),
            h('a', { class: 'button primary', href: playHref(game), 'aria-label': `Graduate: play ${ceremonyTitle(ceremony)}` }, 'Graduate'),
          ),
        ),
      ),
    ),
  ];
}

/** Which graduations the section shows: every one, only the earned ones (the Done filter) or only the locked ones (Not done yet). */
export type GradShow = 'all' | 'earned' | 'locked';

/** The Graduations section's graduations for the Starters tab's Show filter (homeDone.ts DoneFilter); an open one is always in readyStrip instead. */
export const gradShowFor = (f: DoneFilter): GradShow => (f === 'done' ? 'earned' : f === 'todo' ? 'locked' : 'all');

/** The graduations in the Graduations section (earned or locked, and whose game is on this site), in stage order, the diploma last; `show` keeps one kind. */
export function sectionCeremonies(
  games: readonly HomeGame[],
  finished: ReadonlySet<string>,
  grades: Grades,
  show: GradShow,
): { ceremony: Ceremony; game: HomeGame; state: CeremonyState }[] {
  return [...CEREMONIES, DIPLOMA].flatMap((ceremony) => {
    const game = games.find((g) => g.entry?.id === ceremony.id); // missing: left out by the Level filter, or not on this site yet
    const state = ceremonyState(ceremony, grades, finished);
    return game && state.state !== 'open' && (show === 'all' || state.state === show) ? [{ ceremony, game, state }] : [];
  });
}

/** The heading and tiles of the Graduations section. `tile` makes the real tile of a game that is earned; one that is ready is in readyStrip until then. `show` leaves out the earned or the locked ones. */
export function graduationCards(
  games: readonly HomeGame[],
  finished: ReadonlySet<string>,
  grades: Grades,
  tile: (g: HomeGame) => HTMLElement,
  titles: Map<string, string>,
  show: GradShow = 'all',
): HTMLElement[] {
  const all = withFinished(grades, finished);
  const out: HTMLElement[] = [];
  for (const { ceremony: c, game, state } of sectionCeremonies(games, finished, grades, show)) {
    if (state.state === 'earned') {
      const t = tile(game);
      t.dataset.grad = state.state;
      t.querySelector('.tile-select')?.setAttribute('aria-describedby', 'lib-sub-grad');
      out.push(t);
    } else if (state.state === 'locked') out.push(lockedTile(c, state, () => keepGoing(c, state, titles, all)));
  }
  if (!out.length) return out;
  return [
    h(
      'h3',
      { class: 'lib-sub', id: 'lib-sub-grad' },
      'Graduations',
      h('span', { class: 'lib-sub-count' }, show === 'earned' ? ` · ${out.length} earned` : ' · Each opens when you have earned it'),
    ),
    ...out,
  ];
}
