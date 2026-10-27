// The tiles of one collection on the home page: its games (the Bard's under his collections,
// Gameware and Shareware under who made them, Imported by stars when sorted so), each group
// with a heading, or a few words when the collection is empty.
import { h } from '../core/ui';
import { byCollection } from '../../project/bizarre';
import { allNotes, ratingOf } from '../../imported/gameNotes';
import { groupByRating, ratingName, starsText } from '../../imported/ratings';
import { gameTile, type HomeGame } from './homeCards';
import type { Category } from './homeCategories';
import { byMaker } from './homeAuthors';
import { rateTile, ratingShown, type savedRatingFilter } from './homeRatings';
import { isByMaker, isOwn, type HomeLibrary } from './homeLibrary';

interface CardActions {
  /** Shows a game at the top. */
  choose: (game: HomeGame) => void;
  /** Shows a game at the top with its ⋯ More open. */
  more: (game: HomeGame) => void;
  /** Goes to another collection (the empty My games' Browse buttons). */
  browse(c: Category): void;
  newGame(): void;
}

export function libraryCards(lib: HomeLibrary, c: Category, ratingFilter: ReturnType<typeof savedRatingFilter>, on: CardActions): HTMLElement[] {
  const notes = allNotes();
  let cards: HTMLElement[];
  if (!isOwn(c) && lib.catalogError) cards = [h('p', { class: 'meta' }, lib.catalogError)];
  else {
    const tile = (g: HomeGame) => {
      const t = gameTile(g, { onSelect: on.choose, onMore: on.more });
      if (c === 'imported' && g.project) rateTile(t, notes[g.project.id]);
      return t;
    };
    // Imported: only the rating picked, and grouped by stars when sorted by them
    const rated = c === 'imported' ? lib.gamesOf(c).filter((g) => ratingShown(ratingFilter, ratingOf(g.project!.id, notes))) : [];
    // the Bard's games under his collections, in the flyer's order, and Gameware and
    // Shareware by who made them (homeAuthors.ts), packed into as few rows as they fit
    // (homeTilePack.ts), each tile telling its group
    const sections: { name: string; count?: number; games: { g: HomeGame }[] }[] =
      c === 'bizarre'
        ? byCollection(lib.gamesOf(c).map((g) => ({ id: g.entry?.id ?? '', g }))).map((sec) => ({
            ...sec,
            games: [...sec.games].sort((a, b) => a.g.title.localeCompare(b.g.title, undefined, { numeric: true, sensitivity: 'base' })),
          }))
        : isByMaker(c)
          ? byMaker(lib.gamesOf(c)).map((m) => ({ name: m.name, count: m.games.length, games: m.games.map((g) => ({ g })) }))
          : c === 'imported' && lib.sort === 'rating'
            ? groupByRating(rated, (g) => ratingOf(g.project!.id, notes)).map((grp) => ({
                name: grp.rating ? `${starsText(grp.rating)} ${ratingName(grp.rating)}` : 'Unrated',
                count: grp.items.length,
                games: grp.items.map((g) => ({ g })),
              }))
            : [];
    cards =
      sections.length > 1
        ? sections.flatMap((sec, n) => [
            h(
              'h3',
              { class: `lib-sub${sec.games.length === 1 ? ' lib-sub-one' : ''}`, id: `lib-sub-${n}`, dataset: { group: String(n) } },
              sec.name,
              sec.count ? h('span', { class: 'lib-sub-count' }, ` · ${sec.count} game${sec.count === 1 ? '' : 's'}`) : null,
            ),
            ...sec.games.map((x) => {
              const t = tile(x.g);
              t.dataset.group = String(n);
              t.querySelector('.tile-select')?.setAttribute('aria-describedby', `lib-sub-${n}`);
              return t;
            }),
          ])
        : (c === 'imported' ? rated : lib.gamesOf(c)).map(tile);
  }
  if (!cards.length) cards = [emptyCollection(lib, c, ratingFilter, on)];
  return cards;
}

/** What an empty collection says (My games: how to get one). */
function emptyCollection(lib: HomeLibrary, c: Category, ratingFilter: ReturnType<typeof savedRatingFilter>, on: CardActions): HTMLElement {
  return c === 'mine'
    ? h(
        'div',
        { class: 'lib-empty' },
        h('p', { class: 'lib-empty-title' }, 'No games here yet'),
        h('p', { class: 'meta' }, 'Start a new one, or edit a copy of a finished game to see how it was made.'),
        h(
          'div',
          { class: 'toolbar' },
          h('button', { class: 'primary', type: 'button', onclick: () => on.newGame() }, '+ Make a new game'),
          h('button', { type: 'button', onclick: () => on.browse('gameware') }, 'Browse Gameware'),
          h('button', { type: 'button', onclick: () => on.browse('sandbox') }, 'Browse Sandbox'),
        ),
      )
    : c === 'imported' && lib.own(c).length
      ? h(
          'p',
          { class: 'meta' },
          `No imported game is ${ratingFilter === 'unrated' ? 'unrated' : `rated ${ratingName(Number(ratingFilter) as 1)}`}. Pick All ratings under Show to see them all.`,
        )
      : c === 'imported'
        ? h(
            'div',
            { class: 'lib-empty' },
            h('p', { class: 'lib-empty-title' }, 'No imported games yet'),
            h(
              'p',
              { class: 'meta' },
              'A game someone sends you (a folder, its files, a .zip or a one-page .html export) is listed here when you drop it on the import tile or open it.',
            ),
          )
        : h('p', { class: 'meta' }, 'No games of this kind were bundled with this build.');
}
