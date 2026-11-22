// The reader loads an individual chapter only when it is opened.
export { BOOK_TITLE, CHAPTERS, chapterById, type Chapter } from './chapterList';

const files = import.meta.glob<string>('./chapters/*.md', { query: '?raw', import: 'default' });

/** One chapter's Markdown. */
export async function loadChapter(id: string): Promise<string> {
  const load = files[`./chapters/${id}.md`];
  if (!load) throw new Error(`no chapter ${id}`);
  return load();
}
