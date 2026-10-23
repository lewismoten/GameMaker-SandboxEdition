// Credits, "Game authors": who made each game, from the site's own catalog (games/catalog.json,
// written by scripts/cdGames.ts from the CD games' credit screens and the new games'
// about.json). It reads the catalog as published, never the revealed extras, so a game kept
// secret is never listed here.
import { h } from '../editor/core/ui';
import { isSandboxGame, type CatalogEntry } from '../project/files';
import { isBizarreGame } from '../project/bizarre';
import { isOldSecret } from '../project/secretGames';
import { section } from './section';

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

async function fill(box: HTMLElement): Promise<void> {
  const games = ((await fetchList('catalog.json')) ?? (await fetchList('index.json')) ?? []).filter((g) => !isOldSecret(g.id) && (g.author || g.company));
  if (!games.length) {
    box.replaceChildren(h('p', null, 'The list of games could not be loaded. Each game’s author is on its page and in its own credits.'));
    return;
  }
  const byTitle = (a: Listed, b: Listed) => a.title.localeCompare(b.title);
  const samples = games.filter((g) => !g.original && g.kind === 'gameware').sort(byTitle);
  const shareware = games.filter((g) => !g.original && g.kind === 'shareware').sort(byTitle);
  const sandbox = games.filter(isSandboxGame).sort(byTitle);
  const bard = games.filter((g) => !isSandboxGame(g) && isBizarreGame(g)).sort(byTitle);
  box.replaceChildren(
    h('h3', { id: 'credits-samples' }, 'Sample games on the Game-Maker CD'),
    h('p', null, 'The games that came with Game-Maker to play and learn from. They remain the work and copyright of their authors.'),
    list(samples),
    h('h3', { id: 'credits-shareware' }, 'Shareware on the CD'),
    h('p', null, 'Shown play-only, with their authors’ original notices.'),
    list(shareware),
    h('h3', { id: 'credits-sandbox' }, 'Sandbox Software'),
    h(
      'p',
      null,
      'This edition’s own games, made by Claude (Claude Opus 5.5, Anthropic) for Lewis Moten: the code, art, music, sounds and text. Lewis directed each one and played it as it came together. “Sandbox Software” is fictional.',
    ),
    list(sandbox),
    h('h3', { id: 'credits-bard' }, 'The Bard of Bizarre'),
    h(
      'p',
      null,
      'Games made from Lewis’s songs and monologues, built by Claude Opus 5.5. ',
      h(
        'a',
        { href: '#/credits', onclick: (e: Event) => (e.preventDefault(), document.getElementById('credits-bard-table')?.scrollIntoView()) },
        'Who made what',
      ),
      ' is in the table below.',
    ),
    list(bard),
  );
}

export function authorsSection(): HTMLElement {
  const box = h('div', { 'aria-live': 'polite' }, h('p', null, 'Loading the games…'));
  void fill(box);
  return section('credits-authors', 'Game authors', box);
}
