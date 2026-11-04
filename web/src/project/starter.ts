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

/** The order the Starters are meant to be played in, easiest first (games/<id>); a starter not listed here goes after these, A to Z. */
export const STARTER_ORDER = ['first-steps', 'keys-and-doors', 'meet-the-monsters', 'room-to-room', 'coins-and-score', 'watch-your-step'];

/** The Starters in learning order (STARTER_ORDER), then any others A to Z by title. */
export function byStarterOrder<T extends { id: string; title: string }>(list: readonly T[]): T[] {
  const rank = (g: T) => {
    const i = STARTER_ORDER.indexOf(g.id);
    return i < 0 ? STARTER_ORDER.length : i;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
}
