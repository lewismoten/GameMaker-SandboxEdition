// The Game-Maker 3.0 Owner's Guide (dosManual.ts) as an ePub: its blueprint cover, then a chapter
// for each run of pages under one running head (the contents, 1. Getting Started … Appendix D),
// joined from the same pages the box shows, with their Game-Maker screens. The printed contents'
// rows turn to their chapters, as they do on screen. Note pages stay on paper.
import { loadCatalog } from '../../project/files';
import type { BookPage } from '../printables/manualPages';
import type { EpubBook, EpubChapter } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

export async function ownersBook(): Promise<EpubBook> {
  const [{ dosManualPages }, { TITLE }, { gmCover }, { sheet }, { mapShot }] = await Promise.all([
    import('../dosManual'),
    import('../dosManualKit'),
    import('../printables/gmCover'),
    import('../printables/kit'),
    import('../../gfx/gameShots'),
  ]);
  const pages: BookPage[] = await dosManualPages();
  // the cover as the guide shows it, peeled back on Teddy's game (drawn here, not with the
  // Library's covers: the DOS page opens this guide, and must load nothing of the desk)
  const teddy = (await loadCatalog().catch(() => [])).find((e) => e.id === 'teddy');
  const at = teddy?.original?.box?.shots?.[0];
  const shot = teddy && at ? await mapShot(teddy, at[0], at[1], at[2], 16, 10).catch(() => undefined) : undefined;
  const coverSheet = sheet(5.5, 8.5, 'gm-thumb', gmCover(shot?.toDataURL(), shot ? teddy?.title : undefined));
  // runs of pages under one running head: one chapter each
  const runs: { head: string; first: number; pages: BookPage[] }[] = [];
  pages.forEach((p, i) => {
    if (p.kind !== 'text' || !p.head) return;
    const last = runs.at(-1);
    if (last?.head === p.head[1]) last.pages.push(p);
    else runs.push({ head: p.head[1], first: i, pages: [p] });
  });
  const ids = runs.map((_, i) => `c${i + 1}`);
  // a page number (as printed at its foot) gives the chapter it falls in
  const chapterAt = (page: number) => {
    let at = -1;
    runs.forEach((r, i) => r.first <= page && (at = i));
    return ids[at];
  };
  const link = (href: string) => (/^c\d+\.xhtml$/.test(href) ? href : undefined);
  const media = new EpubMedia();
  const chapters: EpubChapter[] = [];
  for (const [i, run] of runs.entries()) {
    const nodes = run.pages.flatMap((p) => p.body.map((b) => b.cloneNode(true) as HTMLElement));
    for (const n of nodes)
      for (const row of n.querySelectorAll<HTMLElement>('tr[data-page]')) {
        const to = chapterAt(Number(row.dataset.page));
        const cell = row.querySelector('td');
        if (to && cell) cell.replaceChildren(h('a', { href: `${to}.xhtml` }, ...cell.childNodes));
      }
    // named as its running head names it ('3. Designing Games'), number and all
    chapters.push({ ...(await chapterOf(ids[i], run.head, nodes, { media, link })), title: run.head });
  }
  // the back cover: its words and the registration record, as text
  const back = pages.at(-1);
  if (back)
    chapters.push(
      await chapterOf(
        'back',
        'Back cover',
        back.body.map((b) => b.cloneNode(true)),
        { media, unlisted: true },
      ),
    );
  return {
    key: 'gamemaker/owners-guide',
    title: TITLE,
    creator: 'Sandbox Software',
    publisher: 'Sandbox Software',
    date: '1995',
    description: 'The Owner’s Guide from the Game-Maker: Sandbox Edition box: the 1994 desk PC, DOS and Game-Maker 3.0’s menus and design tools.',
    cover: await coverPicture(coverSheet, 'Owner’s Guide cover: GAME-MAKER, Sandbox Edition, Version 3.0, on a blueprint'),
    chapters,
    files: media.files,
  };
}
