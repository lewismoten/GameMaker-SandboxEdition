// What earns Scoot a stamp on this device's postcard, from what the web player, play.html, the
// desk and the DOS page already report (achievements/index.ts playAchievements): a public catalog
// game played to its ending stamps its title; any Starter played to its ending is the one Sample
// CD stamp; any graduation played to its ending is the one "Attended a graduation" stamp (never
// grades or honors). A secret game, a game of your own or one the catalog does not know gives the
// same plain mystery stamp as soon as it is played, keeping no id. Nothing here runs on a timer.
import { addStamp, type Stamp } from './courierStore';
import { isOldSecret } from '../project/secretGames';
import { isCeremony } from '../project/ceremonies';

/** Played: the first scene was entered. Won: the Game Won scene showed. */
export type StampEvent = 'played' | 'won';

/** A catalog entry, as much as the rules need. */
export interface Known {
  id: string;
  title?: string;
  series?: string;
  original?: unknown;
}

/** The stamp a game earns on `event`, or none. `saveId` is the player's ('game:<id>', 'project:<id>' or a bare id). */
export function stampFor(saveId: string | undefined, event: StampEvent, catalog: readonly Known[]): Stamp | undefined {
  const id = saveId?.startsWith('project:') ? undefined : saveId?.replace(/^game:/, '');
  const g = id && !isOldSecret(id) ? catalog.find((x) => x.id === id) : undefined;
  if (!g) return { kind: 'mystery' };
  if (event !== 'won') return undefined;
  if (isCeremony(g.id)) return { kind: 'graduation' };
  if (g.series === 'starter') return { kind: 'sample-cd' };
  return { kind: 'game', game: g.id };
}

/** The public catalog (secret games left out, revealed or not); empty when it cannot load. */
async function publicCatalog(): Promise<Known[]> {
  const { loadGameList } = await import('../project/files');
  const list = await loadGameList().catch(() => [] as Known[]);
  return list.filter((g) => !isOldSecret(g.id));
}

/** Stamps this device's postcard for a game played here (achievements/index.ts calls it). */
export async function earnStamp(saveId: string | undefined, event: StampEvent): Promise<boolean> {
  const catalog = await publicCatalog();
  // with no catalog (offline, a failed fetch) a catalog game can't be told from an unknown one: no stamp yet
  if (!catalog.length && saveId && !saveId.startsWith('project:')) return false;
  const s = stampFor(saveId, event, catalog);
  return s ? addStamp(s) : false;
}

/** A catalog game's title by id, for the card and SCOOT.EXE (a secret id has none). */
export async function catalogTitles(): Promise<(id: string) => string | undefined> {
  const titles = new Map((await publicCatalog()).map((g) => [g.id, g.title]));
  return (id) => titles.get(id);
}
