// A Sandbox Software game's printed manual as an ePub: its cover, each chapter from the same
// manual.json the booklet flows onto pages (screenshots drawn by the game's own files), and its
// back cover's small print. The Hall of Fame and note pages are for a pencil, and stay on paper.
import type { CatalogEntry } from '../../project/files';
import type { EpubBook } from './book';
import { chapterOf } from './chapter';
import { coverPicture } from './cover';
import { EpubMedia } from './media';
import { h } from '../../editor/core/ui';

export async function manualBook(entry: CatalogEntry): Promise<EpubBook> {
  const [{ manualChapters, backCover }, { manualCoverSheet }] = await Promise.all([import('../printables/manualPages'), import('../../library/covers')]);
  const manual = entry.original!.manual!;
  const title = manual.title || `${entry.title} Manual`;
  const company = entry.company ?? 'Sandbox Software';
  const media = new EpubMedia();
  const chapters = [];
  for (const [i, c] of (await manualChapters(entry)).entries()) chapters.push(await chapterOf(`c${i + 1}`, c.head, [...c.el.childNodes], { media }));
  chapters.push(await chapterOf('back', 'Back cover', [h('section', { class: 'back-cover' }, ...backCover(entry))], { media, unlisted: true }));
  return {
    key: `manual/${entry.id}`,
    title,
    creator: company,
    publisher: company,
    date: entry.year ? String(entry.year) : undefined,
    description: `The printed manual from the box of ${entry.title}, a ${company} game made with Game-Maker 3.0, from Game-Maker: Sandbox Edition.`,
    cover: await coverPicture(await manualCoverSheet(entry), `${title}: the manual’s front cover`),
    chapters,
    files: media.files,
  };
}
