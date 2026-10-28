// The Ultimate Owner's Guide as an ePub: its black and gold cover, who it is for, each chapter
// from the same HTML the booklet flows onto pages (plan.ts CHAPTERS), its figures drawn from real
// game files (ultimateFigures.ts), set with styles of their own for an e-book,
// and its back cover. The printed contents' page numbers mean nothing in an e-book: the reader's
// own table of contents takes their place.
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

/** Its figures' layout in e-book terms: the palette pictures side by side, the flow's boxes and arrows in a row. */
const CSS = `
.ug-palcols { text-align: center; }
.ug-palcol { display: inline-block; vertical-align: top; width: 23%; margin: 0 0.5% 0.6em; text-align: center; }
.ug-two .ug-palcol { width: 47%; }
.ug-palcol img { width: 100%; }
.ug-palcol b, .ug-palcol small { display: block; font-size: 0.8em; }
.ug-palcol small { font-style: italic; }
.ug-palkey { font-size: 0.8em; }
.ug-flow { text-align: center; margin-bottom: 0.8em; }
.ug-box { display: inline-block; border: 2px solid #18150f; padding: 0.2em 0.5em; margin: 0.2em; font-size: 0.9em; }
.ug-box small { display: block; font-style: italic; }
.ug-arrow { font-style: italic; margin: 0 0.3em; }
.ug-strip { display: table; width: 100%; border: 2px solid #18150f; table-layout: fixed; }
.ug-strip span { display: table-cell; text-align: center; border-right: 1px solid #8d8470; padding: 0.3em 0; }
.ug-strip .ug-cell-gate { background: #18150f; }
.ug-strip .ug-cell-floor { background: #ebe3c8; }
.ug-strip .ug-cell-link { background: #18150f; color: #f5f0e0; }
.ug-before img.ug-strip-sw { width: auto; height: 1.5em; }
.ug-num { display: none; }
.ug-sr { font-weight: normal; }
.ug-lead { font-style: italic; }
`;

export async function ultimateBook(): Promise<EpubBook> {
  const [{ CHAPTERS }, { fillFigures }, { contents, backCover }, { ultimateItem, ULTIMATE_TITLE }] = await Promise.all([
    import('../ultimate/plan'),
    import('../ultimate/ultimateFigures'),
    import('../ultimate/ultimateGuide'),
    import('../ultimate/ultimateItem'),
  ]);
  const media = new EpubMedia();
  const opts = { media };
  const who = contents([]).flatMap((el) => (el.matches('.note') ? [el] : []));
  const chapters: EpubChapter[] = [await chapterOf('about', 'Who this is for', [h('h1', null, 'Who this is for'), ...who], opts)];
  for (const [i, c] of CHAPTERS.entries()) {
    const el = document.createElement('div');
    el.innerHTML = c.html;
    await fillFigures(el);
    chapters.push(await chapterOf(`c${i + 1}`, c.title, [...el.childNodes], opts));
  }
  chapters.push(await chapterOf('back', 'Back cover', [backCover()], { media, unlisted: true }));
  const [cover] = await ultimateItem().render();
  return {
    key: 'gamemaker/ultimate-guide',
    title: ULTIMATE_TITLE,
    creator: 'Sandbox Software',
    publisher: 'Sandbox Software',
    date: '1995',
    description:
      'Advanced tips and tricks for Game-Maker 3.0, from the Game-Maker: Sandbox Edition box: how PLAYGAME really plays a game. Not an RSD publication.',
    cover: await coverPicture(cover, `${ULTIMATE_TITLE}: the black and gold cover, For Advanced Designers`),
    chapters,
    files: media.files,
    css: CSS,
  };
}
