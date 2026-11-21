// Compare the print cover with the actual sheet that the ePub builder sends to its JPEG renderer.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { epubHintIntro } from '../src/manual/epub/hintBook';
import type { HintBookItem } from '../src/manual/printables/types';
import { editorBrowser } from './editorBrowser';

const games = join(__dirname, '..', '..', 'games');
const books = readdirSync(games).flatMap((id) => {
  const file = join(games, id, 'printables.json');
  if (!existsSync(file)) return [];
  const { items } = JSON.parse(readFileSync(file, 'utf8')) as { items?: HintBookItem[] };
  return (items ?? []).filter((item) => item.kind === 'hintbook').map((item) => ({ id, item }));
});

it('renders each edition’s instructions on the hint-book cover', async () => {
  expect(books.length).toBeGreaterThan(10);
  const fixture = await editorBrowser();
  try {
    const modules = await fixture.page.evaluateHandle('Promise.all([import("/src/library/covers.ts"), import("/src/manual/epub/hintBook.ts")])');
    const results = await fixture.page.evaluate(
      async ({ catalog, modules }) => {
        const [{ hintCoverSheet }, { hintBookEpub }] = modules as [typeof import('../src/library/covers'), typeof import('../src/manual/epub/hintBook')];
        function readCover(sheet: Element) {
          return {
            howTo: sheet.querySelector('.hb-howto')!.textContent,
            intro: sheet.querySelector('.hb-howto p')!.textContent,
            footer: sheet.querySelector('.hb-foot')!.textContent,
            sample: !!sheet.querySelector('.hb-howto .rf-code'),
          };
        }
        const results = [];
        for (const { id, item } of catalog) {
          const ctx = { entry: { id, title: item.title }, printables: {} } as Parameters<typeof hintBookEpub>[0];
          const print = readCover((await hintCoverSheet(ctx, item)).el);
          // rasterize mounts a copy of the sheet while drawing the JPEG.
          let digital: ReturnType<typeof readCover> | undefined;
          const observer = new MutationObserver(() => {
            const sheet = document.querySelector('.pp-hb-cover');
            if (sheet) digital = readCover(sheet);
          });
          observer.observe(document.body, { childList: true });
          try {
            const book = await hintBookEpub(ctx, item);
            if (!digital) throw new Error('Missing cover sheet for ' + id);
            results.push({
              id,
              print,
              digital,
              chapterIntro: new DOMParser().parseFromString(book.chapters[0].body, 'text/html').querySelector('p')!.textContent,
            });
          } finally {
            observer.disconnect();
          }
        }
        return results;
      },
      { catalog: books, modules },
    );
    for (const [i, { print, digital, chapterIntro }] of results.entries()) {
      const original = books[i].item.intro;
      if (original) {
        expect(print.intro).toBe(original);
        expect(digital.intro).toBe(epubHintIntro(original));
        expect(chapterIntro).toBe(digital.intro);
      }
      expect(digital.howTo).toContain('“Answer”');
      expect(digital.howTo).not.toMatch(/red film/i);
      expect(digital.footer).not.toContain('RED FILM INCLUDED');
      expect(digital.sample).toBe(false);
      expect(print.footer).toContain('RED FILM INCLUDED');
      expect(print.sample).toBe(true);
    }
  } finally {
    await fixture.close();
  }
}, 60_000);

it('keeps a film-free intro and rewrites a printed instruction as an Answer link', () => {
  expect(epubHintIntro('Choose an Answer.')).toBe('Choose an Answer.');
  expect(epubHintIntro('Slide the red film over the answer.')).toBe('Follow its Answer link.');
});
