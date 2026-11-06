// A game from the site's catalog plays and ships with its own DOS player look: an original
// game's games/<id>/player.json, the same { base, patches } record a project keeps in its
// companion (playerRecord.ts), which scripts/cdGames.ts carries on its catalog entry as `player`.
// Its Play, demos, walkthrough, downloads, the desk's copies and Transfer, and the editor (Look
// inside, Edit a copy) read it here. A catalog without the field plays the CD player's look.
import { loadGameList, withDetails, type CatalogEntry } from '../project/files';
import { emptyCompanion, isEmptyCompanion, setSection, type Companion } from '../project/companion';
import { putControls } from '../editor/core/gameControls';
import { PLAYER_SECTION, playerRecord, recordPatches } from './playerRecord';
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';

/** A catalog entry: with an original game's player.json, when it has one. */
type WithPlayer = Pick<CatalogEntry, 'id' | 'player'> & Partial<Pick<CatalogEntry, 'controls'>>;

/** The entry's valid DOS player patches (none for a game without a player.json). */
export function catalogPatches(entry: WithPlayer | undefined): PlayerPatches {
  return recordPatches(entry?.player);
}

// with its details: a Starter's player look and controls are in games/details/<id>.json, not in the list
const listed = async (id: string) => {
  const entry = (await loadGameList().catch(() => [])).find((g) => g.id === id);
  return entry && (await withDetails(entry).catch(() => entry));
};

/** The patches of catalog game `id` (none when it isn't listed here). */
export async function catalogPatchesById(id: string): Promise<PlayerPatches> {
  return catalogPatches(await listed(id));
}

/** A companion holding only the entry's patches and controls, for a project opened or copied from it; undefined when it has none. */
export function catalogCompanion(entry: WithPlayer | undefined, gam: string | null | undefined): Companion | undefined {
  const record = playerRecord(catalogPatches(entry));
  if (!gam || (!record && !entry?.controls)) return undefined;
  const c = emptyCompanion();
  if (record) setSection(c, gam, PLAYER_SECTION, record);
  // …and what its keys, buttons, counters and sounds mean (controls.json), for Overview > Controls
  if (entry?.controls) putControls(c, gam, entry.controls);
  return isEmptyCompanion(c) ? undefined : c;
}

/** catalogCompanion for an entry from the list, once its details (a Starter's player look and controls) are in. */
export async function catalogCompanionOf(entry: CatalogEntry | undefined, gam: string | null | undefined): Promise<Companion | undefined> {
  return catalogCompanion(entry && (await withDetails(entry).catch(() => entry)), gam);
}

/** catalogCompanion for catalog game `id`. */
export async function catalogCompanionById(id: string, gam: string): Promise<Companion | undefined> {
  return catalogCompanion(await listed(id), gam);
}
