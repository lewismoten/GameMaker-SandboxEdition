// A game from the site's catalog plays and ships with its own DOS player look: an original
// game's games/<id>/player.json, the same { base, patches } record a project keeps in its
// companion (playerRecord.ts), which scripts/cdGames.ts carries on its catalog entry as `player`.
// Its Play, demos, walkthrough, downloads, the desk's copies and Transfer, and the editor (Look
// inside, Edit a copy) read it here. A catalog without the field plays the CD player's look.
import { loadGameList, type CatalogEntry } from '../project/files';
import { emptyCompanion, setSection, type Companion } from '../project/companion';
import { PLAYER_SECTION, playerRecord, recordPatches } from './playerRecord';
import type { PlayerPatches } from './patchRules';

/** A catalog entry as the site serves it: with an original game's player.json, when it has one. */
type WithPlayer = Pick<CatalogEntry, 'id'> & { player?: unknown };

/** The entry's valid DOS player patches (none for a game without a player.json). */
export function catalogPatches(entry: WithPlayer | undefined): PlayerPatches {
  return recordPatches(entry?.player);
}

const listed = async (id: string) => (await loadGameList().catch(() => [])).find((g) => g.id === id);

/** The patches of catalog game `id` (none when it isn't listed here). */
export async function catalogPatchesById(id: string): Promise<PlayerPatches> {
  return catalogPatches(await listed(id));
}

/** A companion holding only the entry's patches, for a project opened or copied from it; undefined when it has none. */
export function catalogCompanion(entry: WithPlayer | undefined, gam: string | null | undefined): Companion | undefined {
  const record = playerRecord(catalogPatches(entry));
  if (!record || !gam) return undefined;
  const c = emptyCompanion();
  setSection(c, gam, PLAYER_SECTION, record);
  return c;
}

/** catalogCompanion for catalog game `id`. */
export async function catalogCompanionById(id: string, gam: string): Promise<Companion | undefined> {
  return catalogCompanion(await listed(id), gam);
}
