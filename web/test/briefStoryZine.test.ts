// The one-sheet KEEP IT BRIEF! mini-zine: exact source stories and classic eight-page fold map.
import { describe, expect, it } from 'vitest';
import { WINGS, story } from '../../games/brief/src/stories';
import { BRIEF_STORY_ZINE_ID, BRIEF_STORY_ZINE_VOLUMES, CLASSIC_MINI_ZINE_CELLS, classicMiniZineReadingOrder } from '../src/manual/zine/briefStoryZine';

describe('KEEP IT BRIEF! one-sheet zines', () => {
  it('keeps every source story exactly once in numbered six-story volumes', () => {
    const source = WINGS.flatMap((wing) => wing.books.map(story)).sort((a, b) => a.n - b.n);
    const printed = BRIEF_STORY_ZINE_VOLUMES.flatMap((volume) => volume.stories);
    expect(printed).toHaveLength(source.length);
    expect(printed.map(({ n, title, text }) => ({ n, title, text }))).toEqual(source.map(({ n, title, text }) => ({ n, title, text })));
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

  it('carries the sheet cutting, folding, and retention instructions', () => {
    const first = BRIEF_STORY_ZINE_VOLUMES[0];
    expect(first.printInstructions).toContain('spine-notch');
    expect(first.printInstructions).toContain('punch');
    expect(first.printInstructions).toContain('Laurence Simon');
  });
});
