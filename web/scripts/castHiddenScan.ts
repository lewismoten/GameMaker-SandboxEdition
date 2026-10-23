// Node only (scripts/castHidden.ts and the cast test): which game hides each hidden thing, read
// from the games' about.json ("easterEgg", "tinHeart"), without the secret games.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The hidden things the about.json files place, by cast member id. */
export const HIDDEN = ['easterEgg', 'tinHeart'] as const;

export type Hidden = Record<(typeof HIDDEN)[number], [game: string, map: string][]>;

export function hiddenPlacements(gamesDir: string): Hidden {
  const out = Object.fromEntries(HIDDEN.map((k) => [k, []])) as unknown as Hidden;
  for (const id of readdirSync(gamesDir).sort()) {
    const file = join(gamesDir, id, 'about.json');
    if (!existsSync(file) || !existsSync(join(gamesDir, id, 'disk'))) continue;
    const about = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (about.secret === true) continue;
    for (const k of HIDDEN) {
      const at = about[k] as { map?: string } | undefined;
      if (at?.map) out[k].push([id.toLowerCase(), at.map.toLowerCase()]);
    }
  }
  return out;
}
