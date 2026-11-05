// TURBO BUTTON's words as plain text, issue by issue and section by section (plainText.ts reads
// each page), for the static magazine.html: scripts/magazineText.ts writes them to
// src/seo/magazineText.json, and magazineText.test.ts fails when that file is out of date.
// The pages come from buildIssue, so the page numbers other pages quote are filled in as the
// reader sees them. The contents pages are left out (they list the sections). No DOM.
import type { CatalogEntry } from '../../project/files';
import { magContext, magGames } from './games';
import { buildIssue, SECTIONS, SECTIONS_1 } from './issue';
import { ISSUES } from './masthead';
import { pageText, type TextItem } from './plainText';

export type MagazineText = { issue: string; sections: { title: string; items: TextItem[] }[] }[];

/** No. 2 (the issue on the desk), then No. 1 (the back issue), from the games as the catalog lists them. */
export async function magazineText(catalog: readonly unknown[]): Promise<MagazineText> {
  const games = magGames(catalog as CatalogEntry[]);
  return Promise.all(
    ([2, 1] as const).map(async (n) => {
      const issue = await buildIssue(magContext(games, ISSUES[n]));
      const titles = new Map((n === 1 ? SECTIONS_1 : SECTIONS).map((s) => [s.id, s.title]));
      const sections: MagazineText[number]['sections'] = [];
      for (const pg of issue.pages.filter((p) => p.kind !== 'contents')) {
        const title = titles.get(pg.section) ?? 'More ads';
        const last = sections[sections.length - 1];
        const items = pageText(pg);
        if (last?.title === title) last.items.push(...items);
        else sections.push({ title, items });
      }
      return { issue: ISSUES[n].issue, sections: sections.filter((s) => s.items.length) };
    }),
  );
}
