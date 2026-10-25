// The Sandbox Scoop's RSS feed (scripts/scoopFeed.ts): every story has its first-commit date
// recorded (run scripts/scoopDates.ts after adding one), each is in the feed newest first, and
// no secret game's story, name or page is in it.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog, cdSecretCatalog } from '../../scripts/cdGames';
import { readScoopDates, scoopKey, scoopRss, scoopStories } from '../../scripts/scoopFeed';
import { gamePage } from './site';

const cdRoot = join(__dirname, '../../../cd');
const catalog = cdCatalog(cdRoot);
const dates = readScoopDates();
const feed = scoopRss(catalog, dates);
const stories = scoopStories(catalog);

describe('The Sandbox Scoop feed', () => {
  it('has a date for every story (npx vite-node scripts/scoopDates.ts records new ones)', () => {
    expect(stories.length).toBeGreaterThan(0);
    const missing = stories.map((s) => scoopKey(s.id, s.head)).filter((k) => !/^\d{4}-\d\d-\d\d$/.test(dates[k] ?? ''));
    expect(missing).toEqual([]);
  });

  it('lists every story once, newest first, linking to its game', () => {
    const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);
    expect(items).toHaveLength(stories.length);
    const days = items.map((i) => Date.parse(/<pubDate>(.*)<\/pubDate>/.exec(i)![1]));
    expect(days).toEqual([...days].sort((a, b) => b - a));
    for (const s of stories) expect(feed).toContain(gamePage(s.id));
    const guids = items.map((i) => /<guid[^>]*>(.*)<\/guid>/.exec(i)![1]);
    expect(new Set(guids).size).toBe(guids.length);
  });

  it('keeps its text out of the XML markup', () => {
    // outside the CDATA descriptions, no bare & or <
    const bare = feed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<[^>]+>/g, '');
    expect(bare).not.toMatch(/&(?!amp;|#\d+;)|</);
  });

  it('leaves out the secret games', () => {
    expect(cdSecretCatalog(cdRoot).length).toBeGreaterThan(0);
    for (const g of cdSecretCatalog(cdRoot)) {
      expect(feed).not.toContain(gamePage(g.id));
      expect(feed).not.toContain(g.title);
      expect(Object.keys(dates).some((k) => k.startsWith(`${g.id}/`))).toBe(false);
    }
  });
});
