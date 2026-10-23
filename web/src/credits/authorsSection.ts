// Credits, "Game authors": who made each game, from the site's own catalog (games/catalog.json,
// written by scripts/cdGames.ts from the CD games' credit screens and the new games'
// about.json). It reads the catalog as published, never the revealed extras, so a game kept
// secret is never listed here.
import { h } from '../editor/core/ui';
import { isSandboxGame, type CatalogEntry } from '../project/files';
import { isBizarreGame } from '../project/bizarre';
import { isOldSecret } from '../project/secretGames';
import { section, banner, thumb } from './section';

type Listed = Pick<CatalogEntry, 'id' | 'title' | 'kind' | 'author' | 'company' | 'year' | 'original' | 'series'>;

async function fetchList(name: string): Promise<Listed[] | undefined> {
  const res = await fetch(`./games/${name}`);
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
  const list = (await res.json()) as unknown;
  return Array.isArray(list) ? (list as Listed[]) : undefined;
}

const byline = (g: Listed) => [g.author, g.company && g.company !== g.author ? g.company : undefined, g.year].filter(Boolean).join(', ');

const list = (games: Listed[]) =>
  h('ul', { class: 'credits-games' }, ...games.map((g) => h('li', null, h('a', { href: `#/game/cd:${g.id}` }, g.title), byline(g) ? ` — ${byline(g)}` : '')));

interface Group {
  id: string;
  title: string;
  intro: Parameters<typeof h>[2];
  /** Two of its games' title screens (public/credits/<id>.webp, 160×100). */
  shots: [id: string, title: string][];
  pick: (g: Listed) => boolean;
  banner?: HTMLElement;
}

const jump = (id: string, text: string) =>
  h('a', { href: '#/credits', onclick: (e: Event) => (e.preventDefault(), document.getElementById(id)?.scrollIntoView()) }, text);

const GROUPS: Group[] = [
  {
    id: 'credits-samples',
    title: 'Sample games on the Game-Maker CD',
    intro: 'The games that came with Game-Maker to play and learn from. They remain the work and copyright of their authors.',
    shots: [
      ['pipemare', 'Pipemare'],
      ['zark', 'Zark'],
    ],
    pick: (g) => !g.original && g.kind === 'gameware',
  },
  {
    id: 'credits-shareware',
    title: 'Shareware on the CD',
    intro: 'Shown play-only, with their authors’ original notices.',
    shots: [
      ['ajquest', 'A-J’s Quest'],
      ['paperair', 'Paper Airplane'],
    ],
    pick: (g) => !g.original && g.kind === 'shareware',
  },
  {
    id: 'credits-sandbox',
    title: 'Sandbox Software',
    intro:
      'This edition’s own games, made by Claude (Claude Opus 5.5, Anthropic) for Lewis Moten: the code, art, music, sounds and text. Lewis directed each one and played it as it came together. “Sandbox Software” is fictional.',
    shots: [
      ['teddy', 'Teddy’s Little Big Adventure'],
      ['snowbound', 'Snowbound: The $89 Shovel'],
    ],
    pick: isSandboxGame,
    banner: banner(
      'sandbox.webp',
      'The Sandbox Software logo in rainbow letters over a sandbox with a sandcastle and a red pail',
      'Sandbox Software’s intro, before each of its games',
    ),
  },
  {
    id: 'credits-bard',
    title: 'The Bard of Bizarre',
    intro: [
      'Games made from Lewis’s songs and monologues, built by Claude Opus 5.5. ',
      jump('credits-bard-table', 'Who made what'),
      ' is in its own table below.',
    ],
    shots: [
      ['goat', 'Third Goat from the Left'],
      ['tickle', 'Certified Rat Tickler'],
    ],
    pick: (g) => !isSandboxGame(g) && isBizarreGame(g),
  },
];

/** The lists, once the catalog is in. */
async function fill(lists: Map<Group, HTMLElement>, status: HTMLElement): Promise<void> {
  const games = ((await fetchList('catalog.json')) ?? (await fetchList('index.json')) ?? []).filter((g) => !isOldSecret(g.id) && (g.author || g.company));
  if (!games.length) {
    status.textContent = 'The list of games could not be loaded. Each game’s author is on its page and in its own credits.';
    return;
  }
  const byTitle = (a: Listed, b: Listed) => a.title.localeCompare(b.title);
  for (const [g, box] of lists) box.replaceChildren(list(games.filter(g.pick).sort(byTitle)));
  status.textContent = `${games.length} games.`;
}

export function authorsSection(): HTMLElement {
  const lists = new Map<Group, HTMLElement>();
  const status = h('p', { class: 'sr-only', role: 'status' }, 'Loading the games…');
  const groups = GROUPS.map((g) => {
    const box = h('div', { class: 'credits-games-box' });
    lists.set(g, box);
    return h(
      'div',
      { class: 'credits-group' },
      h('h3', { id: g.id }, g.title),
      h('p', null, g.intro),
      h(
        'div',
        { class: 'credits-gallery credits-gallery-small' },
        g.banner,
        ...g.shots.map(([id, title]) => thumb(`./credits/${id}.webp`, `Title screen of ${title}`, title, `#/game/cd:${id}`)),
      ),
      box,
    );
  });
  void fill(lists, status);
  return section(
    'credits-authors',
    'Game authors',
    'Who made the games you can play here: on the original CD, and new ones made for this edition.',
    status,
    h('div', { class: 'credits-groups' }, ...groups),
  );
}
