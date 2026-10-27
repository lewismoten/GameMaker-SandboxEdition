// The tin heart hunt: one tin heart hidden in every Sandbox and Bard of Bizarre game (see
// games/kit/TIN-HEARTS.md). In Game-Maker a block has no id or sound of its own, so a heart is
// just a block that gives points when touched; the web knows it from its place instead. Each
// game's about.json names the map file and cell (hearts.json, manifest.ts), the engine tells the
// player when a touch changes a map cell (World.onTouched; never during a demo's playback), and
// a touch at the heart's place is a find.
//
// A find is kept in the game's save data (project/storage.ts, `game:<id>`) as FOUND_FILE, a
// small JSON note beside its saved games and high scores: so it lasts, the Saves & scores panel
// shows it, and save backups (the web's and BACKUP.EXE's) carry it. PLAYGAME never reads it.
// EGG.EXE's tin heart page can also add or take away finds by hand; those overrides live in
// localStorage under OVERRIDES_KEY and never touch a save, as the felt eggs' do.
//
// Which games count: the catalog's Sandbox and Bard of Bizarre games that declare a heart. The
// manifest never holds a secret game, so one never shows in a count or a list. The hunt is
// those games' hearts and the room's (deskHearts.ts: the one in the wall clock); `huntStates`,
// `heartCount` and `huntComplete` count all of them.
import json from './hearts.json';
import { isHeartAt, type HeartManifest, type HeartPlace } from './manifest';
import { loadSaveData, SAVES_CHANGED, writeSaveFile } from '../project/storage';
import type { Session } from '../engine/scene';
import { CLOCK_FOUND_KEY, clockHeartTaken, DESK_HEARTS, grandfathered, TIN_HEARTS_CHANGED } from './deskHearts';

export const MANIFEST = json as unknown as HeartManifest;
export const FOUND_FILE = 'tinheart.dat';
export const OVERRIDES_KEY = 'gm-tin-hearts';

type HeartOverride = 'added' | 'broken';
type HeartStatus = 'saved' | 'added' | 'broken' | 'none';

/** The heart a game hides, if it declares one. */
export const heartOf = (gameId: string): HeartPlace | undefined => MANIFEST.hearts[gameId];

/** What FOUND_FILE holds. */
interface FoundNote {
  /** When it was found (ISO date). */
  found: string;
  scene: number;
  at: [number, number];
}

function foundBytes(scene: number, at: [number, number], when = new Date()): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ found: when.toISOString(), scene, at } satisfies FoundNote));
}

/** FOUND_FILE read back; undefined when it is missing or not a find. */
export function parseFound(bytes: Uint8Array | undefined): FoundNote | undefined {
  if (!bytes) return undefined;
  try {
    const n = JSON.parse(new TextDecoder().decode(bytes));
    return n && typeof n.found === 'string' ? n : undefined;
  } catch {
    return undefined;
  }
}

const announce = () => typeof window !== 'undefined' && window.dispatchEvent(new Event(TIN_HEARTS_CHANGED));

/** Keeps a find in the game's save data (once: the first find's date stays). */
async function recordFind(saveId: string, scene: number, at: [number, number]): Promise<void> {
  if (parseFound((await loadSaveData(saveId))[FOUND_FILE])) return;
  await writeSaveFile(saveId, FOUND_FILE, foundBytes(scene, at));
  announce();
}

/**
 * What the player passes the engine for a game played under `saveId` ('game:<id>'): it listens
 * for the touch at the heart's place and keeps the find. Undefined for a game with no heart.
 */
export function heartHook(saveId: string | undefined): { onSession: (s: Session) => void; onTouched: NonNullable<Session['onTouched']> } | undefined {
  const id = saveId?.startsWith('game:') ? saveId.slice(5) : undefined;
  const place = id ? heartOf(id) : undefined;
  if (!place) return undefined;
  let session: Session | undefined;
  let kept = false;
  return {
    onSession: (s) => (session = s),
    onTouched: (scene, x, y) => {
      if (kept || !session || !isHeartAt(place, session.game.scenes[scene]?.files[1], x, y)) return;
      kept = true;
      void recordFind(saveId!, scene, place.at);
    },
  };
}

