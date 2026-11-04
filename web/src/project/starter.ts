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
