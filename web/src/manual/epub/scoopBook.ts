// A box's newsletter, The Sandbox Scoop, as an ePub: its front page as the cover, its stories
// from the same sheets the box shows (gen.ts newsletter), and its Tip of the month's answer,
// hidden under red film on paper, kept on a page of its own at the back (as in hintBook.ts).
import type { PrintContext } from '../printables/kit';
import type { EpubBook } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { xmlText } from './xml';
import { h } from '../../editor/core/ui';

export async function scoopEpub(ctx: PrintContext): Promise<EpubBook> {
  const { newsletter, tipOfTheMonth } = await import('../printables/gen');
  const sheets = await newsletter(ctx);
  const media = new EpubMedia();
  const tip = tipOfTheMonth(ctx);
  // the masthead's line: "Vol. 1, No. 7", the dateline
  const sub = [...sheets[0].el.querySelectorAll('.nl-sub span')].map((s) => s.textContent ?? '');
  const title = `The Sandbox Scoop, ${sub[0] ?? ''}`.replace(/, $/, '');
  const body: Node[] = [];
  for (const s of sheets) {
    const page = s.el.querySelector('.pp-sheet') ?? s.el;
    // the hidden answer becomes a link to it; the film's note says where it is instead
    for (const code of page.querySelectorAll('.rf-code')) code.replaceWith(h('a', { href: 'answer.xhtml#tip', class: 'answer-link' }, 'Answer (at the back)'));
    for (const note of page.querySelectorAll('.nl-when'))
      if (/red film/i.test(note.textContent ?? '')) note.textContent = 'The answer is on the last page of this e-book.';
    // the masthead's line is three spans set apart by the layout: apart by dots here
    for (const line of page.querySelectorAll('.nl-sub')) line.replaceChildren([...line.children].map((c) => c.textContent).join(' · '));
    body.push(...page.childNodes);
  }
  const link = (href: string) => (href === 'answer.xhtml#tip' ? href : undefined);
  const chapters = [await chapterOf('news', sub[0] ?? 'The Sandbox Scoop', body, { media, link, parts: 'h2, h3' })];
  chapters[0].title = 'The Sandbox Scoop';
  if (tip)
    chapters.push({
      id: 'answer',
      title: 'Tip of the month: the answer',
      body: `<h1>Tip of the month: the answer</h1><div class="answer" id="tip"><p class="q">Q. ${xmlText(tip.q)}</p><p><b>A.</b> ${xmlText(tip.a)}</p><p class="back-link"><a href="news.xhtml">Back to the news</a></p></div>`,
    });
  return {
    key: `scoop/${ctx.entry.id}`,
    title,
    creator: 'Sandbox Software',
    publisher: 'Sandbox Software',
    date: ctx.entry.year ? String(ctx.entry.year) : undefined,
    description: `Sandbox Software’s newsletter from the box of ${ctx.entry.title}, in Game-Maker: Sandbox Edition.`,
    // drawn afresh: the sheets above lost their hidden answer
    cover: await coverPicture((await newsletter(ctx))[0], `${title}: the newsletter’s front page`),
    chapters,
    files: media.files,
  };
}
