// Static pages for two parts of the app that live only at a #/… address, which search engines
// see as part of the home page: the cast (cast.html, opens #/cast) and the Library
// (library.html, opens #/library). Each has its own title, description, canonical address, h1
// and plain text with links to the games' play pages; the app replaces it when it starts.
// scripts/seoBuild.ts wraps and emits them like the Guide's help-<id>.html pages.
//
// The text comes only from the public catalog (what the build lists), so a secret game is in
// none of it: a cast member's "Seen in" leaves out any game the catalog doesn't list.
import { CAST } from '../src/cast/castData';
import { isStarterGame } from '../src/project/starter';
import { escapeHtml, gamePage, ROUTES } from '../src/seo/site';
import type { CdCatalogEntry } from './cdGames';

export interface StaticPage {
  /** The page's file name beside index.html. */
  file: string;
  /** The app address it opens on, without the #. */
  hash: string;
  title: string;
  description: string;
  h1: string;
  /** The readable text (HTML). */
  html: string;
}

const link = (g: CdCatalogEntry) => `<a href="./${gamePage(g.id)}">${escapeHtml(g.title)}</a>`;

function castHtml(listed: Map<string, CdCatalogEntry>): string {
  return CAST.map((m) => {
    const seen = m.appears.flatMap((a) => {
      const g = listed.get(a.game);
      return g ? [`<li>${link(g)}: ${escapeHtml(a.as)}</li>`] : [];
    });
    return `<h2>${escapeHtml(m.name)}</h2>
      <p><em>${escapeHtml(m.role)}</em></p>
      <p>${escapeHtml(m.bio)}</p>${seen.length ? `\n      <h3>Seen in</h3>\n      <ul>${seen.join('')}</ul>` : ''}`;
  }).join('\n      ');
}

function libraryHtml(games: CdCatalogEntry[]): string {
  const boxed = games.filter((g) => g.original && !isStarterGame(g));
  return `<p>The Library gathers everything to read and print in one place. Browse it by game or by type; each piece opens to read page by page or to print.</p>
      <h2>What is on the shelves</h2>
      <ul>
        <li>A manual for each game, and a hint book where a game has one</li>
        <li>Maps of the levels</li>
        <li>The Sandbox Scoop, the newsletter, and sticker sheets and cards</li>
        <li>The Game-Maker box's own paper, with the Owner's Guide</li>
        <li><a href="./#/magazine">TURBO BUTTON</a>, the shareware gamer's magazine</li>
        <li><a href="./#/help">The Guide</a> to the web editor</li>
      </ul>
      <h2>Games with a shelf</h2>
      <ul>${boxed.map((g) => `<li>${link(g)}</li>`).join('')}</ul>`;
}

/** The static pages, from the public catalog's playable games. */
export function staticPages(catalog: CdCatalogEntry[]): StaticPage[] {
  const games = catalog.filter((g) => g.gam);
  const listed = new Map(games.map((g) => [g.id, g]));
  return [
    { file: 'cast.html', hash: '#/cast', title: ROUTES.cast.title, description: ROUTES.cast.description, h1: 'The cast', html: castHtml(listed) },
    { file: 'library.html', hash: '#/library', title: ROUTES.library.title, description: ROUTES.library.description, h1: 'Library', html: libraryHtml(games) },
  ];
}
