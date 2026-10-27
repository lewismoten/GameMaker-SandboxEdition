// The home page's collections (its tabs) in the order they show: your own games, then this
// edition's (Sandbox, and Bizarre once it has enough games), then the CD's (Gameware,
// Shareware). The one opened first, the one remembered, and the featured game a collection
// shows when it is chosen (pickFeatured) are here too.
import type { GameKind } from './homeCards';
import type { IconName } from './homeIcons';

/** A collection: a kind of game, with your own games split into those made here and those imported. */
export type Category = GameKind | 'imported';

/** Each collection: `short` is the one line shown above its games, `lead` the whole of it (More, and the tab's tip). */
export const CATEGORIES: { id: Category; icon: IconName; name: string; short: string; lead: string }[] = [
  {
    id: 'mine',
    icon: 'edit',
    name: 'My games',
    short: 'Games you made or copied, kept in this browser.',
    lead: 'Games you made here or copied from the collections, kept in this browser. Download a .zip now and then to keep them safe.',
  },
  {
    id: 'imported',
    icon: 'inbox',
    name: 'Imported',
    short: 'Games brought in from folders, files, .zips or .html exports.',
    lead: 'Games brought in from a folder, files, a .zip or a one-page export, often made by someone else. Kept in this browser; ⋯ More moves one to My games.',
  },
  {
    id: 'sandbox',
    icon: 'star',
    name: 'Sandbox',
    short: 'New games in the original formats, so they play in DOS too.',
    lead: 'New games from Sandbox Software, made with Game-Maker in the original formats, so they also play in DOS. Play them, read their manuals, or edit a copy to see how they were made.',
  },
  {
    id: 'bizarre',
    icon: 'music',
    name: 'Bizarre',
    short: 'Heartfelt songs about all the wrong things, made into games.',
    lead: 'Big, heartfelt songs about all the wrong things (the goat nobody painted, the loaf nobody picked, a fly named Carl, the TV remote), made into games. The Bard of Bizarre is Lewis “Lewie” Moten III, with Doc Leo the hobo clown as his face: he dreams up each song, AI tools shape and record it, and you can play it, read its notice, or edit a copy (they’re MIT, except their voice clips: personal, non-commercial use only) to see how it was made.',
  },
  {
    id: 'gameware',
    icon: 'disk',
    name: 'Gameware',
    short: 'Free games that came with Game-Maker. Play or edit a copy.',
    lead: 'The free “gameware” that came with Game-Maker. Play them, or edit a copy to see how they were made and reuse their pictures, monsters and sounds in your own games.',
  },
  {
    id: 'shareware',
    icon: 'lock',
    name: 'Shareware',
    short: 'Other people’s games from the CD and BBSes, as released.',
    lead: 'Games other people made with Game-Maker, from the CD and the BBSes. Most are copyrighted shareware that can only be played here, exactly as released; a few are free to share. If you enjoy one, read its notice to see how the author asked to be registered or thanked.',
  },
];

/** The collection a first visit opens on. */
export const FIRST_CATEGORY: Category = 'sandbox';

export const CATEGORY_KEY = 'gm-home-category';

/** The collection the visitor picked last, if any. */
export function savedCategory(): Category | undefined {
  try {
    const c = localStorage.getItem(CATEGORY_KEY) as Category | null;
    return c && CATEGORIES.some((x) => x.id === c) ? c : undefined;
  } catch {
    return undefined;
  }
}

/**
 * A game to feature from `pool` (a collection's games), at random: one with a demo when
 * there are some, and not `shownKey` (the game shown now) while there is another to show.
 */
export function pickFeatured<T extends { key: string }>(
  pool: readonly T[],
  shownKey: string | undefined,
  hasDemo: (g: T) => boolean,
  random = Math.random,
): T | undefined {
  const fresh = (list: readonly T[]) => list.filter((g) => g.key !== shownKey);
  const withDemo = pool.filter(hasDemo);
  const choices = [fresh(withDemo), fresh(pool), pool].find((l) => l.length) ?? [];
  return choices[Math.floor(random() * choices.length)];
}
