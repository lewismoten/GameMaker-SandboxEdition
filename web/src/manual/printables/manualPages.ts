// The printed manual: its chapters flowed onto booklet pages (5.5 x 8.5 inches, like the
// stapled manuals in shareware boxes), padded with note pages to whole folded sheets, with
// the box front as the cover and a back cover.
import { h } from '../../editor/ui';
import { mapShot } from '../../desk/boxArt';
import type { CatalogEntry } from '../../project/files';
import { bookletPageCount } from './imposition';
import { paginate } from './paginate';
import { FICTIONAL_NOTE, sandboxLogo, hashString } from './kit';

export const PAGE_W = 5.5;
export const PAGE_H = 8.5;

export interface BookPage {
  kind: 'cover' | 'text' | 'notes' | 'scores' | 'back';
  head?: [string, string];
  body: HTMLElement[];
}

async function fillShots(entry: CatalogEntry, markup: string): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.innerHTML = markup;
  await Promise.all(
    [...el.querySelectorAll('shot')].map(async (s) => {
      const num = (name: string, d: number) => Number(s.getAttribute(name) ?? d) || d;
      const w = num('w', 16);
      const hh = num('h', 10);
      const shot = await mapShot(entry, s.getAttribute('map') ?? '', num('x', 0), num('y', 0), w, hh).catch(() => undefined);
      const fig = document.createElement('figure');
      if (shot)
        fig.append(
          h(
            'span',
            { class: 'mp-shot' },
            h('img', { src: shot.toDataURL(), alt: s.getAttribute('caption') ?? 'Screenshot', width: shot.width, height: shot.height }),
          ),
        );
      const caption = s.getAttribute('caption');
      if (caption) fig.append(h('figcaption', null, caption));
      s.replaceWith(fig);
    }),
  );
  return el;
}

/** After any paragraph giving a P.O. Box, a printed note that it is made up. */
export function markFictionalAddresses(root: HTMLElement): number {
  let n = 0;
  const blocks = [...root.querySelectorAll('p, li, td, div')].filter(
    (b) => /P\.?\s?O\.?\s+Box/i.test(b.textContent ?? '') && !b.querySelector('p, li, td, div'),
  );
  for (const b of blocks) {
    const at = b.closest('p, li, table, div') ?? b;
    at.after(h('p', { class: 'pp-fictional' }, `(${FICTIONAL_NOTE})`));
    n++;
  }
  return n;
}

/** A blank booklet page to measure content in, attached off screen. */
function measurer(host: HTMLElement): () => { flow: HTMLElement; limit: number } {
  return () => {
    host.replaceChildren();
    const flow = h('div', { class: 'mp-flow' });
    const inner = h('div', { class: 'mpage-in' }, h('div', { class: 'runhead' }, h('span', null, 'x'), h('span', null, 'x')), flow);
    const page = h('section', { class: 'mpage' }, inner);
    host.append(page);
    const cs = getComputedStyle(inner);
    const limit = (inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) * 0.985;
    return { flow, limit };
  };
}

function notesPage(): HTMLElement[] {
  return [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })];
}

function scoresPage(title: string): HTMLElement[] {
  return [
    h('h2', null, 'Hall of Fame'),
    h('p', null, `Write down your best ${title} games here. Pencil recommended: you will beat these.`),
    h(
      'table',
      { class: 'mp-scores' },
      h('tr', null, h('th', null, 'Date'), h('th', null, 'Name'), h('th', null, 'Score'), h('th', null, 'How far')),
      ...Array.from({ length: 12 }, () => h('tr', null, h('td'), h('td'), h('td'), h('td'))),
    ),
  ];
}

function backCover(entry: CatalogEntry): HTMLElement[] {
  const n = hashString(entry.id);
  const bars = Array.from({ length: 46 }, (_, i) => h('i', { style: `width:${1 + ((n >> (i % 24)) & 1) + (i % 3 === 0 ? 1 : 0)}px` }));
  return [
    h(
      'div',
      { class: 'mp-back' },
      sandboxLogo('mp-back-logo'),
      h('p', { class: 'mp-back-line' }, 'Games made in the sandbox, for everyone who ever logged on.'),
      h('p', { class: 'mp-back-small' }, `${entry.title} © ${entry.year ?? 1995} Sandbox Software. Made with GAME-MAKER 3.0 by Recreational Software Designs.`),
      h('p', { class: 'mp-back-small' }, 'Shareware: copy it, share it, upload it. Keep all the files together.'),
      h('p', { class: 'mp-back-small pp-fictional' }, `(${FICTIONAL_NOTE})`),
      h('div', { class: 'mp-barcode', 'aria-hidden': 'true' }, ...bars),
      h('p', { class: 'mp-back-small' }, 'Printed in U.S.A.'),
    ),
  ];
}

/** Lays out the whole booklet. `cover` is a picture of the box front. */
export async function buildBooklet(entry: CatalogEntry, cover: string | undefined, host: HTMLElement): Promise<BookPage[]> {
  const manual = entry.original!.manual!;
  const title = manual.title || `${entry.title} Manual`;
  const shortTitle = title.replace(/\s+-\s+.*$/, '');
  const chapters = await Promise.all(manual.pages.map(async (p) => ({ head: p.head, el: await fillShots(entry, p.html) })));
  await Promise.all(chapters.flatMap((c) => [...c.el.querySelectorAll('img')].map((i) => i.decode().catch(() => undefined))));
  const pages: BookPage[] = [
    {
      kind: 'cover',
      body: [
        h(
          'div',
          { class: 'game-cover', style: `background:${entry.original?.box?.background ?? '#111'}` },
          cover ? h('img', { src: cover, alt: `${entry.title} cover` }) : null,
        ),
      ],
    },
  ];
  const next = measurer(host);
  for (const c of chapters) {
    markFictionalAddresses(c.el);
    for (const body of paginate([...c.el.children] as HTMLElement[], next)) pages.push({ kind: 'text', head: [shortTitle, c.head], body });
  }
  host.replaceChildren();
  const total = bookletPageCount(pages.length + 1);
  const pads = total - pages.length - 1;
  for (let i = 0; i < pads; i++)
    pages.push(
      i === 0 && pads > 1
        ? { kind: 'scores', head: [shortTitle, 'Hall of Fame'], body: scoresPage(entry.title) }
        : { kind: 'notes', head: [shortTitle, 'Notes'], body: notesPage() },
    );
  pages.push({ kind: 'back', body: backCover(entry) });
  return pages;
}

/** One booklet page as an element (the same for the screen and for print). */
export function pageElement(p: BookPage, index: number): HTMLElement {
  const inner = h('div', { class: 'mpage-in' });
  if (p.head) inner.append(h('div', { class: 'runhead' }, h('span', null, p.head[0]), h('span', null, p.head[1])));
  inner.append(h('div', { class: 'mp-flow' }, ...p.body.map((b) => b.cloneNode(true))));
  if (p.kind !== 'cover' && p.kind !== 'back') inner.append(h('div', { class: 'folio' }, String(index)));
  return h('section', { class: `mpage mp-${p.kind} ${p.kind === 'cover' ? 'cover' : ''} ${index % 2 ? 'mp-odd' : 'mp-even'}` }, inner);
}
