// The desk's paper shareware catalog (desk/room/catalog.ts) as an ePub: every shareware game made
// with Game-Maker that it lists (the same games, so never a secret one it doesn't show), each with
// its title screen, author, registration, sound, disks and blurb, and its author's notice and
// registration terms in full (on paper they open under a button); then how to get them.
import type { CatalogEntry } from '../../project/files';
import { creditLine } from '../../project/files';
import { sizeText, storageLine, zipBytes, zipName } from '../../project/diskFacts';
import { soundLine } from '../../desk/room/catalog';
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

const CSS = `
body { font-family: monospace; }
.item { margin: 1em 0 1.4em; }
.item img { display: block; max-width: 20em; margin: 0.4em 0; }
.meta { font-size: 0.85em; }
.notice { font-size: 0.8em; }
`;

/** A game's title screen (its first level when it has none), as a canvas. */
async function titleScreen(g: CatalogEntry): Promise<HTMLCanvasElement | undefined> {
  const { renderShot, renderTitle } = await import('../../gfx/gameShots');
  const c = document.createElement('canvas');
  if (await renderTitle(g, c).catch(() => false)) return c;
  return (await renderShot(g, c, 10, 6).catch(() => false)) ? c : undefined;
}

export async function sharewareCatalogEpub(games: CatalogEntry[]): Promise<EpubBook> {
  const media = new EpubMedia();
  const pictures = await Promise.all(games.map(titleScreen));
  const items = games.map((g, i) => {
    const pic = pictures[i];
    if (pic) pic.setAttribute('aria-label', `${g.title}, its title screen`);
    return h(
      'section',
      { class: 'item' },
      h('h2', null, `${String(i + 1).padStart(2, '0')}. ${g.title}`),
      pic ?? null,
      h('p', { class: 'meta' }, creditLine(g) || 'Author unknown'),
      h('p', { class: 'meta' }, `${g.price === 'Freeware' ? 'FREEWARE' : g.price ? `Register: ${g.price}` : 'Shareware'} · ${soundLine(g)}`),
      h('p', { class: 'meta' }, `${storageLine(g)} · BBS: ${zipName(g)}, ${sizeText(zipBytes(g))}`),
      g.blurb ? h('p', null, g.blurb) : null,
      h('h3', null, 'Author’s notice & registration'),
      h('pre', { class: 'notice' }, g.notice || 'Shareware. Copyrighted by its author.'),
    );
  });
  const chapters: EpubChapter[] = [
    await chapterOf(
      'games',
      'Shareware catalog',
      [
        h('h1', null, 'SHAREWARE CATALOG'),
        h('p', null, `Games made with GAME-MAKER · Fall 1994 · ${games.length} titles`),
        h('p', null, 'Try them free. If you like one, register it with its author — see each game’s notice.'),
        ...items,
      ],
      { media },
    ),
    await chapterOf(
      'get',
      'How to get them',
      [
        h('h1', null, 'How to get them'),
        h(
          'p',
          null,
          'Call THE -= S A N D B O X =- BBS in Pittsburgh at 1-412-555-SAND (14,400 baud, 8-N-1). Pick File Areas, then D and the file number to download. Unzipped games land in C:\\DOWNLOAD.',
        ),
      ],
      { media },
    ),
  ];
  chapters[0].title = 'Shareware catalog';
  return {
    key: 'catalog/shareware',
    title: 'Shareware Catalog: Games Made with Game-Maker',
    creator: 'Game-Maker: Sandbox Edition',
    date: '1994',
    description:
      'The paper shareware catalog on the 1994 desk in Game-Maker: Sandbox Edition: shareware games made with Game-Maker, each with its author’s notice and registration terms.',
    chapters,
    files: media.files,
    css: CSS,
  };
}
