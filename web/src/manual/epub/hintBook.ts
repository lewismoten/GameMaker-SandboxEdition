// A game's hint book as an ePub. On paper each answer hides under red noise until the red film
// is laid over it; an e-book reader has no film, so here the answers wait at the back, in an
// Answers section of their own: each question links to its answer, and each answer links back,
// so nothing is given away by turning the page. A hint's sketch is drawn plainly under its answer.
import type { PrintContext } from '../printables/kit';
import type { HintBookItem } from '../printables/types';
import type { EpubBook, EpubChapter } from './book';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { xmlAttr, xmlText } from './xml';

const HOW =
  'In the printed book each answer hides under red film. In this e-book the answers wait in the Answers section at the back: choose “Answer” under a question to see just that one, and “Back to the question” to return. Only read what you need!';

export async function hintBookEpub(ctx: PrintContext, it: HintBookItem): Promise<EpubBook> {
  const [{ hintCoverSheet }, { plainSketch }] = await Promise.all([import('../../library/covers'), import('../printables/redFilm')]);
  const media = new EpubMedia();
  const qId = (s: number, i: number) => `q${s + 1}-${i + 1}`;
  const aId = (s: number, i: number) => `a${s + 1}-${i + 1}`;
  const sectionFile = (s: number) => `s${s + 1}`;
  const intro: EpubChapter = {
    id: 'intro',
    title: 'How to use this book',
    body: [
      `<h1>How to use this book</h1>`,
      it.intro ? `<p>${xmlText(it.intro)}</p>` : '',
      `<p>${xmlText(HOW)}</p>`,
      ctx.printables.skip?.includes('worldmap')
        ? ''
        : `<p><b>Lost?</b> Unfold the World Map that came in your box: it shows every scene, numbered, and every way from one to the next.</p>`,
      `<h2>Contents</h2><ul>${it.sections.map((s, n) => `<li><a href="${sectionFile(n)}.xhtml">${xmlText(s.head)}</a></li>`).join('')}<li><a href="answers.xhtml">Answers</a></li></ul>`,
    ].join(''),
  };
  const sections: EpubChapter[] = it.sections.map((s, n) => ({
    id: sectionFile(n),
    title: s.head,
    body:
      `<h1>${xmlText(s.head)}</h1>` +
      s.hints
        .map(
          (q, i) =>
            `<div class="hint" id="${qId(n, i)}"><p><b>Q.</b> ${xmlText(q.q)}</p><p class="answer-link"><a href="answers.xhtml#${aId(n, i)}">Answer</a></p></div>`,
        )
        .join(''),
  }));
  const answers: string[] = ['<h1>Answers</h1>'];
  for (const [n, s] of it.sections.entries()) {
    answers.push(`<h2 id="as${n + 1}">${xmlText(s.head)}</h2>`);
    for (const [i, q] of s.hints.entries()) {
      const sketch = q.sketch ? await media.canvas(plainSketch(q.sketch)) : undefined;
      const labels = q.sketch?.labels?.map((l) => l.text).join(', ');
      answers.push(
        `<div class="answer" id="${aId(n, i)}">`,
        `<p class="q">Q. ${xmlText(q.q)}</p>`,
        `<p><b>A.</b> ${xmlText(q.a)}</p>`,
        sketch
          ? `<figure><img class="sketch" src="${xmlAttr(sketch)}" alt="${xmlAttr(`A sketch of the spot${labels ? `, marked ${labels}` : ''}`)}"/></figure>`
          : '',
        `<p class="back-link"><a href="${sectionFile(n)}.xhtml#${qId(n, i)}">Back to the question</a></p>`,
        `</div>`,
      );
    }
  }
  const company = ctx.entry.company ?? 'Sandbox Software';
  return {
    key: `hintbook/${ctx.entry.id}`,
    title: it.title,
    creator: company,
    publisher: company,
    date: ctx.entry.year ? String(ctx.entry.year) : undefined,
    description: `The official hint book for ${ctx.entry.title}, from its box in Game-Maker: Sandbox Edition. The answers are kept apart, at the back.`,
    cover: await coverPicture(await hintCoverSheet(ctx, it), `${it.title}: the hint book’s front cover`),
    chapters: [
      intro,
      ...sections,
      { id: 'answers', title: 'Answers', body: answers.join(''), parts: it.sections.map((s, n) => ({ title: s.head, id: `as${n + 1}` })) },
    ],
    files: media.files,
  };
}
