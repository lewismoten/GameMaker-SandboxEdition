// One row of the known-games table (knownGames.json, built by scripts/knownGamesTable.ts), and
// the tags a game gets from it. Curated rows were tagged by looking at the game (view, genre,
// then up to three themes); the rest hold the deterministic tagger's guesses. No DOM.

export interface KnownGame {
  /** Tags: curated ones read view, genre, themes. */
  t: string[];
  /** Level scenes in the game. */
  l: number;
  /** Curated by eye; otherwise the tags are guesses. */
  c?: true;
  /** Whether the archive walk bot finished it, when it tried. */
  b?: boolean;
}

/** The view, genre and theme words curated rows use. */
export const VIEWS = ['side view', 'top-down', 'oblique', 'mixed'] as const;
export const GENRES = ['platformer', 'shooter', 'maze', 'puzzle', 'adventure', 'racing', 'flying', 'swimming', 'other'] as const;
export const THEMES = [
  'space',
  'fantasy',
  'science fiction',
  'winter',
  'underwater',
  'urban',
  'animals',
  'abstract',
  'castle',
  'town',
  'dungeon',
  'overworld',
] as const;

export interface GameTagInfo {
  tags: string[];
  /** Curated by eye ("Tags"); otherwise guesses ("Suggested tags"). */
  known: boolean;
  levels?: number;
  bot?: boolean;
}

/** A game's tags: the table's curated row, else its guesses, else the guesses `suggest` makes. */
export function tagInfo(row: KnownGame | undefined, suggest: () => string[]): GameTagInfo {
  if (row?.c) return { tags: row.t, known: true, levels: row.l, ...(row.b === undefined ? {} : { bot: row.b }) };
  return { tags: row ? row.t : suggest(), known: false };
}
