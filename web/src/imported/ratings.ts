// Imported games by their star rating: the words and stars for one, the groups the Imported
// list shows (5 stars first, Unrated last), and narrowing a list to some ratings (to show
// them, or to remove them). No DOM.
import type { Rating } from './gameNotes';

/** Best first, Unrated last: the order of the groups. */
export const RATINGS: readonly Rating[] = [5, 4, 3, 2, 1, 0];

/** "★★★☆☆", or "Unrated". */
export const starsText = (r: Rating): string => (r ? '★'.repeat(r) + '☆'.repeat(5 - r) : 'Unrated');

/** "3 stars", "1 star", "Unrated". */
export const ratingName = (r: Rating): string => (r ? `${r} ${r === 1 ? 'star' : 'stars'}` : 'Unrated');

/** The items in groups by rating, best first and Unrated last; empty groups left out. */
export function groupByRating<P>(items: P[], ratingOf: (p: P) => Rating): { rating: Rating; items: P[] }[] {
  return RATINGS.map((rating) => ({ rating, items: items.filter((p) => ratingOf(p) === rating) })).filter((g) => g.items.length);
}

/** The items with one of these ratings (0: Unrated). */
export function withRatings<P>(items: P[], ratingOf: (p: P) => Rating, ratings: Iterable<Rating>): P[] {
  const want = new Set(ratings);
  return items.filter((p) => want.has(ratingOf(p)));
}

/** A filter's value in the Imported list's picker and the address: "all", "unrated" or "1"–"5". */
export type RatingFilter = 'all' | 'unrated' | '1' | '2' | '3' | '4' | '5';

export function isRatingFilter(v: unknown): v is RatingFilter {
  return typeof v === 'string' && /^(all|unrated|[1-5])$/.test(v);
}

/** The ratings a filter keeps. */
export const filterRatings = (f: RatingFilter): Rating[] => (f === 'all' ? [...RATINGS] : f === 'unrated' ? [0] : [Number(f) as Rating]);
