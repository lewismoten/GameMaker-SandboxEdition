// Home filter controls, search state and address helpers.
import { h } from '../core/ui';
import { homeLibrary, SORT_KEY, type MySort } from './homeLibrary';
import { CATEGORIES, FIRST_CATEGORY, savedCategory, type Category } from './homeCategories';
import { ratingFilterBox, savedRatingFilter } from './homeRatings';
import { loadTags, tagFilterBox } from './homeTags';
import { levelFilterBox, savedLevel } from './homeLevel';
import { doneFilterBox, savedDoneFilter } from './homeDone';
import { currentRoute, formatHash, setHashParams, type ParamValue } from '../../urlState';

/** The game named in the address (#/game/<key>), if any. */
export const hashKey = () => {
  const { path } = currentRoute();
  return path[0] === 'game' ? (path[1] ?? '') : '';
};

/** Still on the home page (#/ or #/game/…): a late change must not touch another page's address. */
const onHome = () => [undefined, 'game'].includes(currentRoute().path[0]);

/** Keeps the home page's choices (collection, search) in the address, as #/…?tab=…&q=…. */
export const keep = (changes: Record<string, ParamValue>) => onHome() && setHashParams(changes);

/** Shows `path` (a game, or none) in the address, keeping the settings. */
export function showPath(path: string[]): void {
  if (!onHome()) return;
  const { params } = currentRoute();
  const next = formatHash(path, params);
  if (next !== location.hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${next}`);
}

export function homeFilters(
  lib: ReturnType<typeof homeLibrary>,
  search: HTMLInputElement,
  tiles: HTMLElement,
  {
    select,
    atEnd,
    announce,
    pack,
  }: {
    select: (c: Category, picked?: boolean) => Promise<void>;
    atEnd: (f: () => void) => void;
    announce: (text: string) => void;
    pack: () => void;
  },
) {
  const sortBox = h(
    'label',
    { class: 'lib-sort' },
    'Sort by ',
    h(
      'select',
      {
        onchange: (e: Event) => {
          lib.sort = (e.target as HTMLSelectElement).value as MySort;
          try {
            localStorage.setItem(SORT_KEY, lib.sort);
          } catch {
            /* not remembered */
          }
          void select(current);
        },
      },
      h('option', { value: 'edited', selected: lib.sort === 'edited' }, 'Last edited'),
      h('option', { value: 'name', selected: lib.sort === 'name' }, 'Name'),
      h('option', { value: 'rating', selected: lib.sort === 'rating' }, 'Rating (Imported)'),
      h('option', { value: 'walk', selected: lib.sort === 'walk' }, 'Walkthrough % (Imported)'),
    ),
  );
  // Imported narrowed to one rating, or Unrated (homeRatings.ts)
  let ratingFilter = savedRatingFilter();
  const ratingBox = ratingFilterBox(ratingFilter, (f) => {
    ratingFilter = f;
    void select(current);
  });
  const tagBox = tagFilterBox(() => void select(current));
  // tags are worked out after the list is up, then the Imported list is drawn again
  const readTags = () =>
    void loadTags(lib.projects.filter((p) => lib.own('imported').includes(p))).then(() => {
      if (current === 'imported') void select(current);
    });
  // Starters narrowed to the ones not played to the ending yet, or the ones that were (homeDone.ts)
  let doneFilter = savedDoneFilter();
  const doneBox = doneFilterBox(doneFilter, (f) => {
    doneFilter = f;
    void select(current);
  });
  let level = savedLevel();
  const levelBox = levelFilterBox(level, (n) => {
    level = n;
    void select(current);
  });
  // select() shows the ones the collection uses; until the tabs are drawn they stay out of the row, so it doesn't wrap and then shrink (a layout shift)
  for (const box of [sortBox, ratingBox, tagBox, doneBox, levelBox]) box.hidden = true;
  let current: Category = savedCategory() ?? FIRST_CATEGORY;

  // games found by words inside them (file names, text screens, the blurb…), with where: they join as the background read goes
  let deepHits = new Map<string, string>();
  // loaded with the first focus of the search box, so the page's first load carries none of it
  type Deep = ReturnType<Awaited<typeof import('./homeDeepSearch')>['homeDeepSearch']>;
  let deepNow: Deep | undefined;
  const deep = {
    focus: () =>
      void import('./homeDeepSearch').then((m) => {
        deepNow ??= m.homeDeepSearch({
          games: () => lib.shownCats().flatMap((c) => lib.gamesOf(c.id)),
          onMore: () => filterTiles(true),
        });
        return deepNow.focus();
      }),
    find: (q: string) => deepNow?.find(q) ?? new Map<string, string>(),
    stop: () => deepNow?.stop(),
  };
  atEnd(() => deep.stop());
  let lastShown = 0;
  let countTimer: ReturnType<typeof setTimeout> | undefined;

  const filterTiles = (fromDeep = false) => {
    const q = search.value.trim().toLowerCase();
    deepHits = deep.find(q);
    let shown = 0;
    for (const t of tiles.querySelectorAll<HTMLElement>('.card:not(.lib-drop-tile)')) {
      const byName = !q || (t.dataset.search ?? '').includes(q);
      const found = !byName ? deepHits.get(t.dataset.key ?? '') : undefined;
      const hit = byName || !!found;
      t.hidden = !hit;
      const hint = t.querySelector('.tile-hint');
      if (found) {
        if (hint) hint.textContent = found;
        else t.querySelector('.tile-select')?.append(h('span', { class: 'tile-hint meta' }, found));
      } else hint?.remove();
      if (hit) shown++;
    }
    // a screen reader hears when the background read added games to the list
    if (fromDeep && shown > lastShown && q) announce(`${shown} ${shown === 1 ? 'game matches' : 'games match'} “${search.value.trim()}”`);
    lastShown = shown;
    // typing says how many games match, once the typing pauses (the background read speaks for itself above)
    clearTimeout(countTimer);
    if (!fromDeep && q && shown)
      countTimer = setTimeout(() => announce(`${shown} ${shown === 1 ? 'game matches' : 'games match'} “${search.value.trim()}”`), 800);
    // a collection's heading only while one of its games shows
    for (const sub of tiles.querySelectorAll<HTMLElement>('.lib-sub')) {
      let any = false;
      for (let e = sub.nextElementSibling as HTMLElement | null; e && !e.classList.contains('lib-sub'); e = e.nextElementSibling as HTMLElement | null)
        any ||= e.classList.contains('card') && !e.hidden;
      sub.hidden = !any;
    }
    tiles.querySelector('.lib-none')?.remove();
    pack();
    if (!q || shown) return;
    // nothing here: point to the collections that have it
    const elsewhere = lib
      .shownCats()
      .filter((c) => c.id !== current)
      .map((c) => ({ c, n: lib.gamesOf(c.id).filter((g) => g.search.includes(q) || deepHits.has(g.key)).length }))
      .filter((x) => x.n);
    tiles.append(
      h(
        'div',
        { class: 'meta lib-none', role: 'status' },
        `No game in ${CATEGORIES.find((c) => c.id === current)!.name} matches “${search.value.trim()}”.`,
        ...elsewhere.map(({ c, n }) =>
          h(
            'button',
            { type: 'button', class: 'lib-elsewhere', onclick: () => void select(c.id, true).then(() => document.getElementById(`lib-tab-${c.id}`)?.focus()) },
            `${c.name} has ${n} →`,
          ),
        ),
      ),
    );
  };

  return {
    sortBox,
    ratingBox,
    tagBox,
    doneBox,
    levelBox,
    readTags,
    deep,
    filterTiles,
    get current() {
      return current;
    },
    set current(c: Category) {
      current = c;
    },
    get ratingFilter() {
      return ratingFilter;
    },
    get doneFilter() {
      return doneFilter;
    },
    get level() {
      return level;
    },
  };
}
