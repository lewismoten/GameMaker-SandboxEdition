// The cast page (#/cast): who keeps turning up in the new games, and the kinds of games on
// the home page. The address keeps the tab shown and the member last pointed at
// (#/cast?tab=bard&who=carl), so a link opens on that card.
import './cast.css';
import { h, clear } from '../editor/core/ui';
import { viewState } from '../urlState';
import { CAST, CAST_GAMES, familiesOf, type CastMember } from './castData';
import { castStage } from './castStage';
import { seenIn } from './castThumbs';
import { heartProgress, joeAllAlong } from '../tinHearts/progress';
import { unlockAchievement } from '../achievements';

const gameHref = (id: string) => `#/game/cd:${id}`;
const tabHref = (tab: string) => `#/?tab=${tab}`;

/** A sprite at a whole multiple of its pixels; a bigger picture fitted to the frame. */
function shown(m: CastMember): { width: number; height: number } {
  const { width: w, height: h } = m.art;
  const k = Math.max(w, h) <= 40 ? Math.min(4, Math.floor(96 / Math.max(w, h))) : Math.min(1, 128 / Math.max(w, h));
  return { width: Math.round(w * k), height: Math.round(h * k) };
}

function card(m: CastMember, pick: (m: CastMember, e: Event) => void): HTMLElement {
  const families = familiesOf(m);
  return h(
    'article',
    { class: 'cast-card', id: `cast-${m.id}`, dataset: { families: families.join(' ') }, 'aria-labelledby': `cast-${m.id}-name` },
    h(
      'div',
      { class: 'cast-pic' },
      h('img', {
        src: `./cast/${m.id}.png`,
        ...shown(m),
        alt: m.art.alt,
        loading: 'lazy',
        decoding: 'async',
        class: Math.max(m.art.width, m.art.height) <= 128 ? 'sprite' : undefined,
      }),
    ),
    h(
      'div',
      { class: 'cast-text' },
      h('h3', { id: `cast-${m.id}-name` }, h('a', { href: `#/cast?who=${m.id}`, class: 'cast-anchor', onclick: (e: Event) => pick(m, e) }, m.name)),
      h('p', { class: 'cast-role' }, m.role),
      h('p', { class: 'cast-bio' }, m.bio),
      m.id === 'tinHeart' && heartProgress(),
      m.id === 'joe' && joeAllAlong(),
    ),
    m.appears.length
      ? h('div', { class: 'cast-seen-box' }, h('p', { class: 'cast-seen-h' }, 'Seen in:'), seenIn(m.appears))
      : h('p', { class: 'cast-seen-box cast-seen-h' }, 'Seen in: hidden here and there. Listen for the tick-tock.'),
    m.appears.length > 0 &&
      h(
        'details',
        { class: 'cast-appears' },
        h('summary', null, `What ${m.appears.length === 1 ? 'they do there' : `they do in each of the ${m.appears.length} games`}`),
        h(
          'ul',
          null,
          m.appears.map((a) =>
            h(
              'li',
              { class: `fam-${CAST_GAMES[a.game][1]}` },
              h('a', { href: gameHref(a.game) }, CAST_GAMES[a.game][0]),
              h('span', { class: 'cast-as' }, ` — ${a.as}`),
            ),
          ),
        ),
      ),
  );
}

type Tab = 'people' | 'things' | 'bard' | 'games';

/** The tabs: who is on each, and what the page says above them. */
const TABS: { id: Tab; label: string; blurb: string; ids: string[] }[] = [
  {
    id: 'people',
    label: 'Characters',
    blurb: 'The faces that keep turning up: the dog, the clown, the maker and a couple of robots.',
    ids: ['teddy', 'gwinn', 'leo', 'lewis', 'lewie', 'joe', 'watt'],
  },
  {
    id: 'things',
    label: 'Things and places',
    blurb: 'A car, a library, a drink, a rubber chicken and the little things hidden in the games.',
    ids: ['chez', 'chicken', 'doghouse', 'rootbeer', 'tinHeart', 'easterEgg'],
  },
  {
    id: 'bard',
    label: 'The Bard of Bizarre',
    blurb: 'The songwriter and the odd stars of his songs, turned into games.',
    ids: ['bard', 'carl', 'goat', 'seed', 'loaf', 'camel', 'will'],
  },
  { id: 'games', label: 'Kinds of games', blurb: '', ids: [] },
];

