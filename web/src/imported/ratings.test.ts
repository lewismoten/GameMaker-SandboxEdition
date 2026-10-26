// Imported games grouped and filtered by rating, Unrated included, and picking the ones to
// remove by rating ("all the 1-star and unrated games").
import { describe, expect, it } from 'vitest';
import { filterRatings, groupByRating, isRatingFilter, ratingName, starsText, withRatings } from './ratings';
import type { Rating } from './gameNotes';
import { importedToRemove } from '../editor/shell/importBatch';

const games = [
  { id: 'a', r: 1 },
  { id: 'b', r: 0 },
  { id: 'c', r: 5 },
  { id: 'd', r: 1 },
  { id: 'e', r: 3 },
  { id: 'mine', r: 1 },
] as { id: string; r: Rating }[];
const rating = (g: { r: Rating }) => g.r;

describe('ratings', () => {
  it('say themselves in stars and words', () => {
    expect([starsText(3), starsText(0), ratingName(1), ratingName(4), ratingName(0)]).toEqual(['★★★☆☆', 'Unrated', '1 star', '4 stars', 'Unrated']);
  });

  it('group the games best first, Unrated last, leaving out empty groups', () => {
    expect(groupByRating(games, rating).map((g) => [g.rating, g.items.map((x) => x.id)])).toEqual([
      [5, ['c']],
      [3, ['e']],
      [1, ['a', 'd', 'mine']],
      [0, ['b']],
    ]);
  });

  it('filter to one rating, Unrated, or all', () => {
    expect(['all', 'unrated', '3', '6', 'x', 3].map(isRatingFilter)).toEqual([true, true, true, false, false, false]);
    expect(withRatings(games, rating, filterRatings('unrated')).map((g) => g.id)).toEqual(['b']);
    expect(withRatings(games, rating, filterRatings('5')).map((g) => g.id)).toEqual(['c']);
    expect(withRatings(games, rating, filterRatings('all'))).toHaveLength(games.length);
  });

  it('pick the imported games to remove by rating: all the 1-star and unrated ones', () => {
    const imported = importedToRemove(games, (id) => id !== 'mine');
    expect(withRatings(imported, rating, [1, 0]).map((g) => g.id)).toEqual(['a', 'b', 'd']);
  });
});
