// Which eggs have been found: read from each Sandbox game's saved games (see eggs.ts for the
// convention), plus EGG.EXE's overrides kept apart in localStorage. Found = (a save holds it
// OR it was added by hand) AND it was not broken.
import { EGGS, type Egg, type EggDetect } from './eggs';
import { loadSaveData } from '../project/storage';

export const OVERRIDES_KEY = 'gm-eggs';
/** Fired on window when EGG.EXE changes an override. */
export const EGGS_CHANGED = 'gm-eggs-changed';

export type Override = 'added' | 'broken';
export type EggStatus = 'saved' | 'added' | 'broken' | 'none';

/** Does one game<n>.sav (this port's JSON save) hold the egg? */
export function saveHolds(bytes: Uint8Array, detect: EggDetect): boolean {
  let ci: { inv?: unknown; meter?: unknown } | undefined;
  try {
    ci = JSON.parse(new TextDecoder().decode(bytes))?.world?.ci;
  } catch {
    return false;
  }
  if (!ci) return false;
  if ('block' in detect) return Array.isArray(ci.inv) && ci.inv.includes(detect.block);
  const v = Array.isArray(ci.meter) ? ci.meter[detect.counter] : undefined;
  return typeof v === 'number' && v >= (detect.atLeast ?? 1);
}

/** Does any saved slot (game0.sav .. game9.sav) of a game's save data hold the egg? */
export function savesHold(files: Record<string, Uint8Array>, detect: EggDetect | undefined): boolean {
  if (!detect) return false;
  return Object.entries(files).some(([name, bytes]) => /^game\d\.sav$/i.test(name) && saveHolds(bytes, detect));
}

export function readOverrides(): Record<string, Override> {
  try {
    const o = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}');
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

export function setOverride(game: string, value: Override | undefined): void {
  const o = readOverrides();
  if (value) o[game] = value;
  else delete o[game];
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(EGGS_CHANGED));
}

/** What EGG.EXE shows: where the egg stands, and whether it counts as found. */
export function statusOf(inSave: boolean, override: Override | undefined): { status: EggStatus; found: boolean } {
  if (override === 'broken') return { status: 'broken', found: false };
  if (inSave) return { status: 'saved', found: true };
  if (override === 'added') return { status: 'added', found: true };
  return { status: 'none', found: false };
}

export interface EggState {
  egg: Egg;
  inSave: boolean;
  status: EggStatus;
  found: boolean;
}

export async function eggStates(): Promise<EggState[]> {
  const overrides = readOverrides();
  return Promise.all(
    EGGS.map(async (egg) => {
      const inSave = egg.detect ? savesHold(await loadSaveData(`game:${egg.game}`), egg.detect) : false;
      return { egg, inSave, ...statusOf(inSave, overrides[egg.game]) };
    }),
  );
}
