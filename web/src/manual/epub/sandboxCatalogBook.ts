// Sandbox Software's games catalog (in every box: gen.ts catalog) as an ePub: its first page as
// the cover, every game with its picture, year, sound, disk and price, pitch and features, then
// what's coming, the BBS, and the order form as a plain section. It lists the games the printed
// one lists (the box's family: a secret game only once it has been found in this browser).
import type { PrintContext } from '../printables/kit';
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

const CSS = `
.cat-game { margin: 1em 0 1.4em; page-break-inside: avoid; break-inside: avoid; }
.cat-game img { display: block; margin: 0 auto 0.4em; }
.cat-meta { font-family: sans-serif; font-size: 0.85em; }
.cat-lead { font-style: italic; }
.cat-price-note { font-size: 0.85em; }
`;

export async function sandboxCatalogEpub(ctx: PrintContext): Promise<EpubBook> {
  const { catalogBlocks, catalog } = await import('../printables/gen');
  const blocks = await catalogBlocks(ctx);
  const media = new EpubMedia();
  const games = blocks.filter((b) => b.matches('.cat-lead, .cat-game'));
  const chapters: EpubChapter[] = [await chapterOf('games', 'Games', [h('h1', null, 'Games'), ...games], { media, parts: 'h3' })];
  // what follows the games (coming soon, the BBS, the order form): a section each, named by its heading
  for (const [i, b] of blocks.filter((x) => !games.includes(x)).entries()) {
    const title = b.querySelector('h3')?.textContent ?? 'More';
    const head = h('h1', null, title);
    b.querySelector('h3')?.remove();
    chapters.push({ ...(await chapterOf(`s${i + 1}`, title, [head, b], { media })), title: title === 'ORDER FORM' ? 'Order form' : title });
  }
  const [front] = await catalog(ctx);
  return {
    key: 'catalog/sandbox-software',
    title: 'Sandbox Software Games Catalog',
    creator: 'Sandbox Software',
    publisher: 'Sandbox Software',
    date: '1995',
    description:
      'Sandbox Software’s games catalog, from the boxes in Game-Maker: Sandbox Edition: every Sandbox Software game, made with Game-Maker 3.0, and how to order it.',
    cover: await coverPicture(front, 'Sandbox Software games catalog, its first page'),
    chapters,
    files: media.files,
    css: CSS,
  };
}
