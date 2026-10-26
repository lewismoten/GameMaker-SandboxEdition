// The Imported list's ratings on the home page (home.ts): each tile's stars (and its note,
// found by the search), the "Show" picker that narrows the list to one rating or Unrated,
// remembered in this browser, and the rating and note of the imported game shown in the panel
// at the top (homeShowcase.ts).
import '../../imported/imported.css';
import { clear, h } from '../core/ui';
import { noteOf, setNote, type GameNote } from '../../imported/gameNotes';
import { ratingStars } from '../../imported/ratingStars';
import { filterRatings, isRatingFilter, ratingName, RATINGS, starsText, type RatingFilter } from '../../imported/ratings';

const FILTER_KEY = 'gm-imported-rating-filter';

export function savedRatingFilter(): RatingFilter {
  try {
    const v = localStorage.getItem(FILTER_KEY);
    return isRatingFilter(v) ? v : 'all';
  } catch {
    return 'all';
  }
}

/** The "Show" picker; `onChange` hears the new filter, already remembered. */
export function ratingFilterBox(now: RatingFilter, onChange: (f: RatingFilter) => void): HTMLLabelElement {
  return h(
    'label',
    { class: 'lib-sort lib-rating' },
    'Show ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          const f = (e.target as HTMLSelectElement).value as RatingFilter;
          try {
            localStorage.setItem(FILTER_KEY, f);
          } catch {
            /* not remembered */
          }
          onChange(f);
        },
      },
      h('option', { value: 'all', selected: now === 'all' }, 'All ratings'),
      ...RATINGS.map((r) => {
        const v = (r ? String(r) : 'unrated') as RatingFilter;
        return h('option', { value: v, selected: now === v }, r ? `${starsText(r)} ${ratingName(r)}` : 'Unrated');
      }),
    ),
  );
}

/** Whether a game with this rating shows under the filter. */
export const ratingShown = (f: RatingFilter, rating: number): boolean => filterRatings(f).includes(rating as never);

/** Puts an imported game's stars on its tile, and its note among the words the search finds. */
export function rateTile(tile: HTMLElement, note: GameNote | undefined): void {
  if (note?.note) tile.dataset.search = `${tile.dataset.search ?? ''} ${note.note.toLowerCase()}`;
  if (!note?.rating) return;
  tile
    .querySelector('.tile-select')
    ?.append(
      h('span', { class: 'tile-stars', 'aria-hidden': 'true' }, starsText(note.rating)),
      h('span', { class: 'sr-only' }, `, rated ${ratingName(note.rating)}`),
    );
}

/** The panel's rating (set here, saved at once) and note (with Note… to edit it), filled into `el`. */
export function fillRating(el: HTMLElement, game: { id: string; name: string }): void {
  const n = noteOf(game.id);
  clear(
    el,
    h('span', { class: 'sc-rate-label', 'aria-hidden': 'true' }, 'Your rating'),
    ratingStars(n.rating ?? 0, (rating) => setNote(game.id, { rating }), `Your rating of ${game.name}`),
    h(
      'button',
      {
        type: 'button',
        class: 'sc-another',
        onclick: () =>
          void import('../../imported/noteDialog').then(async (m) => {
            if (await m.editGameNote(game)) fillRating(el, game);
          }),
      },
      n.note ? 'Edit note…' : 'Add a note…',
    ),
    n.note ? h('p', { class: 'sc-note' }, n.note) : null,
  );
}
