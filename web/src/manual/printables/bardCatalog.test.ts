import { describe, expect, it } from 'vitest';
import { BARD_CREDIT, byCollection, flyerBlurb } from './bardCatalog';

describe('The Bard of Bizarre flyer', () => {
  it('tells the story without the credit the site adds after it', () => {
    expect(flyerBlurb('You are the goat nobody painted. Shareware from The Sofa BBS, based on the song (recording made with Riffusion).')).toBe('You are the goat nobody painted.');
    expect(flyerBlurb('Just a story.')).toBe('Just a story.');
    expect(flyerBlurb(undefined)).toBe('');
  });

  it('credits the songs and pictures in the site credits’ words', async () => {
    const { readFileSync } = await import('node:fs');
    const credits = readFileSync(new URL('../webManual.ts', import.meta.url), 'utf8').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    expect(credits).toContain(BARD_CREDIT);
  });

  it('sorts the games into the Bard’s collections, with any not filed yet last', () => {
    const got = byCollection([{ id: 'remote' }, { id: 'newsong' }, { id: 'goat' }, { id: 'carl' }]);
    expect(got.map((c) => [c.name, c.games.map((g) => g.id)])).toEqual([
      ['Bizarre Gospels', ['goat']],
      ['Mundane Epics', ['carl', 'remote']],
      ['More song-games', ['newsong']],
    ]);
  });
});
