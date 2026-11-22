// Sitemap, robots and llms text for crawlers.
import type { CdCatalogEntry } from './cdGames';
import { GUIDE_SECTIONS } from '../src/manual/guideSections';
import { readingPages } from './seoReadings';
import { staticPages } from './seoStaticPages';
import { credit, groups, playable, readable } from './seoCatalog';
import { guideFile } from './seoTemplates';
import { clip, escapeHtml, playUrl, REPO_URL, SITE_ABOUT, SITE_URL } from '../src/seo/site';
import { FORK_NOTE, NOTICE_URL, PRODUCT } from '../src/edition';

export function sitemapXml(catalog: CdCatalogEntry[], lastmod: string): string {
  const urls = [
    { loc: SITE_URL, priority: '1.0' },
    { loc: `${SITE_URL}dos.html`, priority: '0.7' },
    { loc: `${SITE_URL}downloads.html`, priority: '0.6' },
    { loc: `${SITE_URL}web-player.html`, priority: '0.5' },
    ...playable(catalog).map((g) => ({ loc: playUrl(g.id), priority: g.original ? '0.8' : '0.6' })),
    ...GUIDE_SECTIONS.map(([id]) => ({ loc: `${SITE_URL}${guideFile(id)}`, priority: '0.5' })),
    ...[...staticPages(catalog), ...readingPages].map((p) => ({ loc: `${SITE_URL}${p.file}`, priority: '0.5' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeHtml(u.loc).replace(/&#38;/g, '&amp;')}</loc><lastmod>${lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

export function robotsTxt(): string {
  // GitHub Pages serves this at /<repo>/robots.txt; crawlers read robots.txt only at a
  // host's root, so the Sitemap line (and <link rel="sitemap">) is what matters here.
  return `User-agent: *
Allow: /
Disallow: /GameMaker-SandboxEdition/standalone.html

Sitemap: ${SITE_URL}sitemap.xml
`;
}

const md = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/([[\]])/g, '\\$1')
    .trim();
const mdLink = (text: string, url: string, about?: string) => `- [${md(text)}](${url})${about ? `: ${md(about)}` : ''}`;
const repoFile = (path: string) => `${REPO_URL}/blob/master/${path}`;
const repoDir = (path: string) => `${REPO_URL}/tree/master/${path}`;

/** /llms.txt, following the llmstxt.org proposal: a title, a summary, then sections of links. */
export function llmsTxt(catalog: CdCatalogEntry[]): string {
  const games = groups(catalog)
    .filter(([, , list]) => list.length)
    .map(
      ([head, about, list]) =>
        `## ${head}\n\n${md(about)}\n\n${list
          .map((g) => mdLink(g.title, playUrl(g.id), [credit(g), readable(g.blurb) ? clip(g.blurb!, 160) : ''].filter(Boolean).join(' — ')))
          .join('\n')}`,
    );
  return `# ${PRODUCT}

> ${md(SITE_ABOUT)}

${md(FORK_NOTE)}. It runs entirely in the browser (no account, no server): games are kept in the browser's storage and the site works offline. Every file it writes is in the original Game-Maker 3.0 / PLAYGAME formats (.gam, .pal, .bbl/.mbl/.cbl, .chr, .mon, .map, .snd and the standard .gif, .fli, .cmf, .voc), so games run in DOS (or DOSBox) as well. Game-Maker and its PLAYGAME player are re-implemented in TypeScript from the released C source; it is not a PC emulator, and no DOS or x86 code runs (some hardware is emulated: VGA mode 13h and the OPL2 FM sound chip). The site opens on a recreated 1994 desk with a simulated DOS PC running Game-Maker's ported designers; today's web interface is one click away.

## The app

${[
  mdLink(PRODUCT, SITE_URL, 'opens on the 1994 desk or today’s web editor, whichever the visitor used last'),
  mdLink('DOS Game-Maker', `${SITE_URL}dos.html`, 'the 1994 PC on its own, straight into Game-Maker; dos.html?game=<id> opens a game in it'),
  mdLink('Guide', `${SITE_URL}#/help`, 'how to use the editor: blocks, monsters, characters, maps and scenes, sounds and music, testing and exporting'),
  mdLink(
    'Player',
    `${SITE_URL}play.html`,
    'plays one game full-window; each game below has its own page (play-<id>.html), and play.html?game=<id> plays it too',
  ),
  mdLink('Sitemap', `${SITE_URL}sitemap.xml`),
].join('\n')}

${games.join('\n\n')}

## Source code and file formats

${[
  mdLink('Source code', REPO_URL, 'the repository on GitHub: the web app (TypeScript, Vite), the new games, and the original 1994 release'),
  mdLink('Repository README', repoFile('README.md'), 'what is in the repository and how it is published'),
  mdLink('Web app README', repoFile('web/README.md'), 'building, running and testing the web app'),
  mdLink('Source map', repoFile('web/src/README.md'), 'what each folder of the web app holds and how the pieces fit'),
  mdLink(
    'File formats',
    repoDir('web/src/formats'),
    'readers and writers for every Game-Maker file, byte for byte (Borland C++ 16-bit layout: int is 2 bytes, structs are packed)',
  ),
  mdLink('Game engine', repoDir('web/src/engine'), 'a TypeScript port of PLAYGAME.C'),
  mdLink('Original DOS source', repoDir('code/GM'), 'the C source of RSD Game-Maker 3.0, released under the MIT License in 2014'),
  mdLink('Making the new games', repoFile('games/README.md'), 'the Sandbox Software games, each built in code into real Game-Maker files'),
].join('\n')}

## License

${[mdLink('NOTICE', NOTICE_URL, 'credits, history and third-party trademarks'), mdLink('LICENSE', repoFile('LICENSE'), 'MIT License')].join('\n')}
`;
}
