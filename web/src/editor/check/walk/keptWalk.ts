// What Make a walkthrough keeps, with no DOM: the walkthrough and how each scene went (the
// companion's "walkthrough" section of the .gam, editor-only, never in the game's files), the
// scenes of it to play again when it is made again (autoWalk's `reuse`), and, for a game open to
// look at only (a CD game, editor/core/readOnly.ts), a place in this browser apart from the
// game where its walkthrough and the person's own plays ("myPlays", mine.ts) stay after the
// page closes: localStorage, by the catalog id, with the game's size and checksum so a game
// that has changed since starts again.
import type { Project } from '../../core/project';
import type { CatalogEntry } from '../../../project/files';
import { emptyCompanion, getSection, setSection, type Companion } from '../../../project/companion';
import type { Walkthrough } from '../../../walkthrough/format';
import type { AutoWalk, Reused, SceneOutcome } from './autoWalk';
import type { Verified } from './verify';

/** What the companion keeps: the walkthrough and how each scene went. */
export interface SavedWalk {
  when: string;
  walk?: Walkthrough;
  won: boolean;
  verifiedWon?: boolean;
  stopped?: string;
  scenes: Omit<SceneOutcome, 'heat'>[];
}

export const WALK_SECTION = 'walkthrough';
/** The sections a look-only game keeps in this browser (Make a walkthrough's and the person's plays). */
const KEPT_SECTIONS = [WALK_SECTION, 'myPlays'];

/** A finished bot run, as kept. */
export function savedFrom(result: AutoWalk, verified: Verified | undefined, when = new Date()): SavedWalk {
  return {
    when: when.toISOString(),
    walk: result.walk,
    won: result.won,
    verifiedWon: verified?.won,
    stopped: result.stopped,
    scenes: result.scenes.map(({ heat: _h, ...s }) => s),
  };
}

/** The scenes the bot got through last time, in order, with their keys: what autoWalk plays again first. */
export function reuseFrom(saved: SavedWalk | undefined): Reused[] | undefined {
  const segments = saved?.walk?.segments;
  if (!segments) return undefined;
  const through = saved.scenes.filter((s) => s.strategy);
  if (through.length !== segments.length || through.some((s, i) => segments[i].scene !== s.scene)) return undefined;
  return through.map((s, i) => ({ scene: s.scene, keys: segments[i].keys, strategy: s.strategy!, paths: s.paths }));
}

/** How far a kept walkthrough got: the scenes played, and the scene it stopped in (none when it won). */
export function howFar(saved: SavedWalk): { through: number; stoppedIn?: Omit<SceneOutcome, 'heat'> } {
  const through = saved.scenes.filter((s) => s.strategy).length;
  return { through, stoppedIn: saved.won ? undefined : saved.scenes.find((s) => !s.strategy) };
}

type KeptEntry = Pick<CatalogEntry, 'id' | 'pack' | 'gamCrc' | 'bytes'>;
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface Kept {
  /** The game as it was (its pack, checksum and size): kept plays are for this game only. */
  sig: string;
  sections: Record<string, unknown>;
}

/** Backed up with My games (backup/inventory.ts). */
const keyOf = (id: string) => `gm-walk-kept-${id}`;
const sigOf = (e: KeptEntry) => [e.pack ?? '', e.gamCrc ?? '', e.bytes ?? ''].join('|');

function storage(): Store | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

/** A look-only game's kept sections, or none (none kept, or the game has changed since). */
export function keptFor(entry: KeptEntry, store = storage()): Record<string, unknown> | undefined {
  try {
    const text = store?.getItem(keyOf(entry.id));
    if (!text) return undefined;
    const kept = JSON.parse(text) as Kept;
    return kept.sig === sigOf(entry) && kept.sections && typeof kept.sections === 'object' ? kept.sections : undefined;
  } catch {
    return undefined;
  }
}

/** Keeps a look-only game's sections (all empty: forgets them); false when this browser refused. */
export function keepFor(entry: KeptEntry, sections: Record<string, unknown>, store = storage()): boolean {
  try {
    if (!store) return false;
    const some = Object.fromEntries(Object.entries(sections).filter(([, v]) => v !== undefined));
    if (!Object.keys(some).length) store.removeItem(keyOf(entry.id));
    else store.setItem(keyOf(entry.id), JSON.stringify({ sig: sigOf(entry), sections: some } satisfies Kept));
    return true;
  } catch {
    return false;
  }
}

/** Puts a look-only game's kept sections into a companion (a Look inside's, or Edit a copy's), under its .gam. */
export function withKept(companion: Companion | undefined, gam: string, entry: KeptEntry, store = storage()): Companion | undefined {
  const kept = keptFor(entry, store);
  if (!kept) return companion;
  const c = companion ?? emptyCompanion();
  for (const [section, value] of Object.entries(kept)) if (KEPT_SECTIONS.includes(section)) setSection(c, gam, section, value);
  return c;
}

/**
 * For a look-only project: starts it with what this browser kept for the game, and keeps its
 * walkthrough and plays there as they change. Returns whether keeping works here (false: they
 * last only until the page closes).
 */
export function keepLookOnly(project: Project, entry: KeptEntry, store = storage()): LookOnlyKept {
  project.companion = withKept(project.companion, project.gam, entry, store);
  let ok = !!store;
  const kept: LookOnlyKept = { entry, keeps: () => ok };
  lookOnly.set(project, kept);
  project.onExtrasChange((file, section) => {
    if (!KEPT_SECTIONS.includes(section) || !project.companion) return;
    if (file.toLowerCase() !== project.gam.toLowerCase()) return;
    const c = project.companion;
    ok = keepFor(entry, Object.fromEntries(KEPT_SECTIONS.map((s) => [s, getSection<unknown>(c, project.gam, s, undefined)])), store);
  });
  return kept;
}

interface LookOnlyKept {
  entry: KeptEntry;
  /** False when this browser refused to keep them (they last until the page closes). */
  keeps: () => boolean;
}

const lookOnly = new WeakMap<Project, LookOnlyKept>();

/** What keepLookOnly set up for a look-only project (Look inside, or the home page's), if it did. */
export const lookOnlyKept = (project: Project): LookOnlyKept | undefined => lookOnly.get(project);
