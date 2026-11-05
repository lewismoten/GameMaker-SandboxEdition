// The Starters: small games from Sandbox Software that each show one Game-Maker idea, with
// sign blocks in the levels to say what it is (../games/<id>/about.json "series": "starter",
// made with games/kit/starter). They have a home tab of their own (Starters, before Sandbox)
// and do not count as Sandbox games (box counts, achievements, the cast, the magazine).

interface Listed {
  original?: unknown;
  series?: string;
}

/** One of the Starters: an original game marked "series": "starter". */
export const isStarterGame = (g: Listed): boolean => !!g.original && g.series === 'starter';

/** A game with a retail box on the desk's shelf (and its manual box, print-shop pieces, catalog page): its `original.box`, but never a Starter. The Starters live on the Sample CD (D:\\SAMPLES) and the Sample Disk, not on the shelf. */
export const hasRetailBox = (g: Listed & { id?: string }): boolean => !isStarterGame(g) && !!(g as { original?: { box?: unknown } }).original?.box;

/** The Starters' groups, in learning order, like the Bard's COLLECTIONS (bizarre.ts): a name, a line about it and the game ids in order. A group with no built game is hidden. Each group's title screens have their own look (games/kit/starter groupStyle). */
export const STARTER_GROUPS: { name: string; tag: string; games: string[] }[] = [
  {
    name: 'The Basics',
    tag: 'One idea at a time: moving, doors, monsters, rooms.',
    games: [
      'first-steps',
      'keys-and-doors',
      'meet-the-monsters',
      'room-to-room',
      'coins-and-score',
      'breakable-walls',
      'walk-the-ground',
      'watch-your-step',
      'things-that-grow',
    ],
  },
  {
    name: 'Game Feel',
    tag: 'How a game moves and pushes back.',
    games: [
      'power-up',
      'throw-it',
      'many-weapons',
      'health-and-hearts',
      'slippery-and-bouncy',
      'momentum',
      'gravity-on-gravity-off',
      'swim',
      'take-the-wheel',
      'gusts',
      'kit-moves',
      'choose-hero',
    ],
  },
  {
    name: 'Foes and Bosses',
    tag: 'Foes that think, and ones that take a few hits.',
    games: ['boss-hits', 'boss-phases', 'who-wins', 'short-lived', 'follower', 'searchlight', 'flock', 'scripted'],
  },
  {
    name: 'Telling a Story',
    tag: 'Words, pictures and sound.',
    games: ['say-something', 'pictures-and-cartoons', 'sounds-and-music', 'day-night', 'same-house', 'popups'],
  },
  {
    name: 'Putting It Together',
    tag: 'Timing, switches and a whole small game.',
    games: ['beat-the-clock', 'countdown', 'warning-first', 'switches', 'one-more-try', 'your-first-game'],
  },
  { name: 'Wiring and Puzzles', tag: 'Counters that think.', games: ['three-tokens', 'and-gate', 'secret-doors'] },
  { name: 'Bigger Worlds', tag: 'More than one screen.', games: ['scroll', 'many-rooms', 'overhead', 'blocks-budget'] },
  { name: 'Showcase Tricks', tag: 'How the big games do their big moments.', games: ['dialog', 'parallax', 'horizon', 'beltway'] },
];

/** The order the Starters are meant to be played in, easiest first: the groups' games in order (games/<id>); a starter not listed goes after these, A to Z. */
export const STARTER_ORDER: string[] = STARTER_GROUPS.flatMap((g) => g.games);

/** The Starters sorted into their groups (in the groups' order, each in learning order); a starter in no group goes last under `More Starters`. Groups with no game are left out. */
export function byStarterGroup<T extends { id: string; title: string }>(list: readonly T[]): { name: string; tag?: string; games: T[] }[] {
  const filed = new Set(STARTER_ORDER);
  const out: { name: string; tag?: string; games: T[] }[] = STARTER_GROUPS.map((g) => ({
    name: g.name,
    tag: g.tag,
    games: byStarterOrder(list.filter((x) => g.games.includes(x.id))),
  }));
  out.push({ name: 'More Starters', games: byStarterOrder(list.filter((x) => !filed.has(x.id))) });
  return out.filter((g) => g.games.length);
}

/** The group a Starter is in, or undefined. */
export const starterGroupOf = (id: string): string | undefined => STARTER_GROUPS.find((g) => g.games.includes(id))?.name;

/** The Starters in learning order (STARTER_ORDER), then any others A to Z by title. */
export function byStarterOrder<T extends { id: string; title: string }>(list: readonly T[]): T[] {
  const rank = (g: T) => {
    const i = STARTER_ORDER.indexOf(g.id);
    return i < 0 ? STARTER_ORDER.length : i;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
}
