// What the player's controls and counters mean, written by the game's author: game-wide
// editor-only data kept in the .gam's companion section, shared by every character.
//
// The shape is plain JSON so a game's own `controls.json` can hold exactly the same thing:
//   {
//     "keys":     { "57": { "short": "Jump", "long": "Hold to jump higher" } },  // DOS scan code -> text
//     "joystick": { "1": { "short": "Fire", "long": "…" }, "2": { … } },        // button 1 and 2
//     "counters": { "20": "Gold keys", "7": "Arrows" },                         // meter 5-24 -> name
//     "sounds":   { "9": "Zap", "12": "Door creak" }                            // sound slot past the named ones -> name
//   }
// Every part is optional. Nothing here is written into the DOS files.
import type { Project } from './project';
import { getSection, type Companion } from '../../project/companion';
import { JOYSTICK_BUTTONS, readJoystickButtons, type JoystickButtons } from './joystickButtons';
import { COUNTER_NAMES, readCounterNames, type CounterNames } from '../editors/character/counterNames';

/** The companion section (on the .gam) holding the keys and counters; joystick buttons keep their own (joystickButtons.ts). */
const CONTROLS_SECTION = 'controls';

export interface KeyDescription {
  short: string;
  long: string;
}

export interface GameControls {
  /** Key descriptions by DOS scan code (a decimal string, "57" for Space). */
  keys: Record<string, KeyDescription>;
  joystick: JoystickButtons;
  /** Counter names by meter number: 5-19 repetition counters, 20-24 hidden counters. */
  counters: CounterNames;
  /** Names of the sound slots past PLAYGAME's named ones, by slot number (a decimal string). */
  sounds: SoundNames;
}

export type SoundNames = Record<string, string>;
export const SOUND_NAME_LIMIT = 40;
const SOUND_SLOTS = 30;

/** Clean sound names: slots 0-29 only, trimmed and cut to the limit. */
export function readSoundNames(value: unknown): SoundNames {
  const out: SoundNames = {};
  if (!isObject(value)) return out;
  for (const [slot, name] of Object.entries(value)) {
    const n = text(name, SOUND_NAME_LIMIT);
    if (/^(?:0|[1-9]\d?)$/.test(slot) && Number(slot) < SOUND_SLOTS && n) out[slot] = n;
  }
  return out;
}

const text = (value: unknown, limit: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '');
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function readKeyDescriptions(value: unknown): GameControls['keys'] {
  const out: GameControls['keys'] = {};
  if (!isObject(value)) return out;
  for (const [scan, entry] of Object.entries(value)) {
    if (!/^[1-9]\d{0,2}$/.test(scan) || !isObject(entry)) continue;
    const short = text(entry.short, 32),
      long = text(entry.long, 240);
    if (short || long) out[scan] = { short, long };
  }
  return out;
}

/** Any value (a stored section, a controls.json) as clean controls; unknown or empty parts are dropped. */
export function readControls(value: unknown): GameControls {
  const v = isObject(value) ? value : {};
  return {
    keys: readKeyDescriptions(v.keys),
    joystick: readJoystickButtons(v.joystick),
    counters: readCounterNames(v.counters),
    sounds: readSoundNames(v.sounds),
  };
}

type Store = Pick<Project, 'extras' | 'setExtras' | 'gam'>;

/** The controls kept in a companion (a stored project's), for the Keys dialog on the home page. */
export function controlsFromCompanion(companion: Companion | undefined, gam: string): GameControls {
  const own = companion ? getSection<unknown>(companion, gam, CONTROLS_SECTION, undefined) : undefined;
  return readControls({ ...(isObject(own) ? own : {}), joystick: companion ? getSection<unknown>(companion, gam, JOYSTICK_BUTTONS, undefined) : undefined });
}

export function gameControls(project: Pick<Project, 'companion' | 'gam'>): GameControls {
  return controlsFromCompanion(project.companion, project.gam);
}

/** Stores the controls (nothing is stored for an empty part), leaving the game's files alone. */
export function setGameControls(project: Store, next: GameControls): void {
  const controls = readControls(next);
  const own = { keys: controls.keys, counters: controls.counters, sounds: controls.sounds };
  const empty = (o: object) => Object.keys(o).length === 0;
  project.setExtras(
    project.gam,
    CONTROLS_SECTION,
    empty(own.keys) && empty(own.counters) && empty(own.sounds)
      ? undefined
      : {
          ...(empty(own.keys) ? {} : { keys: own.keys }),
          ...(empty(own.counters) ? {} : { counters: own.counters }),
          ...(empty(own.sounds) ? {} : { sounds: own.sounds }),
        },
  );
  project.setExtras(project.gam, JOYSTICK_BUTTONS, empty(controls.joystick) ? undefined : controls.joystick);
}

/** A counter's game-wide name, or ''. */
export function counterName(project: Pick<Project, 'companion' | 'gam'>, meter: number): string {
  return gameControls(project).counters[meter] ?? '';
}

/**
 * Per-character counter names (an older version kept them on each .CHR) move to the game-wide
 * names: the first name found for a counter wins, an existing game-wide name is kept, and the
 * old entries are removed. Returns whether anything moved.
 */
export function migrateCounterNames(project: Store & Pick<Project, 'files'>): boolean {
  let moved = false;
  const found: CounterNames = {};
  for (const file of project.files.byExtension('chr')) {
    const old = project.extras<unknown>(file, COUNTER_NAMES, undefined);
    if (old === undefined) continue;
    for (const [meter, name] of Object.entries(readCounterNames(old))) found[meter] ??= name;
    project.setExtras(file, COUNTER_NAMES, undefined);
    moved = true;
  }
  if (!moved) return false;
  const now = gameControls(project);
  setGameControls(project, { ...now, counters: { ...found, ...now.counters } });
  return true;
}

/** A sound slot as listed: "7. Name", using PLAYGAME's name, else the game's own, else "Effect". */
export function soundLabel(slot: number, defaults: readonly string[], names: SoundNames | undefined): string {
  return `${slot}. ${defaults[slot] ?? names?.[slot] ?? 'Effect'}`;
}
