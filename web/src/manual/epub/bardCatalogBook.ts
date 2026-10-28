// The Bard of Bizarre's flyer (in the Game-Maker box: bardCatalog.ts) as an ePub: its first page
// as the cover, Doc Leo's hello, every song-game under its collection with its title screen, the
// small print, then how to get them and the registration coupon as plain sections. Taken from the
// flyer's own pages (which only ever break between games), less the running line atop each.
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

const CSS = `
.bard-head b, .bard-head span, .bard-head em { display: block; }
.bard-head b { font-family: sans-serif; font-size: 1.4em; }
.bard-logo, .bard-snap { max-width: 10em; }
.bard-game { margin: 1em 0 1.4em; page-break-inside: avoid; break-inside: avoid; }
.bard-game img { display: block; margin: 0 auto 0.4em; }
.bard-meta { font-family: sans-serif; font-size: 0.85em; }
.bard-tag, .bard-sig { font-style: italic; display: block; }
.bard-small { font-size: 0.85em; }
.bard-stamp b { display: block; }
`;

export async function bardCatalogEpub(): Promise<EpubBook> {
  const { bardCatalog } = await import('../printables/bardCatalog');
  const sheets = await bardCatalog();
  const media = new EpubMedia();
  const inside = (i: number) => sheets[i].el.querySelector('.pp-sheet') ?? sheets[i].el;
  const flyer = sheets.slice(0, -1).flatMap((_, i) => [...inside(i).children].filter((c) => !c.matches('.bard-run')));
  const hello = flyer.filter((c) => c.matches('.bard-head, .bard-howdy'));
  const games = flyer.filter((c) => !hello.includes(c));
  const back = [...inside(sheets.length - 1).children];
  const chapters: EpubChapter[] = [
    { ...(await chapterOf('hello', 'Howdy, friends!', hello, { media, parts: 'h6' })), title: 'Howdy, friends!' },
    { ...(await chapterOf('games', 'Song-games', [h('h1', null, 'Song-games'), ...games], { media })), title: 'Song-games' },
  ];
  for (const [i, sec] of back.entries()) {
    const head = sec.querySelector('h2');
    const title = (head?.textContent ?? 'More').replace(/^✂\s*/, '');
    chapters.push({ ...(await chapterOf(`b${i + 1}`, title, [sec], { media, parts: 'h6' })), title });
  }
  return {
    key: 'catalog/bard-of-bizarre',
    title: 'The Bard of Bizarre: Song-Games',
    creator: 'The Bard of Bizarre',
    publisher: 'Lewis Moten',
    date: '1995',
    description:
      'The Bard of Bizarre’s flyer of song-games, from the Game-Maker: Sandbox Edition box, with the honest small print about how the songs and pictures were made.',
    cover: await coverPicture((await bardCatalog())[0], 'The Bard of Bizarre’s flyer, its first page'),
    chapters,
    files: media.files,
    css: CSS,
  };
}
