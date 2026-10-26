// The Sandbox Scoop as an RSS 2.0 feed (scoop.xml, written by seoBuild.ts): every story the
// games' printables.json "news" adds to the box newsletter, newest first, each linking to its
// game's play page. The catalog already leaves out secret games. A story's date is the day it
// was first committed, kept in scoopDates.json (written by scoopDates.ts) because the site's
// build checks out only the latest commit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CdCatalogEntry } from './cdGames';
import { escapeHtml, playUrl, SITE_URL } from '../src/seo/site';

/** The newsletter's name, on the feed and on the home page's link to it. */
export const SCOOP_TITLE = 'The Sandbox Scoop';

/** scoopDates.json: each story's first commit, as YYYY-MM-DD, by scoopKey. */
export type ScoopDates = Record<string, string>;

/** A story's key in scoopDates.json: its game and headline. */
export const scoopKey = (id: string, head: string): string => `${id}/${head}`;

interface ScoopStory {
  id: string;
  game: string;
  head: string;
  html: string;
}

/** Every story, in catalog order. */
export function scoopStories(catalog: CdCatalogEntry[]): ScoopStory[] {
  return catalog.flatMap((g) => (g.original?.printables?.news ?? []).map((n) => ({ id: g.id, game: g.title, head: n.head, html: n.html })));
}

export function readScoopDates(): ScoopDates {
  return JSON.parse(readFileSync(join(__dirname, 'scoopDates.json'), 'utf8')) as ScoopDates;
}

const xml = (s: string) => escapeHtml(s).replace(/&#38;/g, '&amp;');
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const rfc822 = (day: string) => new Date(`${day}T12:00:00Z`).toUTCString();

/** The feed. A story missing from `dates` is left out (scoopFeed.test.ts catches it). */
export function scoopRss(catalog: CdCatalogEntry[], dates: ScoopDates): string {
  const items = scoopStories(catalog)
    .map((s) => ({ ...s, day: dates[scoopKey(s.id, s.head)] }))
    .filter((s): s is ScoopStory & { day: string } => !!s.day)
    .sort((a, b) => b.day.localeCompare(a.day) || a.game.localeCompare(b.game) || a.head.localeCompare(b.head));
  const newest = items[0]?.day;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SCOOP_TITLE}</title>
    <link>${xml(SITE_URL)}</link>
    <atom:link href="${xml(`${SITE_URL}scoop.xml`)}" rel="self" type="application/rss+xml" />
    <description>News from Sandbox Software: the stories in the newsletter that comes in every game's box.</description>
    <language>en-us</language>
${newest ? `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>\n` : ''}${items
    .map(
      (s) => `    <item>
      <title>${xml(s.head)}</title>
      <link>${xml(playUrl(s.id))}</link>
      <guid isPermaLink="false">${xml(`${SITE_URL}#scoop/${s.id}/${slug(s.head)}`)}</guid>
      <category>${xml(s.game)}</category>
      <pubDate>${rfc822(s.day)}</pubDate>
      <description><![CDATA[${s.html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></description>
    </item>
`,
    )
    .join('')}  </channel>
</rss>
`;
}
