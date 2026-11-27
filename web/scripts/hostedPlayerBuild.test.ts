// The two hosted player copies have complete metadata; only the download is indexable.
import { describe, expect, it, vi } from 'vitest';
import { hostedPlayer } from './hostedPlayerBuild';
import { SITE_URL } from '../src/seo/site';

vi.mock('./singlePageBuild', () => ({ bundleOnePage: () => Promise.resolve({ script: '', style: '' }) }));

describe('hosted player metadata', () => {
  it('emits distinct titles and descriptions, matching social tags and a canonical identity only for the site copy', async () => {
    const plugin = hostedPlayer();
    (plugin.configResolved as (config: { command: string }) => void)({ command: 'build' });
    const files: Record<string, string> = {};
    const hook = plugin.generateBundle as { handler: (this: unknown, options: unknown, bundle: unknown) => Promise<void> };
    await hook.handler.call({ emitFile: (f: { fileName: string; source: string }) => (files[f.fileName] = f.source) }, {}, {});
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const name of ['web-player.html', 'player/index.html']) {
      const html = files[name];
      const title = /<title>([^<]+)<\/title>/.exec(html)![1];
      const description = /name="description" content="([^"]+)"/.exec(html)![1];
      expect(titles.has(title)).toBe(false);
      expect(descriptions.has(description)).toBe(false);
      titles.add(title);
      descriptions.add(description);
      expect(description.length).toBeGreaterThanOrEqual(50);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(html).toContain('<html lang="en">');
      expect(html.match(/<h1>/g)).toHaveLength(1);
      if (name === 'web-player.html') {
        expect(html).not.toContain('rel="canonical"');
        expect(html).not.toContain('property="og:url"');
      } else {
        expect(html).toContain(`rel="canonical" href="${SITE_URL}${name}"`);
        expect(html).toContain(`property="og:url" content="${SITE_URL}${name}"`);
      }
      for (const prefix of ['og', 'twitter']) {
        expect(html).toContain(`${prefix}:title" content="${title}"`);
        expect(html).toContain(`${prefix}:description" content="${description}"`);
        expect(html).toContain(`${prefix}:image" content="${SITE_URL}og-image.png"`);
        expect(html).toContain(`${prefix}:image:alt"`);
      }
    }
    expect(files['web-player.html']).not.toContain('noindex');
    expect(files['player/index.html']).toContain('name="robots" content="noindex"');
  });
});

it('serves the try page through both development aliases and keeps the download indexable', async () => {
  type Handler = (req: { url: string }, res: { setHeader: () => void; end: (html: string) => void }, next: () => void) => void;
  const use = vi.fn<(handler: Handler) => void>();
  const server = { watcher: { on: vi.fn() }, middlewares: { use } };
  (hostedPlayer().configureServer as unknown as (s: typeof server) => void)(server);
  const handle = use.mock.calls[0][0];
  const get = (url: string) => new Promise<string>((end, reject) => handle({ url }, { setHeader: vi.fn(), end }, () => reject(new Error(url))));
  const download = await get('/web-player.html');
  expect(download).toContain(`rel="canonical" href="${SITE_URL}web-player.html"`);
  expect(download).not.toContain('noindex');
  for (const url of ['/player/', '/player/index.html']) {
    const html = await get(url);
    expect(html).toContain(`rel="canonical" href="${SITE_URL}player/index.html"`);
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('<title>Try the web player');
  }
});
