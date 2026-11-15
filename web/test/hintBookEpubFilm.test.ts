// The hint-book ePub never tells the reader to lay the red film over an answer (an e-book has none),
// while the printed hint book keeps its red-film intro. Checked on every game's real printables.json.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { epubHintIntro, hintBookEpub } from '../src/manual/epub/hintBook';
import type { PrintContext } from '../src/manual/printables/kit';
import type { HintBookItem } from '../src/manual/printables/types';

// The cover and the red-film sketch need a canvas; the intro text under test does not.
vi.mock('../src/library/covers', () => ({ hintCoverSheet: async () => ({}) }));
vi.mock('../src/manual/epub/cover', () => ({
  coverPicture: async () => ({ path: 'images/cover.jpg', type: 'image/jpeg', data: new Uint8Array(1), alt: 'cover' }),
}));
vi.mock('../src/manual/printables/redFilm', () => ({ plainSketch: () => ({}) }));

const games = join(__dirname, '..', '..', 'games');
const intros = readdirSync(games).flatMap((id) => {
  const f = join(games, id, 'printables.json');
  if (!existsSync(f)) return [];
  const items = (JSON.parse(readFileSync(f, 'utf8')).items ?? []) as { kind: string; intro?: string }[];
  return items.filter((i) => i.kind === 'hintbook' && i.intro).map((i) => ({ id, intro: i.intro as string }));
});

describe('hint-book intro for the ePub', () => {
  it('finds the hint books', () => expect(intros.length).toBeGreaterThan(10));
  for (const { id, intro } of intros) {
    it(`${id}: no film instruction in the ePub, the print text is unchanged`, () => {
      const out = epubHintIntro(intro);
      expect(out).not.toMatch(/red film|through the red|under red|lay the|slide the/i);
      if (/red film/i.test(intro)) expect(out).not.toBe(intro);
      expect(intro).toMatch(/red/i);
    });
  }
  it('reads well', () => {
    expect(epubHintIntro('Stuck? Find your question, then slide the red film over the answer. One at a time.')).toBe(
      'Stuck? Find your question, then follow its Answer link. One at a time.',
    );
  });

  it('a built hint-book ePub has the Answer-link intro; the print item keeps the red film', async () => {
    const intro = 'Stuck? Find your question, then slide the red film over the answer. One at a time.';
    const item = { kind: 'hintbook', title: 'Hints', intro, sections: [{ head: 'One', hints: [{ q: 'Where?', a: 'Here.' }] }] } as unknown as HintBookItem;
    const ctx = { entry: { id: 'x', title: 'X' }, printables: {} } as unknown as PrintContext;
    const book = await hintBookEpub(ctx, item);
    const text = book.chapters.map((c) => c.body).join('\n');
    expect(text).toContain('follow its Answer link');
    expect(text).not.toMatch(/red film over/i);
    expect(item.intro).toMatch(/slide the red film over the answer/);
  });
});
