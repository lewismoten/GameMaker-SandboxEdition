import { describe, expect, it } from 'vitest';
import { gameDescription, gameJsonLd, jsonLdScript, metaTags, OG_IMAGE, playUrl, SITE_URL } from '../src/seo/site';

describe('seo', () => {
  it('describes a game with its author and year', () => {
    const d = gameDescription({ title: 'Nebula', author: 'Andy Stone', year: 1991, kind: 'gameware', blurb: 'Fly through space.' });
    expect(d).toBe('Nebula by Andy Stone (1991): a sample game that came with Game-Maker 3.0, playable in your browser. Fly through space.');
  });

  it('clips long descriptions on a word', () => {
    const d = gameDescription({ title: 'X', blurb: 'word '.repeat(200) });
    expect(d.length).toBeLessThanOrEqual(200);
    expect(d.endsWith('word…')).toBe(true);
  });

  it('escapes meta tag values and adds a large card with an image', () => {
    const tags = metaTags({ title: 'A "quoted" <game>', description: 'Tom & Jerry', url: playUrl('a b'), image: OG_IMAGE, imageAlt: 'desk' });
    expect(tags).toContain('content="A &#34;quoted&#34; &#60;game&#62;"');
    expect(tags).toContain('content="Tom &#38; Jerry"');
    expect(tags).toContain(`<link rel="canonical" href="${SITE_URL}play.html?game=a%20b" />`);
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(tags).toContain('<meta property="og:image:width" content="1200" />');
  });

  it('uses a small card and no canonical without an image or address', () => {
    const tags = metaTags({ title: 't', description: 'd' });
    expect(tags).not.toContain('canonical');
    expect(tags).toContain('content="summary"');
  });

  it('makes VideoGame JSON-LD that names its authors and what made it', () => {
    const g = gameJsonLd({ title: 'Zark', author: 'Eric-Jon Waugh', company: 'A-J Games', year: 1993 }, playUrl('zark'));
    expect(g['@type']).toBe('VideoGame');
    expect(g.author).toEqual([
      { '@type': 'Person', name: 'Eric-Jon Waugh' },
      { '@type': 'Organization', name: 'A-J Games' },
    ]);
    expect(g.datePublished).toBe('1993');
    expect((g.mentions as { url: string }).url).toBe(SITE_URL);
    expect('image' in g).toBe(false);
  });

  it('keeps JSON-LD safe inside a script element', () => {
    const s = jsonLdScript([gameJsonLd({ title: '</script><b>' })]);
    expect(s.indexOf('</script>')).toBe(s.length - '</script>'.length);
  });
});
