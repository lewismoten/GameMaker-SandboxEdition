// The Game-Maker Sample Disk: the Starters (project/starter.ts) as small games on one
// diskette, each in a folder with its dosName (games/<id>/about.json) (A:\FIRSTSTP, A:\KEYSDOOR...), as the Owner's
// Guide says. Never a secret game: only a catalog's Starters are put on it.
import type { CatalogEntry } from '../../project/files';
import { dosDir } from '../../project/dosDir';
import { byStarterOrder, isStarterGame } from '../../project/starter';

/** A folder on the Sample Disk. */
export interface SampleFolder {
  /** The 8.3 folder name, upper case. */
  dir: string;
  entry: CatalogEntry;
}

/** The name a Starter gets when its about.json has no dosName: its id's letters and digits (8 at most), or 6 and "~n" when that is taken. */
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
  const taken = new Set(starters.filter((e) => e.dosName).map((e) => dosDir(e)));
  return starters.map((entry) => ({ dir: entry.dosName ? dosDir(entry) : sampleDirName(entry.id, taken), entry }));
}
