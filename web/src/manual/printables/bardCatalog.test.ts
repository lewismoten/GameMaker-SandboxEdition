// The Bard of Bizarre flyer: its story, its credits naming the Credits page's tools, and the games
// sorted into collections.
import { describe, expect, it } from 'vitest';
import { BARD_CREDIT, byCollection, flyerBlurb } from './bardCatalog';

describe('The Bard of Bizarre flyer', () => {
  it('tells the story without the credit the site adds after it', () => {
    expect(flyerBlurb('You are the goat nobody painted. Shareware from The Sofa BBS, based on the song (recording made with Riffusion).')).toBe(
      'You are the goat nobody painted.',
    );
    expect(flyerBlurb('Just a story.')).toBe('Just a story.');
    expect(flyerBlurb(undefined)).toBe('');
  });

  it('credits the songs and pictures with the tools the Credits page names', () => {
    // the Credits page's Bard table (credits/bardCredits.ts) names each of these
    for (const name of ['ChatGPT', 'Riffusion', 'Producer.ai', 'Google Flow Music', 'Claude Opus 5.5', 'DeepAI', 'non-commercial'])
      expect(BARD_CREDIT).toContain(name);
  });

  it('sorts the games into the Bard’s collections, with any not filed yet last', () => {
    const got = byCollection([{ id: 'remote' }, { id: 'newsong' }, { id: 'tickle' }, { id: 'goat' }, { id: 'carl' }]);
    expect(got.map((c) => [c.name, c.games.map((g) => g.id)])).toEqual([
      ['Bizarre Gospels', ['goat']],
      ['Mundane Epics', ['carl', 'remote']],
      ['Villain Anthems', ['tickle']],
      ['More song-games', ['newsong']],
    ]);
  });
});
