// NO CARRIER #3, the desk's zine, as an ePub: its first leaf as the cover, then each page from
// the same leaves the box viewer shows (zineLeaf.ts), its cut-out headings as their words, its
// crossed-out lines, the editor's replies and the margin scrawls kept, in a typewriter's type.
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';

const CSS = `
body { font-family: monospace; }
h2.zine-ransom { font-family: sans-serif; font-size: 1.5em; text-transform: uppercase; letter-spacing: 0.08em; }
.zine-struck { text-decoration: line-through; color: #b00; }
.zine-ed, .zine-scrawl { font-family: cursive; color: #b00; }
.zine-scrawl::before { content: '➜ '; }
.zine-phones { list-style: none; padding: 0; }
.zine-ad { border: 2px dashed #555; padding: 1em; text-align: center; font-family: sans-serif; }
`;

export async function zineBook(): Promise<EpubBook> {
  const [{ ZINE, ZINE_TITLE }, { zineLeaf }, { zineCover }] = await Promise.all([
    import('../zine/zinePages'),
    import('../zine/zineLeaf'),
    import('../zine/zineItem'),
  ]);
  const media = new EpubMedia();
  const chapters: EpubChapter[] = [];
  for (const [i, p] of ZINE.entries()) {
    const page = zineLeaf(p, i).el.querySelector('.zine-page')!;
    // a heading cut out letter by letter reads as its plain words
    for (const head of page.querySelectorAll('.zine-ransom')) head.textContent = head.getAttribute('aria-label');
    chapters.push({ ...(await chapterOf(`z${i + 1}`, p.title, [page], { media, parts: 'h6' })), title: p.title });
  }
  return {
    key: 'zine/no-carrier-3',
    title: `${ZINE_TITLE} #3`,
    creator: 'DiAL ToNE',
    date: '1995',
    description:
      'NO CARRIER #3, a photocopied zine about the desk PC’s power tools, found under the toy whistle on the 1994 desk in Game-Maker: Sandbox Edition. Every trick in it is for that PC only.',
    cover: await coverPicture(zineCover(), `${ZINE_TITLE} #3, its cover page`),
    chapters,
    files: media.files,
    css: CSS,
  };
}
