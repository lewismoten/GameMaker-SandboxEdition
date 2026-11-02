// Community proposals remain reviewable plain metadata with stable HTTPS destinations.
import { describe, expect, it } from 'vitest';
import { COMMUNITY_GAMES, parseCommunityGames } from '../src/community/catalog';

const entry = { id: 'my-game', title: 'My Game', author: 'A Maker', url: 'https://example.com/game/', summary: 'A game hosted by its maker.' };

describe('community catalog', () => {
  it('includes the maintainer-confirmed independent integration project', () => {
    const game = COMMUNITY_GAMES.find((game) => game.id === 'the-chez')!;
    expect(game.url).toBe('https://lewismoten.github.io/the-chez/');
    expect(game.archiveUrl).toBe('https://lewismoten.github.io/the-chez/stripe.zip');
    expect(game.title).toContain('THE\u00a0CHEZ');
    expect(Object.isFrozen(COMMUNITY_GAMES)).toBe(true);
    expect(Object.isFrozen(game)).toBe(true);
  });
  it('normalizes text and HTTPS URLs without interpreting markup', () => {
    const source = { ...entry, title: '  My Game  ', summary: '<b>A literal title</b>', sourceUrl: 'https://example.com:443/source' };
    expect(parseCommunityGames([source])[0]).toEqual({ ...source, title: 'My Game', sourceUrl: 'https://example.com/source' });
    expect(source.title).toBe('  My Game  ');
  });
  it('rejects duplicate IDs, misspelled fields, malformed text and unsafe URL schemes', () => {
    expect(() => parseCommunityGames([entry, entry])).toThrow(/unique/);
    expect(() => parseCommunityGames([{ ...entry, source: 'typo' }])).toThrow(/unknown field/);
    expect(() => parseCommunityGames([{ ...entry, id: 'My Game' }])).toThrow(/lowercase/);
    expect(() => parseCommunityGames([{ ...entry, author: '' }])).toThrow(/author/);
    expect(() => parseCommunityGames([{ ...entry, summary: 'x'.repeat(401) }])).toThrow(/summary/);
    for (const url of ['javascript:alert(1)', 'data:text/html,hello', '/relative', 'http://example.com/', 'https://user:password@example.com/'])
      expect(() => parseCommunityGames([{ ...entry, url }])).toThrow(/HTTPS/);
    expect(() => parseCommunityGames([{ ...entry, imageUrl: null }])).toThrow(/imageUrl/);
  });
});
