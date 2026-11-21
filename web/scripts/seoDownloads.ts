// Crawlable download page and game version lookup.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CdCatalogEntry } from './cdGames';
import { DOWNLOADS_STYLE, cardPictures, downloadCard } from './downloadsList';
import { playable } from './seoCatalog';
import { STYLE } from './seoTemplates';
import { escapeHtml, gamePage, metaTags, OG_IMAGE, OG_IMAGE_ALT, REPO_URL, ROUTES, SITE_URL } from '../src/seo/site';
import { FORK_NOTE, PRODUCT } from '../src/edition';
import { isStarterGame } from '../src/project/starter';
import { hasBizarreTab, isBizarreGame } from '../src/project/bizarre';

/** The version in a game's about.json (../games/<id>/about.json), if it has one. */
function versionOf(cdRoot: string, id: string): string | undefined {
  const file = join(cdRoot, '../games', id, 'about.json');
  if (!existsSync(file)) return undefined;
  const v = (JSON.parse(readFileSync(file, 'utf8')) as { version?: unknown }).version;
  return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
}

/**
 * downloads.html: a plain, crawlable page linking the ZIP of every listed Sandbox Software and
 * Bizarre game (the same permanent files the player fetches, games/originals/<id>/<game>.zip),
 * for the Internet Archive and search engines. Only the public catalog is included.
 */
export function downloadsPageHtml(catalog: CdCatalogEntry[], cdRoot: string): string {
  const games = playable(catalog).filter((g) => g.original && g.pack && !isStarterGame(g)); // the Starters are examples, not downloads
  const bizarre = hasBizarreTab(games) ? games.filter(isBizarreGame) : [];
  const sections: [string, string, CdCatalogEntry[]][] = [
    ['Sandbox Software games', 'Made for this project with Game-Maker.', games.filter((g) => !bizarre.includes(g))],
    ['Bizarre games', 'Songs by The Bard of Bizarre, turned into games.', bizarre],
  ];
  const pics = cardPictures(games, cdRoot);
  const item = (g: CdCatalogEntry, i: number, list: CdCatalogEntry[]) =>
    downloadCard(g, versionOf(cdRoot, g.id), `./${gamePage(g.id)}`, list === sections[0][2] && i < 2, pics.get(g.id));
  const body = sections
    .filter(([, , list]) => list.length)
    .map(
      ([head, about, list]) => `<section>
        <h2>${escapeHtml(head)}</h2>
        <p>${escapeHtml(about)}</p>
        <ul class="dl-list">
${list.map(item).join('\n')}
        </ul>
      </section>`,
    )
    .join('\n      ');
  const meta = metaTags({ ...ROUTES.downloads, url: `${SITE_URL}downloads.html`, image: OG_IMAGE, imageAlt: OG_IMAGE_ALT });
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(ROUTES.downloads.title)}</title>
    ${meta}
    ${STYLE}
    ${DOWNLOADS_STYLE}
  </head>
  <body>
    <main class="seo-static">
      <h1>Download the games</h1>
      <p>${escapeHtml(ROUTES.downloads.description)} Each ZIP is free to keep and share.</p>
      <p>Unzip first. On a DOS PC, read INSTALL.TXT and run INSTALL from the source
      drive and folder to copy the game to the hard disk (INSTALL D: chooses D:
      instead of C:). Check each COPY message, then run CONFIG once and the game’s
      .EXE from its installed folder. INSTALL.TXT includes manual and floppy copying
      instructions. A ZIP is not a floppy image. In DOSBox, the game can also run
      directly from the unzipped folder.</p>
      ${body}
      <p class="seo-note"><a href="./">${escapeHtml(PRODUCT)}</a> · <a href="./play.html">play in your browser</a> · <a href="${REPO_URL}">source code</a> · ${escapeHtml(FORK_NOTE)}.</p>
    </main>
  </body>
</html>
`;
}
