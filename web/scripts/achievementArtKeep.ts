// How achievementArt.ts updates src/achievements/blockArt.json without ever touching a badge it did not make.
//
// The generator marks every entry it writes with `"generator": "scripts/achievementArt.ts"`. On a run it may
// create a badge that is missing, refresh one that carries the mark, and drop a marked one whose pick was removed.
// Any entry WITHOUT the mark is someone else's work (a badge drawn by hand, pasted in, or of unknown origin) and is
// copied through unchanged, byte for byte, even when a pick names the same achievement; each such skip is logged.
// Badges on HAND_DRAWN are protected on top of that: no option, `--adopt` included, will replace them.
//
// `--adopt <id>` (achievementArt.ts) is the one deliberate way to hand an unmarked entry to the generator: it
// replaces that entry with the pick's block and marks it. It refuses ids on HAND_DRAWN and ids with no pick.
import { renameSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

/** The mark the generator writes into each entry it made; nothing else may write it. */
export const GENERATOR = 'scripts/achievementArt.ts';

/**
 * Badges drawn by hand for the badge (not cut from a game), which the generator must never replace, even with
 * `--adopt`. Add an id here whenever a hand-drawn badge is added to blockArt.json.
 */
export const HAND_DRAWN: readonly string[] = ['play-starters', 'finish-starters', 'learn-lesson'];

export interface Badge {
  image: string;
  game: string;
  set: string;
  block: string;
  generator?: string;
}
/** A badge as the generator makes it, before the mark is added. */
export type MadeBadge = Omit<Badge, 'generator'>;
export interface BadgeFile {
  notice: string;
  badges: Record<string, Badge>;
}

export interface MergeOptions {
  /** Unmarked entries to replace with their pick (never one on the hand-drawn list). */
  adopt?: readonly string[];
  /** Defaults to HAND_DRAWN; tests pass their own. */
  handDrawn?: readonly string[];
}
export interface MergeResult {
  badges: Record<string, Badge>;
  created: string[];
  refreshed: string[];
  unchanged: string[];
  adopted: string[];
  removed: string[];
  /** Existing entries copied through untouched (hand-drawn or unmarked). */
  kept: string[];
  log: string[];
}

export const isGenerated = (b: Badge | undefined): boolean => b?.generator === GENERATOR;
const pngBytes = (image: string): string => Buffer.from(image.slice(image.indexOf(',') + 1), 'base64').toString('hex');

/**
 * Merges freshly made badges into the existing ones. Unmarked and hand-drawn entries come out exactly as they went
 * in; made badges keep the picks' order, and kept entries without a pick follow in their existing order.
 */
export function mergeBadges(existing: Record<string, Badge>, made: Record<string, MadeBadge>, opts: MergeOptions = {}): MergeResult {
  const handDrawn = new Set(opts.handDrawn ?? HAND_DRAWN);
  const adopt = new Set(opts.adopt ?? []);
  for (const id of adopt) {
    if (handDrawn.has(id)) throw new Error(`Refusing to adopt ${id}: it is a hand-drawn badge (HAND_DRAWN in achievementArtKeep.ts)`);
    if (!made[id]) throw new Error(`Cannot adopt ${id}: no pick makes a badge for it`);
  }
  const r: MergeResult = { badges: {}, created: [], refreshed: [], unchanged: [], adopted: [], removed: [], kept: [], log: [] };
  const protectedIds = new Set(Object.keys(existing).filter((id) => handDrawn.has(id) || (!isGenerated(existing[id]) && !adopt.has(id))));

  for (const [id, b] of Object.entries(made)) {
    const old = existing[id];
    if (protectedIds.has(id)) {
      r.badges[id] = old;
      r.kept.push(id);
      r.log.push(
        handDrawn.has(id)
          ? `kept ${id}: hand-drawn badge, on the protected list; its pick ${b.set}/${b.block} is ignored`
          : `kept ${id}: existing entry is not marked as generated; pass --adopt ${id} to replace it with ${b.set}/${b.block}`,
      );
      continue;
    }
    const next: Badge = { ...b, generator: GENERATOR };
    r.badges[id] = next;
    if (!old) r.created.push(id);
    else if (!isGenerated(old)) (r.adopted.push(id), r.log.push(`adopted ${id}: replaced the unmarked entry with ${b.set}/${b.block}`));
    else if (isDeepStrictEqual(old, next)) r.unchanged.push(id);
    else r.refreshed.push(id);
  }
  for (const [id, old] of Object.entries(existing)) {
    if (id in made) continue;
    if (protectedIds.has(id)) {
      r.badges[id] = old;
      r.kept.push(id);
      r.log.push(`kept ${id}: ${handDrawn.has(id) ? 'hand-drawn badge, on the protected list' : 'not marked as generated'}`);
    } else {
      r.removed.push(id);
      r.log.push(`removed ${id}: generated earlier, no longer picked`);
    }
  }

  // A generated badge must not repeat any other badge's picture.
  const owner = new Map<string, string>();
  for (const [id, b] of Object.entries(r.badges)) {
    const key = pngBytes(b.image);
    const other = owner.get(key);
    if (other !== undefined && (isGenerated(b) || isGenerated(r.badges[other]))) throw new Error(`Duplicate badge art: ${id} repeats ${other}`);
    owner.set(key, id);
  }
  // The guarantee itself: every protected entry leaves exactly as it came.
  for (const id of protectedIds) if (!isDeepStrictEqual(r.badges[id], existing[id])) throw new Error(`Internal error: protected badge ${id} would change`);
  return r;
}

/** Reads blockArt.json; a missing file is empty, but a file that does not parse stops the run (nothing is written). */
export function readBadgeFile(path: string | URL): BadgeFile {
  if (!existsSync(path)) return { notice: '', badges: {} };
  const data = JSON.parse(readFileSync(path, 'utf8')) as BadgeFile;
  if (!data || typeof data.badges !== 'object' || data.badges === null) throw new Error(`${String(path)} has no "badges" object`);
  return data;
}

export const formatBadgeFile = (data: BadgeFile): string => JSON.stringify(data, null, 2) + '\n';

/** Merges `made` into the file at `path` and writes it in one step (a temporary file renamed over it). */
export function updateBadgeFile(path: string | URL, notice: string, made: Record<string, MadeBadge>, opts: MergeOptions = {}): MergeResult {
  const r = mergeBadges(readBadgeFile(path).badges, made, opts);
  const text = formatBadgeFile({ notice, badges: r.badges });
  const tmp = `${path instanceof URL ? path.pathname : path}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
  return r;
}

/** `--adopt a,b --adopt c` -> ['a', 'b', 'c']; any other argument is an error. */
export function parseArgs(argv: readonly string[]): { adopt: string[] } {
  const adopt: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a !== '--adopt' && !a.startsWith('--adopt=')) throw new Error(`Unknown argument ${a}; the only option is --adopt <id>[,<id>...]`);
    const value = a === '--adopt' ? argv[++i] : a.slice('--adopt='.length);
    if (!value || value.startsWith('--')) throw new Error('--adopt needs an achievement id');
    adopt.push(...value.split(',').filter(Boolean));
  }
  return { adopt };
}
