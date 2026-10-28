// TURBO BUTTON as an ePub: its front cover, then each section of the issue (in the running
// order, as the contents page lists it) from the same pages the viewer draws (render.ts), its
// stories reflowed as text with their screenshots and drawings. A page that is only a picture,
// a full-page ad or the back cover, is drawn as one, its words as its description. "Continued on
// page N" links turn to the page they name; links into the site keep only their words.
import type { CatalogEntry } from '../../project/files';
import type { Issue, PlacedPage } from '../magazine/types';
import type { Where } from '../magazine/go';
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { words, type PictureRule } from './xhtml';
import { rasterize } from './raster';
import { h } from '../../editor/core/ui';
import { xmlAttr } from './xml';

/** A page's size as the viewer lays it out: a letter sheet at 96 CSS pixels to the inch. */
const PAGE_W = 816;
const PAGE_H = 1056;

/** A box's printed piece shown small (a hint book's cover): drawn as the picture it is. */
const PIECE: PictureRule = {
  selector: '.mag-piece-frame > .pp-paper',
  width: 360,
  type: 'image/jpeg',
  alt: (el) => el.parentElement?.querySelector('.sr-only')?.textContent?.trim() || el.parentElement?.getAttribute('aria-label') || 'A printed piece',
};

/** Its layout in e-book terms: the magazine's boxes, pull quotes and listings, plainly. */
const CSS = `
.mag-kicker { font-family: sans-serif; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0; }
.mag-deck { font-style: italic; }
.mag-side, .mag-halfad, .mag-card, .mag-adframe { border: 1px solid #888; padding: 0.4em 0.8em; margin: 1em 0; }
.mag-halfad-frame > h3:first-child, .mag-side > h3:first-child { margin-top: 0.2em; }
.mag-pull { font-size: 1.2em; }
.mag-rows { list-style: none; padding: 0; }
.mag-rows li { margin: 0.6em 0; }
.mag-row-title { font-weight: bold; }
.mag-row-price, .mag-row-by { margin-left: 0.5em; font-size: 0.85em; }
.mag-row-blurb, .mag-row-more { display: block; }
.mag-row-shot img { float: left; width: 6em; margin: 0 0.6em 0.3em 0; }
.mag-rows li::after { content: ''; display: block; clear: both; }
.mag-hint-a { font-style: italic; }
.mag-big-text { display: block; font-family: sans-serif; font-size: 1.8em; font-weight: bold; }
.mag-who { font-family: sans-serif; }
.mag-q { font-weight: bold; }
.mag-field span { display: inline-block; min-width: 6em; }
.mag-burst { font-family: sans-serif; font-weight: bold; }
.mag-piece img { max-width: 12em; }
.mag-cast img { width: 8em; image-rendering: pixelated; }
.mag-small { font-size: 0.85em; }
.ad-page img, .picture-page img { width: 100%; }
`;

const isPicturePage = (pg: PlacedPage) => pg.kind === 'ad' || pg.kind === 'back';

export async function magazineBook(issue: Issue, entries: Map<string, CatalogEntry>, where: Where): Promise<EpubBook> {
  const [{ renderPage }, { MAG }, { magazineCoverSheet }] = await Promise.all([
    import('../magazine/render'),
    import('../magazine/masthead'),
    import('../../library/covers'),
    import('../magazine/mag.css'),
  ]);
  const env = { where, entry: (id: string) => entries.get(id) };
  // the issue's pages in runs: a section's pages together, or a picture page alone
  const runs: { id: string; title: string; pages: PlacedPage[]; picture: boolean }[] = [];
  const toc = new Map(issue.toc.map((t) => [t.section, t.title]));
  for (const pg of issue.pages.slice(1)) {
    const last = runs.at(-1);
    const picture = isPicturePage(pg);
    if (!picture && last && !last.picture && last.pages[0].section === pg.section) last.pages.push(pg);
    else
      runs.push({
        id: `p${pg.folio}`,
        title: picture
          ? pg.kind === 'back'
            ? 'Back cover'
            : `Advertisement: ${pg.title ?? 'an ad'}`
          : pg.kind === 'contents'
            ? 'Contents'
            : (toc.get(pg.section) ?? pg.head ?? pg.title ?? `Page ${pg.folio}`),
        pages: [pg],
        picture,
      });
  }
  const fileOf = new Map(runs.flatMap((r) => r.pages.map((pg) => [pg.id, r.id])));
  // go:mag/<page> turns to that page; anything else the site would open keeps only its words
  const link = (_href: string, a: HTMLAnchorElement) => {
    const page = /^go:mag\/(.+)$/.exec(a.dataset.go ?? '')?.[1];
    const file = page && fileOf.get(page);
    return file ? `${file}.xhtml#pg-${page}` : undefined;
  };
  const media = new EpubMedia();
  const chapters: EpubChapter[] = [];
  for (const run of runs) {
    const drawn = run.pages.map((pg) => renderPage(pg, env));
    await Promise.all(drawn.map((d) => d.ready));
    if (run.picture) {
      const pg = run.pages[0];
      const el = drawn[0].el;
      const r = await rasterize(el, { width: PAGE_W, height: PAGE_H, type: 'image/jpeg', scale: 1.25 });
      if (r) {
        const body = el.querySelector('.mag-body');
        const alt = `${run.title}. ${body ? words(body) : ''}`.trim();
        chapters.push({
          id: run.id,
          title: run.title,
          body: `<section class="picture-page ad-page" id="pg-${xmlAttr(pg.id)}"><img src="${xmlAttr(media.add(r.type, r.data))}" alt="${xmlAttr(alt)}"/></section>`,
          unlisted: pg.kind === 'ad',
        });
        continue;
      }
    }
    // each page's stories under an anchor the "continued" links can turn to
    const nodes = drawn.map((d, i) => h('section', { id: `pg-${run.pages[i].id}` }, ...(d.el.querySelector('.mag-body')?.childNodes ?? [])));
    const chapter = await chapterOf(run.id, run.title, nodes, { media, link, pictures: [PIECE], parts: 'h2' });
    chapters.push({ ...chapter, title: run.title, unlisted: run.picture && run.pages[0].kind === 'ad' });
  }
  return {
    key: 'magazine/turbo-button-1',
    title: `${MAG.name}: ${MAG.tagline}`,
    creator: 'Claude',
    publisher: 'Lewis Moten',
    date: '1995',
    description: `${MAG.name}, ${MAG.issue}: a 1990s-style shareware game magazine written and designed by Claude (Claude Opus 5.5, by Anthropic) for Game-Maker: Sandbox Edition.`,
    cover: await coverPicture(await magazineCoverSheet([...entries.values()]), `${MAG.name} front cover, ${MAG.issue}`),
    chapters,
    files: media.files,
    css: CSS,
  };
}
