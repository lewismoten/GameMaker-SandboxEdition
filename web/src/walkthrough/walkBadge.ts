// How much of a game a walkthrough covers, cheaply, for the home page's imported cards and
// their "Walkthrough %" sort. No DOM and no heavy imports: it reads only the small metadata a
// kept walkthrough carries (the companion's "walkthrough" section) or, from the dev server's
// local index (editor/widgets/devLocalWalk.ts), a row of scenes and scenes won.
import type { Companion } from '../project/companion';
import { getSection } from '../project/companion';

export interface WalkBadge {
  /** The walkthrough won the whole game. */
  complete: boolean;
  /** Scenes the walkthrough got through, and scenes it counted. */
  won: number;
  total: number;
  /** Dev only: a local file from the .for-lewis folder, not saved with the game. */
  local?: boolean;
}

/** Whole numbers 0 to 100 (a complete walkthrough is 100); -1 for none, so none sorts last. */
export const walkPercent = (b: WalkBadge | undefined): number => (!b ? -1 : b.complete ? 100 : b.total ? Math.min(99, Math.floor((b.won / b.total) * 100)) : 0);

/** What a card's icon says. */
export const walkLabel = (b: WalkBadge): string =>
  `${b.complete ? 'Recorded walkthrough finishes the game' : `Recorded walkthrough reaches ${b.won} of ${b.total} scene${b.total === 1 ? '' : 's'}`}${b.local ? ' (local file)' : ''}`;

interface KeptShape {
  won?: boolean;
  walk?: { timeline?: { frames?: unknown } };
  scenes?: { strategy?: unknown }[];
}

/** The walkthrough kept in a project's companion file, if it has any frames. */
export function keptBadge(companion: Companion | undefined, gam: string): WalkBadge | undefined {
  if (!companion) return undefined;
  const w = getSection<KeptShape | undefined>(companion, gam, 'walkthrough', undefined);
  if (!w?.walk?.timeline?.frames) return undefined;
  const scenes = w.scenes ?? [];
  const won = scenes.filter((s) => s.strategy).length;
  const total = Math.max(scenes.length, won, 1);
  return { complete: !!w.won, won: w.won ? total : won, total };
}

/** Ordering for the sort: complete first, then the larger share of scenes won, then none. */
export const byWalkPercent = (a: WalkBadge | undefined, b: WalkBadge | undefined): number => walkPercent(b) - walkPercent(a);
