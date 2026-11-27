// The SEO dev middleware should render static pages only for their own root URLs.
import { expect, it, vi } from 'vitest';
import type { IndexHtmlTransformContext } from 'vite';
import { resolve } from 'node:path';
import { seoPages } from './seoBuild';
import { staticPages } from './seoStaticPages';

vi.mock('./cdGames', async (importOriginal) => ({ ...(await importOriginal<typeof import('./cdGames')>()), cdCatalog: () => [] }));
vi.mock('./seoStaticPages', { spy: true });

type Middleware = (req: { method: string; url: string }, res: { setHeader: () => void; end: (html: string) => void }, next: (error?: unknown) => void) => void;

function request(url: string) {
  const plugin = seoPages('');
  const transform = plugin.transformIndexHtml as (html: string, ctx: IndexHtmlTransformContext) => string;
  const use = vi.fn<(handler: Middleware) => void>();
  const server = {
    config: { root: resolve(__dirname, '..') },
    middlewares: { use },
    transformIndexHtml: async (path: string, html: string) => transform(html, { filename: 'index.html', path }),
  };
  (plugin.configureServer as unknown as (s: typeof server) => void)(server);
  const [handle] = use.mock.calls[0];
  return new Promise<string | undefined>((resolve, reject) => {
    handle({ method: 'GET', url }, { setHeader: () => {}, end: resolve }, (error?: unknown) => (error ? reject(error) : resolve(undefined)));
  });
}

it.each(['/assets/app.js', '/assets/style.css?v=1', '/missing/cast.html', '/missing/library.html', '/missing/magazine.html', '/missing/art-courses.html'])(
  'passes %s through without building static pages',
  async (url) => {
    vi.mocked(staticPages).mockClear();
    expect(await request(url)).toBeUndefined();
    expect(staticPages).not.toHaveBeenCalled();
  },
);

it.each(['cast', 'library', 'magazine', 'art-courses'])('serves the root %s page with a query string', async (slug) => {
  expect(await request(`/${slug}.html?v=1`)).toContain(`history.replaceState(null,'',"#/${slug}")`);
});
