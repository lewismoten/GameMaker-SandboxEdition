import { describe, expect, it } from 'vitest';
import { findGame, gamCandidates, listUrl, parseGameList } from './list';

const PAGE = 'https://example.com/old/player.html';
const LIST = 'https://example.com/old/games.json';

describe('parseGameList', () => {
  it('reads games, resolving folders against the list and filling in ids and titles', () => {
    const list = parseGameList(
      JSON.stringify({
        title: 'My old games',
        games: [
          { title: 'Nebula Patrol', folder: 'nebula', gam: 'NEBULA.GAM', author: 'Me', year: 1994 },
          { folder: 'Castle Quest/' },
          { id: 'x', title: 'Files', folder: 'sub/x/', files: ['X.GAM', 'X.MAP', '../secret', 'a/b'] },
        ],
      }),
      LIST,
    );
    expect(list.title).toBe('My old games');
    expect(list.games).toEqual([
      { id: 'nebula', title: 'Nebula Patrol', folder: 'https://example.com/old/nebula/', gam: 'NEBULA.GAM', author: 'Me', year: 1994 },
      { id: 'castle-quest', title: 'Castle Quest', folder: 'https://example.com/old/Castle%20Quest/' },
      { id: 'x', title: 'Files', folder: 'https://example.com/old/sub/x/', gam: 'X.GAM', files: ['X.GAM', 'X.MAP'] },
    ]);
  });

  it('takes a bare array, skips unusable entries and makes ids unique', () => {
    const list = parseGameList(
      JSON.stringify([
        { folder: 'a' },
        { folder: 'javascript:alert(1)' },
        { title: 'no folder' },
        5,
        null,
        { folder: 'b/a' },
        { folder: 'a', gam: 'evil/../x.gam' },
      ]),
      LIST,
    );
    expect(list.games.map((g) => [g.id, g.gam])).toEqual([
      ['a', undefined],
      ['a-2', undefined],
      ['a-3', undefined],
    ]);
  });

  it('rejects text that is not a list', () => {
    expect(() => parseGameList('not json', LIST)).toThrow(/not valid JSON/);
    expect(() => parseGameList('{"games": 3}', LIST)).toThrow(/no "games" array/);
  });
});

describe('findGame', () => {
  const list = parseGameList(JSON.stringify({ games: [{ id: 'nebula', folder: 'games/NEB/', title: 'Nebula' }] }), LIST);

  it('finds a listed game by id or by its folder name', () => {
    expect(findGame('nebula', list, PAGE)?.title).toBe('Nebula');
    expect(findGame('NEB', list, PAGE)?.id).toBe('nebula');
  });

  it('takes a folder or a .gam beside the page, on the same site only', () => {
    expect(findGame('castle', list, PAGE)).toEqual({ id: 'castle', title: 'castle', folder: 'https://example.com/old/castle/' });
    expect(findGame('more/CQ.GAM', undefined, PAGE)).toEqual({ id: 'cq', title: 'CQ.GAM', folder: 'https://example.com/old/more/', gam: 'CQ.GAM' });
    expect(findGame('https://elsewhere.example/x/', list, PAGE)).toBeUndefined();
    expect(findGame('  ', list, PAGE)).toBeUndefined();
  });
});

describe('gamCandidates and listUrl', () => {
  it('tries the named .gam, or the folder name in lower then upper case', () => {
    expect(gamCandidates({ id: 'a', title: 'A', folder: 'https://e.x/A/', gam: 'Q.GAM' })).toEqual(['Q.GAM']);
    expect(gamCandidates({ id: 'nebula', title: 'N', folder: 'https://e.x/Nebula/' })).toEqual(['nebula.gam', 'NEBULA.GAM']);
  });

  it('reads ?list= on the same site only, games.json otherwise', () => {
    expect(listUrl(null, PAGE)).toBe(LIST);
    expect(listUrl('more.json', PAGE)).toBe('https://example.com/old/more.json');
    expect(listUrl('https://evil.example/x.json', PAGE)).toBe(LIST);
  });
});
