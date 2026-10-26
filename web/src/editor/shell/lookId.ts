// The id a finished game opened to look inside (released.ts) has in place of a project's:
// look:<catalog id>, so its address is #/p/look:<id>/<file> and the editors' links and
// settings work as they do for a game of yours. Small, so main.ts can read it.
const LOOK = 'look:';

/** The id for looking inside a catalog game. */
export const lookId = (catalogId: string): string => `${LOOK}${catalogId}`;

/** The catalog game a look-inside id names, or undefined for a project of yours. */
export const lookedAt = (id: string): string | undefined => (id.startsWith(LOOK) ? id.slice(LOOK.length) : undefined);
