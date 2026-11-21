// Vite hooks that transform crawlable pages and emit SEO assets.
import type { IndexHtmlTransformContext, Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cdCatalog, cdFiles, type CdCatalogEntry } from './cdGames';
import { gameCardPng } from './ogImage';
import { readScoopDates, scoopRss } from './scoopFeed';
import { GUIDE_SECTIONS } from '../src/manual/guideSections';
import { staticPages, type StaticPage } from './seoStaticPages';
import { gameImagePath, gamePage } from '../src/seo/site';
import { playable } from './seoCatalog';
import { downloadsPageHtml } from './seoDownloads';
import { llmsTxt, robotsTxt, sitemapXml } from './seoCrawlers';
import {
  dosBody,
  dosHead,
  gamePageHtml,
  guideFile,
  guidePageHtml,
  indexBody,
  indexHead,
  playBody,
  playHead,
  staticPageHtml,
  type GuideSection,
} from './seoTemplates';

export { playable } from './seoCatalog';
export { downloadsPageHtml } from './seoDownloads';
export { llmsTxt, robotsTxt } from './seoCrawlers';
export { gamePageHtml, guidePageHtml, staticPageHtml } from './seoTemplates';

const HEAD_MARK = '<!--SEO:HEAD-->';
const BODY_MARK = '<!--SEO:BODY-->';

/** The static page whose file this is, if any. */
function pageStatic(catalog: CdCatalogEntry[], path: string): StaticPage | undefined {
  const file = path.split('?')[0].replace(/^.*\//, '');
  return staticPages(catalog).find((p) => p.file === file);
}

/** The Guide section whose page this is (help-<id>.html), if any. */
function pageSection(path: string): GuideSection | undefined {
  const m = /(?:^|\/)help-([^/]+)\.html$/.exec(path.split('?')[0]);
  const id = m && decodeURIComponent(m[1]);
  return id ? GUIDE_SECTIONS.find(([s]) => s === id) : undefined;
}

/** The game whose page this is (play-<id>.html), if any. */
function pageGame(catalog: CdCatalogEntry[], path: string): CdCatalogEntry | undefined {
  const m = /(?:^|\/)play-([^/]+)\.html$/.exec(path.split('?')[0]);
  const id = m && decodeURIComponent(m[1]);
  return id ? playable(catalog).find((g) => g.id === id) : undefined;
}

/** A game's preview picture, from its files on disk. */
function gameImage(cdRoot: string, g: CdCatalogEntry, files = cdFiles(cdRoot)): Uint8Array {
  return gameCardPng(g, (name) => {
    const p = files.get(`${g.path}${name}`.toLowerCase());
    return p ? readFileSync(p) : undefined;
  });
}

/** The files that are generated rather than kept in public/, by their path on the site. */
function generated(cdRoot: string): Record<string, { type: string; body: () => string }> {
  return {
    'robots.txt': { type: 'text/plain; charset=utf-8', body: robotsTxt },
    'sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => sitemapXml(cdCatalog(cdRoot), new Date().toISOString().slice(0, 10)) },
    'downloads.html': { type: 'text/html; charset=utf-8', body: () => downloadsPageHtml(cdCatalog(cdRoot), cdRoot) },
    'llms.txt': { type: 'text/plain; charset=utf-8', body: () => llmsTxt(cdCatalog(cdRoot)) },
    'scoop.xml': { type: 'application/rss+xml; charset=utf-8', body: () => scoopRss(cdCatalog(cdRoot), readScoopDates()) },
  };
}

export function seoPages(cdRoot: string): Plugin {
  return {
    name: 'gamemaker-seo',
    // The dev server would answer these with index.html (its single-page fallback).
    configureServer(server) {
      const files = generated(cdRoot);
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const path = (req.url ?? '').split('?')[0].replace(/^\/+/, '');
        const file = files[path];
        if (file) {
          res.setHeader('Content-Type', file.type);
          res.end(file.body());
          return;
        }
        // A game's page: play.html as the dev server serves it, then made the game's own.
        const image = /^og\/([^/]+)\.png$/.exec(path);
        const catalog = image || /^(play-[^/]+|cast|library)\.html$/.test(path) ? cdCatalog(cdRoot) : [];
        const imageGame = image && playable(catalog).find((g) => g.id === decodeURIComponent(image[1]));
        if (imageGame) {
          res.setHeader('Content-Type', 'image/png');
          res.end(gameImage(cdRoot, imageGame));
          return;
        }
        const g = pageGame(catalog, path);
        // a Guide section's page: index.html as the dev server serves it, then made the section's own
        const section = !g && pageSection(path);
        const fixed = !g && !section && pageStatic(catalog, path);
        if (!g && !section && !fixed) return next();
        server
          .transformIndexHtml(`/${path}`, readFileSync(join(server.config.root, section || fixed ? 'index.html' : 'play.html'), 'utf8'), req.originalUrl)
          .then((html) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          })
          .catch(next);
      });
    },
    transformIndexHtml(html, ctx: IndexHtmlTransformContext) {
      if (!html.includes(HEAD_MARK)) return html;
      if (/dos\.html$/.test(ctx.filename) || ctx.path.endsWith('dos.html')) return html.replace(HEAD_MARK, dosHead()).replace(BODY_MARK, dosBody());
      const catalog = cdCatalog(cdRoot);
      const g = pageGame(catalog, ctx.path);
      const play = !!g || /play\.html$/.test(ctx.filename) || ctx.path.endsWith('play.html');
      const out = html.replace(HEAD_MARK, play ? playHead(catalog) : indexHead(catalog)).replace(BODY_MARK, play ? playBody(catalog) : indexBody(catalog));
      if (g) return gamePageHtml(out, g);
      const section = !play && pageSection(ctx.path);
      if (section) return guidePageHtml(out, section, catalog);
      const fixed = !play && pageStatic(catalog, ctx.path);
      return fixed ? staticPageHtml(out, fixed) : out;
    },
    generateBundle: {
      // After Vite has written play.html (with its script and stylesheet links), so each
      // game's page loads the same player.
      order: 'post',
      handler(_options, bundle) {
        for (const [fileName, file] of Object.entries(generated(cdRoot))) this.emitFile({ type: 'asset', fileName, source: file.body() });
        const index = bundle['index.html'];
        if (index?.type === 'asset')
          for (const section of GUIDE_SECTIONS)
            this.emitFile({ type: 'asset', fileName: guideFile(section[0]), source: guidePageHtml(String(index.source), section, cdCatalog(cdRoot)) });
        if (index?.type === 'asset')
          for (const page of staticPages(cdCatalog(cdRoot)))
            this.emitFile({ type: 'asset', fileName: page.file, source: staticPageHtml(String(index.source), page) });
        const play = bundle['play.html'];
        if (play?.type !== 'asset') return;
        const files = cdFiles(cdRoot);
        for (const g of playable(cdCatalog(cdRoot))) {
          this.emitFile({ type: 'asset', fileName: gamePage(g.id), source: gamePageHtml(String(play.source), g) });
          this.emitFile({ type: 'asset', fileName: gameImagePath(g.id), source: gameImage(cdRoot, g, files) });
        }
      },
    },
  };
}
