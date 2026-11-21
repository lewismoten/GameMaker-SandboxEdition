// Public game selection, grouping and readable listings for SEO output.
import type { CdCatalogEntry } from './cdGames';
import { clip, escapeHtml, gamePage } from '../src/seo/site';
import { hasBizarreTab, isBizarreGame } from '../src/project/bizarre';

// a Special (series "special") is out only in its window, so it has no page of its own, no sitemap line and no download card
export const playable = (catalog: CdCatalogEntry[]) => catalog.filter((g) => g.gam && g.series !== 'special');
export const credit = (g: CdCatalogEntry) => [g.author ?? g.company, g.year].filter(Boolean).join(', ');
export const pageHref = (g: CdCatalogEntry) => `./${gamePage(g.id)}`;

export function groups(catalog: CdCatalogEntry[]): [string, string, CdCatalogEntry[]][] {
  const games = playable(catalog);
  // The Bard of Bizarre's games: a group of their own once there are enough (src/project/bizarre.ts)
  const bizarre = hasBizarreTab(games) ? games.filter(isBizarreGame) : [];
  return [
    ['New games', 'Made for this project with Game-Maker, released as shareware.', games.filter((g) => g.original && !bizarre.includes(g))],
    ['Bizarre', 'Songs by The Bard of Bizarre (Lewis Moten as his hobo clown Doc Leo), turned into games.', bizarre],
    [
      'Sample games',
      'The free games that came with Game-Maker 3.0 — open them in the editor to see how they work.',
      games.filter((g) => g.kind === 'gameware'),
    ],
    [
      'Shareware',
      'Games people made with Game-Maker in the 90s, played with their authors’ notices.',
      games.filter((g) => g.kind === 'shareware' && !g.original),
    ],
  ];
}

export function gameList(catalog: CdCatalogEntry[], href: (g: CdCatalogEntry) => string): string {
  return groups(catalog)
    .filter(([, , games]) => games.length)
    .map(
      ([head, about, games]) => `<section>
        <h2>${escapeHtml(head)}</h2>
        <p>${escapeHtml(about)}</p>
        <ul>
${games
  .map(
    (g) =>
      `          <li id="game-${escapeHtml(g.id)}"><a href="${escapeHtml(href(g))}">${escapeHtml(g.title)}</a>${credit(g) ? ` <small>(${escapeHtml(credit(g))})</small>` : ''}${g.blurb ? ` — ${escapeHtml(clip(g.blurb, 160))}` : ''}</li>`,
  )
  .join('\n')}
        </ul>
      </section>`,
    )
    .join('\n      ');
}

/** Prose, not a text-mode drawing (Zark's blurb is its keypad chart). */
export const readable = (s?: string) => !!s && (s.match(/[a-z ]/gi)?.length ?? 0) / s.length > 0.85;
