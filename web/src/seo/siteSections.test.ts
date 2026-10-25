// The home page's map of the site (siteSections.ts): its structured data hangs together and
// its links each have a name of their own.
import { describe, expect, it } from 'vitest';
import { magazineJsonLd, siteLinksHtml, websiteJsonLd } from './siteSections';
import { PAGE_ROUTES } from './pageRoutes';
import { SITE_URL } from './site';

describe('siteSections', () => {
  it('describes the site as a WebSite about the app', () => {
    const site = websiteJsonLd();
    expect(site['@type']).toBe('WebSite');
    expect(site.url).toBe(SITE_URL);
    expect(site.about).toEqual({ '@id': `${SITE_URL}#app` });
  });

  it('makes the magazine a Periodical with its one issue part of it', () => {
    const [periodical, issue] = magazineJsonLd();
    expect(periodical['@type']).toBe('Periodical');
    expect(periodical.name).toBe('TURBO BUTTON');
    expect(periodical.isPartOf).toEqual({ '@id': websiteJsonLd()['@id'] });
    expect(issue['@type']).toBe('PublicationIssue');
    expect(issue.issueNumber).toBe('1');
    expect(issue.isPartOf).toEqual({ '@id': periodical['@id'] });
    expect(JSON.stringify(magazineJsonLd())).not.toMatch(/undefined/);
  });

  it('links each page once, by a descriptive name, with its description', () => {
    const html = siteLinksHtml();
    const links = [...html.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
    expect(links.length).toBeGreaterThanOrEqual(9);
    expect(new Set(links.map(([href]) => href)).size).toBe(links.length);
    for (const [, name] of links) expect(name).not.toMatch(/^(click )?here$|^more$|^link$/i);
    expect(html).toContain('href="./#/magazine"');
    expect(html).toContain(PAGE_ROUTES.cast.description.slice(0, 40));
    expect(html.match(/<h2>/g)).toHaveLength(1);
  });
});
