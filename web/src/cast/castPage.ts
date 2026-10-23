// The cast page (#/cast): who keeps turning up in the new games, and the kinds of games on
// the home page. The address keeps the family shown and the member last pointed at
// (#/cast?family=bizarre&who=carl), so a link opens on that card.
import './cast.css';
import { h, clear } from '../editor/core/ui';
import { viewState } from '../urlState';
import { CAST, CAST_GAMES, familiesOf, type CastMember, type Family } from './castData';

const FILTERS: [Family | 'all', string][] = [
  ['all', 'Everyone'],
  ['sandbox', 'Sandbox Software'],
  ['bizarre', 'The Bard of Bizarre'],
];

const gameHref = (id: string) => `#/game/cd:${id}`;
const tabHref = (tab: string) => `#/?tab=${tab}`;

function card(m: CastMember, pick: (m: CastMember, e: Event) => void): HTMLElement {
  const families = familiesOf(m);
  return h(
    'article',
    { class: 'cast-card', id: `cast-${m.id}`, dataset: { families: families.join(' ') }, 'aria-labelledby': `cast-${m.id}-name` },
    h(
      'div',
      { class: 'cast-pic' },
      h('img', { src: `./cast/${m.id}.png`, width: m.art.width, height: m.art.height, alt: m.art.alt, loading: 'lazy', decoding: 'async' }),
    ),
    h(
      'div',
      { class: 'cast-text' },
      h('h3', { id: `cast-${m.id}-name` }, h('a', { href: `#/cast?who=${m.id}`, class: 'cast-anchor', onclick: (e: Event) => pick(m, e) }, m.name)),
      h('p', { class: 'cast-role' }, m.role),
      h('p', { class: 'cast-bio' }, m.bio),
      h(
        'details',
        { class: 'cast-appears', open: true },
        h('summary', null, `Appears in ${m.appears.length} game${m.appears.length === 1 ? '' : 's'}`),
        h(
          'ul',
          null,
          m.appears.map((a) => h('li', { class: `fam-${CAST_GAMES[a.game][1]}` }, h('a', { href: gameHref(a.game) }, CAST_GAMES[a.game][0]), h('span', { class: 'cast-as' }, ` — ${a.as}`))),
        ),
      ),
    ),
  );
}

const families = () =>
  h(
    'section',
    { class: 'cast-families', 'aria-labelledby': 'cast-families-h' },
    h('h2', { id: 'cast-families-h' }, 'Three kinds of games'),
    h(
      'div',
      { class: 'cast-fam-grid' },
      h(
        'section',
        { class: 'cast-fam fam-sandbox', 'aria-labelledby': 'fam-sandbox-h' },
        h('h3', { id: 'fam-sandbox-h' }, 'Sandbox Software'),
        h(
          'p',
          null,
          'Twelve new games made for this edition in the style of 1995 retail and shareware: each comes in a box with a printed manual, a disk label and paper extras to print, and plays in real DOS too. Sandbox Software is made up; it is where Teddy, Gwinn and THE CHEZ live. Look closely and every one also hides a little felt egg.',
        ),
        h('a', { href: tabHref('sandbox') }, 'Browse Sandbox →'),
      ),
      h(
        'section',
        { class: 'cast-fam fam-bizarre', 'aria-labelledby': 'fam-bizarre-h' },
        h('h3', { id: 'fam-bizarre-h' }, 'The Bard of Bizarre'),
        h(
          'p',
          null,
          'Lewis’s songs turned into games: bizarre gospels, mundane epics, Shakespeare in Sweatpants and the Latin Veni, Vidi, Risi!. In the story they are shareware uploaded to The Sofa BBS, so there is no box, just a notice telling the song behind each one, and they are this project’s own and free to change: edit a copy and see how it was made.',
        ),
        h('a', { href: tabHref('bizarre') }, 'Browse Bizarre →'),
      ),
      h(
        'section',
        { class: 'cast-fam fam-cd', 'aria-labelledby': 'fam-cd-h' },
        h('h3', { id: 'fam-cd-h' }, 'Gameware and Shareware'),
        h(
          'p',
          null,
          'The games from the original Game-Maker CD and the BBSes of the 90s. Gameware are the free samples that came with Game-Maker, yours to open and borrow from; shareware are other people’s games, played exactly as they released them. None of this cast is in them: they were here first.',
        ),
        h('span', { class: 'cast-fam-links' }, h('a', { href: tabHref('gameware') }, 'Gameware →'), ' ', h('a', { href: tabHref('shareware') }, 'Shareware →')),
      ),
    ),
  );

/** The cast page into `el`. */
export function renderCast(el: HTMLElement): void {
  const state = viewState(['cast']);
  const want = state.get('family');
  let family: Family | 'all' = FILTERS.some(([f]) => f === want) ? (want as Family) : 'all';
  // a name is a link to its card; here it marks the card without leaving the page
  const pick = (m: CastMember, e: Event) => {
    e.preventDefault();
    state.set({ who: m.id });
    cards.forEach((c, i) => c.classList.toggle('cast-picked', CAST[i] === m));
  };
  const cards = CAST.map((m) => card(m, pick));
  const grid = h('div', { class: 'cast-grid', id: 'cast-grid' }, cards);
  const count = h('p', { class: 'cast-count', role: 'status' });
  const buttons = FILTERS.map(([f, label]) =>
    h(
      'button',
      {
        type: 'button',
        class: `cast-filter fam-${f}`,
        'aria-controls': 'cast-grid',
        onclick: () => {
          family = f;
          state.set({ family: f === 'all' ? undefined : f });
          apply();
        },
      },
      label,
    ),
  );
  const apply = () => {
    let shown = 0;
    CAST.forEach((m, i) => {
      const on = family === 'all' || familiesOf(m).includes(family);
      cards[i].hidden = !on;
      if (on) shown++;
    });
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(FILTERS[i][0] === family)));
    count.textContent = `${shown} of ${CAST.length}`;
  };
  apply();
  clear(
    el,
    h(
      'main',
      { class: 'cast', 'aria-labelledby': 'cast-h' },
      h('p', { class: 'cast-kicker' }, 'Who’s who'),
      h('h1', { id: 'cast-h' }, 'The cast'),
      h(
        'p',
        { class: 'lead' },
        'The same faces keep turning up in this edition’s new games: a corgi with one ear taller than the other, his sister-in-mischief, a friendly hobo clown, a tomato-red electric car that is always charging, and a goat nobody painted. Here is who they are, and where to find them.',
      ),
      families(),
      h(
        'section',
        { class: 'cast-members', 'aria-labelledby': 'cast-members-h' },
        h(
          'div',
          { class: 'cast-bar' },
          h('h2', { id: 'cast-members-h' }, 'The regulars'),
          h('div', { class: 'cast-filters', role: 'group', 'aria-label': 'Show the cast of' }, buttons),
          count,
        ),
        grid,
      ),
      h('p', { class: 'cast-foot' }, h('a', { href: '#/' }, '← All games'), ' · ', h('a', { href: '#/help/credits' }, 'Credits and the Bard’s songs')),
    ),
  );
  // a link to one member: its card in view, marked for a moment
  const who = state.get('who');
  const target = who && el.querySelector<HTMLElement>(`#cast-${CSS.escape(who)}`);
  if (target) {
    if (target.hidden) {
      family = 'all';
      state.set({ family: undefined });
      apply();
    }
    target.classList.add('cast-picked');
    requestAnimationFrame(() => target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }
}
