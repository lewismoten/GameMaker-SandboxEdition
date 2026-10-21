// Tests: /llms.txt (llmstxt.org format) and robots.txt from scripts/seoBuild.ts.
import { describe, expect, it } from 'vitest';
import { llmsTxt, robotsTxt } from '../scripts/seoBuild';
import type { CdCatalogEntry } from '../scripts/cdGames';
import { SITE_URL } from '../src/seo/site';

const game = (id: string, extra: Partial<CdCatalogEntry>): CdCatalogEntry => ({
  id,
  title: id,
  kind: 'gameware',
  path: `games/gameware/${id}/`,
  gam: `${id}.gam`,
  files: [],
  sizes: [],
  bytes: 0,
  ...extra,
});

describe('llms.txt', () => {
  const text = llmsTxt([
    game('nebula', { title: 'Nebula [demo]', author: 'Andy Stone', year: 1991, blurb: 'Fly through space and save the planets.' }),
    game('zark', { title: 'Zark', blurb: '|~~~|~~~| 7 | 8 | 9 |___|___|' }),
    game('art', { gam: null }),
  ]);

  it('has a title, a summary quote and sections of links', () => {
    const lines = text.split('\n');
    expect(lines[0]).toBe('# Game-Maker: Sandbox Edition');
    expect(lines[2].startsWith('> ')).toBe(true);
    expect(text).toContain('\n## The app\n');
    expect(text).toContain(`- [Guide](${SITE_URL}#/help): `);
    expect(text).toContain('\n## License\n');
    expect(text).toMatch(/\[NOTICE\]\(https:\/\/github\.com\/.+NOTICE\.md\)/);
  });

  it('lists playable games with their play pages, escaping link text', () => {
    expect(text).toContain(`- [Nebula \\[demo\\]](${SITE_URL}play-nebula.html): Andy Stone, 1991 — Fly through space and save the planets.`);
    expect(text).toContain(`- [Zark](${SITE_URL}play-zark.html): `.slice(0, -2)); // no keypad chart
    expect(text).not.toContain('|~~~|');
    expect(text).not.toContain('game=art');
  });

  it('robots.txt names the sitemap', () => {
    expect(robotsTxt()).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
  });
});
