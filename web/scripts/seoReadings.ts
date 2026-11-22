// Static reading documents use the same course lessons, chapter order and Markdown parser as the app.
import { readFileSync } from 'node:fs';
import { BOOK_TITLE as artTitle, COURSES, type Part } from '../src/artCourses/courses';
import { BOOK_TITLE as guideTitle, CHAPTERS } from '../src/programmersGuide/chapterList';
import { citationHref } from '../src/programmersGuide/citations';
import { readMarkdown, type Block, type Inline } from '../src/manual/printables/markdownBlocks';
import { escapeHtml as esc, ROUTES } from '../src/seo/site';
import type { StaticPage } from './seoStaticPages';

function coursePart(part: Part): string {
  if ('p' in part) return `<p>${esc(part.p)}</p>`;
  if ('ul' in part) return `<ul>${part.ul.map((text) => `<li>${esc(text)}</li>`).join('')}</ul>`;
  const png = readFileSync(new URL(`../src/artCourses/figures/${part.fig}.png`, import.meta.url)).toString('base64');
  return `<figure><img style="max-width:100%;height:auto" src="data:image/png;base64,${png}" alt="${esc(part.alt)}"><figcaption>${esc(part.caption)}</figcaption></figure>`;
}

function inline(parts: Inline[]): string {
  return parts
    .map((p) => {
      if (typeof p === 'string') return esc(p);
      const html = `<${p.tag}>${inline(p.kids)}</${p.tag}>`;
      const href = p.tag === 'code' && typeof p.kids[0] === 'string' && citationHref(p.kids[0]);
      return href ? `<a href="${esc(href)}">${html}</a>` : html;
    })
    .join('');
}

function block(b: Block): string {
  switch (b.tag) {
    case 'p':
      return `<p>${inline(b.kids)}</p>`;
    case 'pre':
      return `<pre style="overflow-x:auto">${esc(b.text)}</pre>`;
    case 'diagram':
      return esc(b.name);
    case 'ul':
    case 'ol':
      return `<${b.tag}${b.start ? ` start="${b.start}"` : ''}>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${b.tag}>`;
    case 'table':
      return `<div style="overflow-x:auto"><table><thead><tr>${b.head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
}

function chapterHtml(id: string): string {
  const source = readFileSync(new URL(`../src/programmersGuide/chapters/${id}.md`, import.meta.url), 'utf8');
  return readMarkdown(source)
    .map((s) => (s.level > 1 ? `<h${s.level}>${esc(s.title)}</h${s.level}>` : '') + s.blocks.map(block).join('\n'))
    .join('\n');
}

function collection(
  slug: string,
  title: string,
  meta: { title: string; description: string },
  items: { id: string; title: string; about: string; body: () => string }[],
  extra = '',
): StaticPage[] {
  const file = `${slug}.html`;
  return [
    {
      file,
      hash: `#/${slug}`,
      ...meta,
      h1: title,
      html: `<p>${esc(meta.description)}</p><ol>${items.map((i) => `<li><a href="./${slug}-${i.id}.html">${esc(i.title)}</a> — ${esc(i.about)}</li>`).join('')}</ol>${extra}`,
    },
    ...items.map((i) => ({
      file: `${slug}-${i.id}.html`,
      hash: `#/${slug}/${i.id}`,
      title: `${i.title} · ${title}`,
      description: i.about.length < 50 ? `${title}. ${i.about}` : i.about,
      h1: i.title,
      get html() {
        return `<p><a href="./${file}">${esc(title)}</a></p><p>${esc(i.about)}</p><article style="overflow-wrap:anywhere">${i.body()}</article>`;
      },
    })),
  ];
}

export const readingPages = [
  ...collection(
    'art-courses',
    artTitle,
    ROUTES.artCourses,
    COURSES.map((c) => ({
      ...c,
      body: () =>
        c.lessons.map((l) => `<h2>${esc(l.title)}</h2>${l.parts.map(coursePart).join('\n')}`).join('\n') +
        `<p>Try it in Game-Maker: ${esc(c.starters.join(' and '))}, on the Sample CD, show the editor side of these ideas.</p>`,
    })),
  ),
  ...collection(
    'programmers-guide',
    guideTitle,
    ROUTES.programmersGuide,
    CHAPTERS.map((c) => ({ ...c, body: () => chapterHtml(c.id) })),
    '<p>Research and prose by Claude (Sonnet 5.5 workers, reviewed by Opus), from the original Game-Maker source. <a href="./#/credits">Credits</a></p><p><a href="./#/programmers-guide/all">Open the combined print view in the app</a></p>',
  ),
];