const tabOf = (id: string): Tab => TABS.find((t) => t.ids.includes(id))?.id ?? 'things';

const families = () =>
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
        'Thirteen new games made for this edition in the style of 1995 retail and shareware: each comes in a box with a printed manual, a disk label and paper extras to print, and plays in real DOS too. Sandbox Software is made up; it is where Teddy, Gwinn and THE\u00a0CHEZ live. Look closely and most of them also hide a little felt egg.',
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
  );

/** The cast page into `el`. */
export function renderCast(el: HTMLElement): void {
  unlockAchievement('cast-visit');
  const state = viewState(['cast']);
  const want = state.get('tab');
  let tab: Tab = TABS.some((t) => t.id === want) ? (want as Tab) : 'people';
  // a name is a link to its card; here it marks the card without leaving the page
  const pick = (m: CastMember, e: Event) => {
    e.preventDefault();
    state.set({ who: m.id });
    cards.forEach((c, i) => c.classList.toggle('cast-picked', CAST[i] === m));
  };
  const cards = CAST.map((m) => card(m, pick));
  const grid = h('div', { class: 'cast-grid', id: 'cast-grid' }, cards);
  const blurb = h('p', { class: 'cast-blurb' });
  const tabs = TABS.map((t) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: `cast-tab-${t.id}`,
        class: 'cast-tab',
        'aria-controls': 'cast-panel',
        onclick: () => select(t.id),
        onkeydown: (e: KeyboardEvent) => {
          const i = TABS.findIndex((x) => x.id === tab);
          const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
          if (to === undefined) return;
          e.preventDefault();
          select(TABS[(to + TABS.length) % TABS.length].id, true);
        },
      },
      t.label,
    ),
  );
  const kinds = families();
  const apply = () => {
    const t = TABS.find((x) => x.id === tab)!;
    CAST.forEach((m, i) => (cards[i].hidden = !t.ids.includes(m.id)));
    tabs.forEach((b, i) => {
      const on = TABS[i].id === tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `cast-tab-${tab}`);
    blurb.textContent = t.blurb;
    blurb.hidden = tab === 'games';
    grid.hidden = tab === 'games';
    kinds.hidden = tab !== 'games';
  };
  const select = (t: Tab, focus = false) => {
    tab = t;
    state.set({ tab: t === 'people' ? undefined : t });
    apply();
    if (focus) tabs[TABS.findIndex((x) => x.id === t)].focus();
  };
  const panel = h('div', { class: 'cast-panel', id: 'cast-panel', role: 'tabpanel' }, blurb, grid, kinds);
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
        'The same faces keep turning up in this edition’s new games: a red-gold corgi with a big grin, his sister-in-mischief, a friendly hobo clown, a tomato-red electric car that is always charging, and a goat nobody painted. Here is who they are, and where to find them.',
      ),
      castStage(CAST, state),
      h(
        'section',
        { class: 'cast-members', 'aria-labelledby': 'cast-members-h' },
        h('h2', { id: 'cast-members-h' }, 'The regulars'),
        h('div', { class: 'cast-tabs', role: 'tablist', 'aria-label': 'Parts of the cast' }, tabs),
        panel,
      ),
      h(
        'p',
        { class: 'cast-foot' },
        h('a', { href: '#/' }, '← All games'),
        ' · ',
        h('a', { href: '#/credits' }, 'Credits'),
        ' · ',
        h('a', { href: '#/help/bard' }, 'The Bard’s songs'),
      ),
    ),
  );
  // a link to one member: its card in view, marked for a moment
  const who = state.get('who');
  const target = who && el.querySelector<HTMLElement>(`#cast-${CSS.escape(who)}`);
  if (target) {
    const m0 = who;
    if (target.hidden) {
      select(tabOf(m0));
    }
    target.classList.add('cast-picked');
    requestAnimationFrame(() =>
      target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }),
    );
  }
}