export function readOverrides(): Record<string, HeartOverride> {
  try {
    const o = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}');
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function writeOverrides(o: Record<string, HeartOverride>): void {
  try {
    if (Object.keys(o).length) localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
    else localStorage.removeItem(OVERRIDES_KEY);
  } catch {
    /* private mode */
  }
  announce();
}

export function setOverride(game: string, value: HeartOverride | undefined): void {
  const o = readOverrides();
  if (value) o[game] = value;
  else delete o[game];
  writeOverrides(o);
}

/** EGG.EXE's Set all / Clear all: every listed heart found (or not), whatever the saves say. */
export function setAllOverrides(states: Pick<HeartState, 'id' | 'inSave'>[], found: boolean): void {
  const o = readOverrides();
  for (const s of states) {
    if (found) s.inSave ? delete o[s.id] : (o[s.id] = 'added');
    else s.inSave ? (o[s.id] = 'broken') : delete o[s.id];
  }
  writeOverrides(o);
}

/** EGG.EXE's X Reset all (and R): every heart back to what the saves say. */
export const resetAllOverrides = (): void => writeOverrides({});

/** Where a heart stands: found = (in the save OR added by hand) AND not taken away. */
export function statusOf(inSave: boolean, override: HeartOverride | undefined): { status: HeartStatus; found: boolean } {
  if (override === 'broken') return { status: 'broken', found: false };
  if (inSave) return { status: 'saved', found: true };
  if (override === 'added') return { status: 'added', found: true };
  return { status: 'none', found: false };
}

export interface HeartState {
  id: string;
  title: string;
  inSave: boolean;
  /** When the save says it was found. */
  when?: string;
  status: HeartStatus;
  found: boolean;
}

/** A catalog entry, as much as counting needs. */
interface CountedGame {
  id: string;
  title: string;
}

/** The games that count, from a catalog list: Sandbox or Bard of Bizarre, with a heart declared. */
export function countedOf<T extends { id: string; title: string; company?: string; series?: string; original?: unknown }>(catalog: T[]): CountedGame[] {
  return catalog.filter((g) => g.original && heartOf(g.id)).map((g) => ({ id: g.id, title: g.title }));
}

/** Development only: the catalog's games that count but hide no heart yet. */
export function pendingOf<T extends { id: string; title: string }>(catalog: T[]): CountedGame[] {
  return catalog.filter((g) => MANIFEST.pending.includes(g.id)).map((g) => ({ id: g.id, title: g.title }));
}

/** The counted games from the live catalog (titles from it). */
async function countedGames(): Promise<CountedGame[]> {
  const { loadGameList } = await import('../project/files');
  return countedOf(await loadGameList().catch(() => []));
}

/** Where every counted heart stands. */
export async function heartStates(games?: CountedGame[]): Promise<HeartState[]> {
  const list = games ?? (await countedGames());
  const overrides = readOverrides();
  return Promise.all(
    list.map(async (g) => {
      const note = parseFound((await loadSaveData(`game:${g.id}`))[FOUND_FILE]);
      return { id: g.id, title: g.title, inSave: !!note, when: note?.found, ...statusOf(!!note, overrides[g.id]) };
    }),
  );
}

/** Where the room's hearts stand (the clock's): taken in the room, or changed in EGG.EXE. */
export function deskHeartStates(): HeartState[] {
  const overrides = readOverrides();
  return DESK_HEARTS.map((d) => {
    const when = clockHeartTaken();
    return { id: d.id, title: d.title, inSave: !!when, when, ...statusOf(!!when, overrides[d.id]) };
  });
}

/** Every heart in the hunt: the counted games' (`games`, or the live catalog's), then the room's. */
export async function huntStates(games?: CountedGame[]): Promise<HeartState[]> {
  return [...(await heartStates(games)), ...deskHeartStates()];
}

const isDesk = (id: string) => DESK_HEARTS.some((d) => d.id === id);

/**
 * Whether the hunt is won, from `states` (huntStates): every heart found, or every game's heart
 * found by someone who had found them all before the room's hearts joined (deskHearts.ts).
 */
export function huntComplete(states: Pick<HeartState, 'id' | 'found'>[]): boolean {
  const games = states.filter((s) => !isDesk(s.id));
  if (!games.length) return false; // not known yet (no catalog): nothing decided
  const gamesDone = games.every((s) => s.found);
  // asked every time, so the first answer is the one kept
  const before = grandfathered(gamesDone);
  return gamesDone && (before || states.every((s) => s.found));
}

/** How many of the hunt's hearts are found, and whether it is won (huntComplete). */
export async function heartCount(): Promise<{ found: number; total: number; complete: boolean }> {
  const s = await huntStates();
  return { found: s.filter((h) => h.found).length, total: s.length, complete: huntComplete(s) };
}

/** Calls `f` whenever a find may have changed (here, a save written, EGG.EXE in another tab). */
export function watchHearts(f: () => void): () => void {
  const onStorage = (e: StorageEvent) => (e.key === OVERRIDES_KEY || e.key === CLOCK_FOUND_KEY || e.key === null) && f();
  window.addEventListener(TIN_HEARTS_CHANGED, f);
  window.addEventListener(SAVES_CHANGED, f);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(TIN_HEARTS_CHANGED, f);
    window.removeEventListener(SAVES_CHANGED, f);
    window.removeEventListener('storage', onStorage);
  };
}
