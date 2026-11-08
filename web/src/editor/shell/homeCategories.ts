// The home page's collections (its tabs) in the order they show: your own games, then this
// edition's (Starters and Sandbox, and Bizarre once it has enough games), then the CD's (Gameware,
// one CD tab). The one opened first, the one remembered, and the featured game a collection
// shows when it is chosen (pickFeatured) are here too.
import type { GameKind } from './homeCards';
import type { IconName } from './homeIcons';

/** A collection: a kind of game, with your own games split into those made here and those imported. */
export type Category = Exclude<GameKind, 'gameware' | 'shareware'> | 'imported' | 'cd';

/** Old addresses and saved choices from when Gameware and Shareware were tabs of their own. */
export const oldCategory = (id: string | null | undefined): string | null | undefined => (id === 'gameware' || id === 'shareware' ? 'cd' : id);

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
    id: 'starter',
    icon: 'manual',
    name: 'Starters',
    short: 'Small games that each show one idea. Play one, then edit a copy to start your own.',
    lead: 'Small games that each show one Game-Maker idea, with signs in the levels that say what you are looking at. Play one, then edit a copy: find the sign in the map editor, change a block and play your change.',
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
    id: 'special',
    icon: 'dice',
    name: 'Special',
    short: 'Here for a short while: games for today’s holiday or season. Play one and it stays.',
    lead: 'Limited-time games from Sandbox Software, each out only for its day, week or season (a holiday, a town event, a funny day on the calendar). Play one, look inside or edit a copy and it stays here after its time is up; the rest leave when their day passes, and new ones turn up. On the 1994 desk they arrive their own way: a floppy left on the desk, a file on The Sandbox BBS.',
  },
  {
    id: 'community',
    icon: 'link',
    name: 'Community',
    short: 'Games hosted by their creators. Play, download, or add yours.',
    lead: 'Games hosted on their creators’ websites. Open a game there, download its optional ZIP, or edit a copy. Add your own through a pull request using Add your game.',
  },
  {
    id: 'cd',
    icon: 'disk',
    name: 'CD',
    short: 'The Game-Maker CD: free gameware to play or edit, then other people’s shareware, by maker.',
    lead: 'What came on the Game-Maker CD. Gameware is free: play it, or edit a copy to see how it was made and reuse its pictures, monsters and sounds in your own games. Shareware is other people’s games from the CD and the BBSes: most are copyrighted and can only be played here, exactly as released; a few are free to share. If you enjoy one, read its notice to see how the author asked to be registered or thanked.',
  },
];

/** The collection a first visit opens on. */
export const FIRST_CATEGORY: Category = 'sandbox';

export const CATEGORY_KEY = 'gm-home-category';

/** The collection the visitor picked last, if any. */
export function savedCategory(): Category | undefined {
  try {
    const c = oldCategory(localStorage.getItem(CATEGORY_KEY)) as Category | null;
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
