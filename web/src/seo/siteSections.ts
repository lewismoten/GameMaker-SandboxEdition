// The home page's crawlable map of the rest of the site, for scripts/seoBuild.ts: schema.org
// nodes for the site itself (WebSite) and its magazine (Periodical and its two issues), and a
// readable list of the pages that live at #/… addresses (the Guide, TURBO BUTTON, the cast,
// the credits…), which search engines see as one page: the list gives each a sentence and a
// descriptive link in index.html's static text.
import { PRODUCT, SHORT } from '../edition';
import { ISSUES, MAG } from '../manual/magazine/masthead';
import { escapeHtml, OG_IMAGE, REPO_URL, ROUTES, SITE_URL } from './site';

const MAGAZINE_URL = `${SITE_URL}#/magazine`;

/** The site as a schema.org WebSite (the app node, appJsonLd, is what it is about). */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: PRODUCT,
    alternateName: [SHORT],
    description: ROUTES.home.description,
    inLanguage: 'en',
    image: OG_IMAGE,
    creator: { '@type': 'Person', name: 'Lewis Moten', url: 'https://github.com/lewismoten' },
    about: { '@id': `${SITE_URL}#app` },
    sameAs: [REPO_URL],
  };
}

/**
 * TURBO BUTTON as a schema.org Periodical with its two issues (No. 1, Spring 1993, and No. 2,
 * January 1995, the one on the desk; their names come from masthead.ts). It is a pretend 1990s
 * magazine written for this site, so the issues carry no print date; the names say which is which.
 */
export function magazineJsonLd(): Record<string, unknown>[] {
  const periodical = {
    '@type': 'Periodical',
    '@id': `${MAGAZINE_URL}#periodical`,
    name: MAG.name,
    alternateName: MAG.tagline,
    url: MAGAZINE_URL,
    description: ROUTES.magazine.description,
    inLanguage: 'en',
    isAccessibleForFree: true,
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#app` },
  };
  const issues = ([1, 2] as const).map((n) => ({
    '@type': 'PublicationIssue',
    '@id': `${MAGAZINE_URL}#issue-${n}`,
    name: `${MAG.name}: ${ISSUES[n].issue.replace(/\s*·\s*/g, ', ')}`,
    issueNumber: String(n),
    url: MAGAZINE_URL,
    isAccessibleForFree: true,
    isPartOf: { '@id': periodical['@id'] },
  }));
  return [periodical, ...issues];
}

/** The pages at #/… (and dos.html) that the static text links to, in reading order. */
const PAGES: [href: string, name: string, route: keyof typeof ROUTES][] = [
  ['./#/help', 'The Guide: how to use the web editor', 'guide'],
  ['./#/magazine', `${MAG.name}, the shareware gamer’s magazine`, 'magazine'],
  ['./#/library', 'The Library: everything to read and print', 'library'],
  ['./#/cast', 'The cast of the new games', 'cast'],
  ['./#/credits', 'Credits: who and what made it', 'credits'],
  ['./#/achievements', 'Your achievements', 'achievements'],
  ['./#/desk', 'The 1994 desk', 'desk'],
  ['./dos.html', 'DOS Game-Maker on its own page', 'dos'],
  ['./#/mac', 'Playing the games on a Mac', 'mac'],
  ['./#/windows', 'Playing the games on Windows', 'windows'],
  ['./#/linux', 'Playing the games on Linux', 'linux'],
];

/** A section of index.html's readable text: each page with a link named for it and its description. */
export function siteLinksHtml(): string {
  return `<section>
        <h2>More to read and explore</h2>
        <ul>
${PAGES.map(([href, name, route]) => `          <li><a href="${escapeHtml(href)}">${escapeHtml(name)}</a> — ${escapeHtml(ROUTES[route].description)}</li>`).join('\n')}
        </ul>
      </section>`;
}
