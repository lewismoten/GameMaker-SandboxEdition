// One chapter of a book from a reader's elements: named by its first heading (or the running
// head it came under), its next level of headings listed under it in the contents, and written
// out as XHTML (xhtml.ts).
import type { EpubChapter, EpubPart } from './book';
import { toXhtml, type XhtmlOptions } from './xhtml';

const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

export interface ChapterOptions extends XhtmlOptions {
  /** The heading tags listed as its parts (default h2). */
  parts?: string;
  unlisted?: boolean;
}

export async function chapterOf(id: string, fallback: string, nodes: Node[], o: ChapterOptions): Promise<EpubChapter> {
  const els = nodes.filter((n): n is HTMLElement => n instanceof HTMLElement);
  const find = (sel: string) => els.flatMap((e) => (e.matches(sel) ? [e] : [...e.querySelectorAll<HTMLElement>(sel)]));
  const h1 = find('h1')[0];
  const title = (h1 && text(h1)) || fallback;
  const parts: EpubPart[] = [];
  for (const [i, el] of find(o.parts ?? 'h2').entries()) {
    const words = text(el);
    if (!words || el.closest('[aria-hidden="true"], [hidden]')) continue;
    if (!/^[A-Za-z_][\w.-]*$/.test(el.id)) el.id = `${id}-${i + 1}`;
    parts.push({ title: words, id: el.id });
  }
  return { id, title, body: await toXhtml(nodes, o), parts, unlisted: o.unlisted };
}
