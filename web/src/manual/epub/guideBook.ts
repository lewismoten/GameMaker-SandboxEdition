// The site's Guide (#/help, guideSections.ts) as an ePub: a chapter for each of its sections, in
// the order its contents lists them. Links between sections turn there; a link to another part of
// the site keeps only its words, and one to another site keeps its words with the address after
// them as text, so the book asks nothing of the network.
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { EpubMedia } from './media';

export async function guideBook(): Promise<EpubBook> {
  const [{ GUIDE_SECTIONS }, { decorateBbsName }] = await Promise.all([import('../guideSections'), import('../../retro/bbs/bbsName')]);
  const file = new Map(GUIDE_SECTIONS.map(([id], i) => [id, `g${i + 1}`]));
  const link = (href: string) => {
    const to = file.get(/^#\/help\/([\w-]+)/.exec(href)?.[1] ?? '');
    return to && `${to}.xhtml`;
  };
  const media = new EpubMedia();
  const chapters: EpubChapter[] = [];
  for (const [id, title, html] of GUIDE_SECTIONS) {
    const el = document.createElement('div');
    // as the Guide shows it (webManual.ts): the section's title its heading, its own headings one level up
    el.innerHTML = `<h1>${title}</h1>${html.replace(/<(\/?)h3\b/g, '<$1h2')}`;
    for (const a of el.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')) a.after(` (${a.getAttribute('href')})`);
    decorateBbsName(el);
    chapters.push(await chapterOf(file.get(id)!, title, [...el.childNodes], { media, link }));
  }
  return {
    key: 'site/guide',
    title: 'Game-Maker: Sandbox Edition Guide',
    creator: 'Game-Maker: Sandbox Edition',
    publisher: 'Lewis Moten',
    date: String(new Date().getFullYear()),
    description: 'How to design, play and share games with the web version of Game-Maker: Sandbox Edition.',
    chapters,
    files: media.files,
  };
}
