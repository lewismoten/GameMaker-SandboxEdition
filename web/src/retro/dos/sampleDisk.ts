// The Game-Maker Sample Disk: the Starters (project/starter.ts) as small games on one
// diskette, each in a folder with a DOS name (A:\FIRSTSTP, A:\KEYSDOOR...), as the Owner's
// Guide says. Never a secret game: only a catalog's Starters are put on it.
import type { CatalogEntry } from '../../project/files';
import { byStarterOrder, isStarterGame } from '../../project/starter';

/**
 * The 8.3 folder for each Starter. A Starter added later gets a name made from its id
 * (sampleDirName); a DOS folder name has at most 8 characters, so pick one here when the
 * id is long or two would cut to the same letters.
 */
export const SAMPLE_DIRS: Record<string, string> = {
  'first-steps': 'FIRSTSTP',
  'keys-and-doors': 'KEYSDOOR',
  'meet-the-monsters': 'MONSTERS',
  'room-to-room': 'ROOMS',
  'coins-and-score': 'COINS',
  'watch-your-step': 'HAZARDS',
};

/** A folder on the Sample Disk. */
export interface SampleFolder {
  /** The 8.3 folder name, upper case. */
  dir: string;
  entry: CatalogEntry;
}

/** The name a Starter gets when SAMPLE_DIRS has none: its id's letters and digits (8 at most), or 6 and "~n" when that is taken. */
function sampleDirName(id: string, taken: Set<string>): string {
  const base = id.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'GAME';
  let name = base.slice(0, 8);
  for (let n = 1; taken.has(name) || base.length > 8; n++) {
    name = `${base.slice(0, 6)}~${n}`;
    if (!taken.has(name)) break;
  }
  taken.add(name);
  return name;
}

/** The Starters of a catalog in learning order, each with its folder name (all different). */
export function sampleFolders(catalog: readonly CatalogEntry[]): SampleFolder[] {
  const starters = byStarterOrder(catalog.filter((g) => isStarterGame(g) && !!g.gam));
  const taken = new Set(Object.values(SAMPLE_DIRS));
  return starters.map((entry) => ({ dir: SAMPLE_DIRS[entry.id] ?? sampleDirName(entry.id, taken), entry }));
}
