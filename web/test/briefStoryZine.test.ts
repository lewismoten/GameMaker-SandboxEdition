// The one-sheet KEEP IT BRIEF! mini-zine: exact source stories and classic eight-page fold map.
import { describe, expect, it } from 'vitest';
import { WINGS, story } from '../../games/brief/src/stories';
import { BRIEF_STORY_ZINE_ID, BRIEF_STORY_ZINE_VOLUMES, CLASSIC_MINI_ZINE_CELLS, classicMiniZineReadingOrder } from '../src/manual/zine/briefStoryZine';

describe('KEEP IT BRIEF! one-sheet zines', () => {
  it('prints every source story exactly once, word for word, in numbered six-story volumes', () => {
    const source = WINGS.flatMap((wing) => wing.books.map(story)).sort((a, b) => a.n - b.n);
    const printedPages = BRIEF_STORY_ZINE_VOLUMES.flatMap((volume) => volume.pages.filter((page) => page.kind === 'story'));
    expect(printedPages).toHaveLength(source.length);
    expect(printedPages.map(({ story: entry, title, text }) => ({ n: entry?.n, title, text }))).toEqual(
      source.map(({ n, title, text }) => ({ n, title, text })),
    );
    expect(BRIEF_STORY_ZINE_VOLUMES.map((volume) => volume.stories.length)).toEqual([6, 6, 6, 6, 6, 2]);
  });

  it('uses the classic one-sided 2x4 mini-zine imposition', () => {
    expect(BRIEF_STORY_ZINE_ID).toBe('brief-story-zines');
    expect(CLASSIC_MINI_ZINE_CELLS).toEqual([
      { page: 5, rotated: true },
      { page: 4, rotated: true },
      { page: 3, rotated: true },
      { page: 2, rotated: true },
      { page: 6, rotated: false },
      { page: 7, rotated: false },
      { page: 8, rotated: false },
      { page: 1, rotated: false },
    ]);
    expect(classicMiniZineReadingOrder(CLASSIC_MINI_ZINE_CELLS)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    const wrongRotation = CLASSIC_MINI_ZINE_CELLS.map((cell, index) => (index === 0 ? { ...cell, rotated: false } : cell));
    expect(() => classicMiniZineReadingOrder(wrongRotation)).toThrow('upside down');

    const wrongPanelMap = [...CLASSIC_MINI_ZINE_CELLS];
    [wrongPanelMap[1], wrongPanelMap[2]] = [wrongPanelMap[2], wrongPanelMap[1]];
    expect(() => classicMiniZineReadingOrder(wrongPanelMap)).toThrow('folded panel route');
  });

  it('gives each volume a cover, six interior story pages when available, and a credited back page', () => {
    for (const volume of BRIEF_STORY_ZINE_VOLUMES) {
      expect(volume.pages).toHaveLength(8);
      expect(volume.pages[0]).toMatchObject({ kind: 'cover', page: 1 });
      expect(volume.pages.at(-1)).toMatchObject({ kind: 'back', page: 8 });
      expect(volume.pages.filter((page) => page.kind === 'story').map((page) => page.story?.n)).toEqual(volume.stories.map((entry) => entry.n));
      expect(volume.pages.at(-1)?.text).toContain('...And, as always, keep it brief!');
    }
  });

  it('names the real story count on each cover and indexes every title in the spare pockets', () => {
    const last = BRIEF_STORY_ZINE_VOLUMES.at(-1)!;
    expect(last.pages.filter((page) => page.kind === 'index')).toHaveLength(4);
    const titles = BRIEF_STORY_ZINE_VOLUMES.flatMap((volume) => volume.stories.map((entry) => entry.title));
    const indexed = last.pages.filter((page) => page.kind === 'index').flatMap((page) => page.text.split('\n'));
    expect(indexed.map((line) => line.split(' · ')[1])).toEqual(titles);
  });

  it('carries the sheet cutting, folding, and retention instructions', () => {
    const first = BRIEF_STORY_ZINE_VOLUMES[0];
    expect(first.printInstructions).toMatch(/^Fold on/);
    expect(first.printInstructions).toContain('spine notch');
    expect(first.printInstructions).toContain('punch');
    expect(first.printInstructions).toContain('Laurence Simon');
  });
});
