// Where a project keeps its DOS player choices: the .gam's "dosPlayer" section of the companion
// file (project/companion.ts), as { base: 'xferplay-3.00', patches: { id: value } }. DOS, native
// and web-page exports never carry the companion; the DOS export writes the patches into its copy
// of XFERPLAY.EXE instead, and the web player reads them through RunOptions.player.
import { getSection, type Companion } from '../project/companion';
import { cleanPatches, type PlayerPatches } from './patchRules';

export const PLAYER_SECTION = 'dosPlayer';
const BASE = 'xferplay-3.00';

export interface PlayerRecord {
  base: typeof BASE;
  patches: PlayerPatches;
}

/** The section's value for these patches; undefined (remove the section) when there are none. */
export function playerRecord(patches: PlayerPatches): PlayerRecord | undefined {
  const clean = cleanPatches(patches);
  return Object.keys(clean).length ? { base: BASE, patches: clean } : undefined;
}

/** The valid patches a section holds (none for another base or a damaged record). */
export function recordPatches(record: unknown): PlayerPatches {
  const r = record as Partial<PlayerRecord> | undefined;
  if (!r || r.base !== BASE || !r.patches || typeof r.patches !== 'object') return {};
  return cleanPatches(r.patches);
}

/** A project's DOS player patches, from its companion. */
export function companionPatches(c: Companion | undefined, gam: string): PlayerPatches {
  return c ? recordPatches(getSection(c, gam, PLAYER_SECTION, undefined)) : {};
}
