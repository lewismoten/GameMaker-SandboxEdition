// Which walkthrough a game already has, with no DOM: the one made here (kept in the project's
// companion file, or in this browser for a look-only game, or just made this session) is the
// person's own and comes first; else the game's shipped one (a catalog game's walkthrough.json).
// Either way "Make a walkthrough" opens the player, not the making dialog (walkDialog.ts).
import type { SavedWalk } from '../check/walk/keptWalk';
import type { CatalogEntry } from '../../project/files';

export type WalkSource = 'kept' | 'shipped';

export function walkSource(saved: SavedWalk | undefined, shipped: CatalogEntry | undefined): WalkSource | undefined {
  if (saved?.walk?.timeline.frames) return 'kept';
  return shipped?.walkthrough ? 'shipped' : undefined;
}
