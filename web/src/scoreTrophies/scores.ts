// The scores behind the desk's two score trophies: each catalog game's best final score (the
// score when a play of it ended, won, lost or left with Esc), and the total of the points every
// finished play scored. A play counts toward a game's best only when it beats the best so far.
// A play that loaded a save with F6 adds only what it scored itself to the total, never the
// loaded save's points again (engine/playGain.ts); its final score still counts for the best.
// None of it is read from a game's high score file: it is heard from the engine as play ends
// (engine Session.onPlayEnd, never during a demo's or walkthrough's playback; hook.ts).
//
// Kept in the same IndexedDB save store as the achievements (project/storage.ts) under the save
// id SAVE_ID as one small JSON file, so save backups carry it. PLAYGAME never sees it. Each
// change fires SCORES_CHANGED on window and tells other tabs (a game played on the play page
// while the desk is open in another).
import { loadSaveData, writeSaveFile } from '../project/storage';
import { tierOf, TOP_TIER } from './tiers';

export const SAVE_ID = 'site:scores';
export const FILE = 'scores.json';
export const SCORES_CHANGED = 'gm-scores-changed';

export interface ScoreRecord {
  /** game id -> its best final score. */
  best: Record<string, number>;
  /** The points every finished play scored itself (F6's loaded points left out), added up. */
  total: number;
  /** How many plays have ended (with any score). */
  plays: number;
}

export const emptyScores = (): ScoreRecord => ({ best: {}, total: 0, plays: 0 });

const whole = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** The record read back from its file; anything malformed is dropped. */
export function parseScores(bytes: Uint8Array | undefined): ScoreRecord {
  const r = emptyScores();
  if (!bytes) return r;
  try {
    const o = JSON.parse(new TextDecoder().decode(bytes));
    for (const [k, v] of Object.entries(o?.best ?? {})) if (whole(v)) r.best[k] = Math.floor(v);
    if (whole(o?.total)) r.total = Math.floor(o.total);
    if (whole(o?.plays)) r.plays = Math.floor(o.plays);
  } catch {
    /* a broken file starts afresh */
  }
  return r;
}

/**
 * A play of `game` ended with `score`, having scored `gained` of it itself (less, after F6
 * loaded a save; the whole score when left out): the total grows by the gain, and the game's
 * best if the score beat it.
 */
export function addEnd(r: ScoreRecord, game: string, score: number, gained = score): ScoreRecord {
  const s = Math.max(0, Math.floor(score));
  const g = Number.isFinite(gained) ? Math.max(0, Math.floor(gained)) : s;
  const best = { ...r.best };
  if (s > (best[game] ?? 0)) best[game] = s;
  return { best, total: r.total + g, plays: r.plays + 1 };
}

/** The best scores added up (what the best-scores trophy shows). */
export const bestSum = (r: ScoreRecord): number => Object.values(r.best).reduce((a, b) => a + b, 0);

let writing: Promise<void> = Promise.resolve();
let channel: BroadcastChannel | undefined;

function announce(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SCORES_CHANGED));
  try {
    channel ??= new BroadcastChannel(SCORES_CHANGED);
    channel.postMessage('changed');
  } catch {
    /* no BroadcastChannel */
  }
}

/** The record as stored now. */
export async function loadScores(): Promise<ScoreRecord> {
  const files: Record<string, Uint8Array> = await loadSaveData(SAVE_ID).catch(() => ({}));
  return parseScores(files[FILE]);
}

/** Keeps a finished play (read, changed and written in turn, so two ends never overlap). */
export function recordEnd(game: string, score: number, gained = score): Promise<void> {
  writing = writing
    .then(async () => {
      const next = addEnd(await loadScores(), game, score, gained);
      await writeSaveFile(SAVE_ID, FILE, new TextEncoder().encode(JSON.stringify(next)), { quiet: true });
      announce();
      void earned(next);
    })
    .catch((e) => console.warn('Could not keep the score', e));
  return writing;
}

/** The achievements for the tiers earned (never ones EGG.EXE only shows). */
async function earned(r: ScoreRecord): Promise<void> {
  const tiers = [tierOf('best', bestSum(r)), tierOf('total', r.total)];
  if (!tiers.some((t) => t > 0)) return;
  const { unlockAchievement } = await import('../achievements/store');
  unlockAchievement('trophy-first');
  if (tiers.some((t) => t >= TOP_TIER)) unlockAchievement('trophy-top');
}

/** Calls `f` whenever the scores may have changed (here or in another tab). */
export function watchScores(f: () => void): () => void {
  let other: BroadcastChannel | undefined;
  try {
    other = new BroadcastChannel(SCORES_CHANGED);
    other.onmessage = f;
  } catch {
    /* no BroadcastChannel */
  }
  window.addEventListener(SCORES_CHANGED, f);
  return () => {
    other?.close();
    window.removeEventListener(SCORES_CHANGED, f);
  };
}
