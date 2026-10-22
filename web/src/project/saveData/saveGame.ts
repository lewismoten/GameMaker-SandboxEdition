// Saved games (game0.sav .. game9.sav) and their names (savnames.dat), as this port's PLAYGAME
// writes them (engine/scene.ts saveGame, engine/funcKeys.ts writeSaveNames), with what each
// field means and how far it can go, for the save editors (the web's "Saves & scores" panel
// and the desk PC's SAVEHACK.EXE).
//
// The DOS PLAYGAME.C SaveGame fwrite()s its globals (MaxBlkMon, prevscene, doscene, linkin, the
// clock, nxtchg[], blkmap[], ci, chr, mx, my, mi[], mm[], map[][], NoMons, BlkMon[], then the
// recorder). This port keeps the same game<n>.sav names but writes those values as JSON, so the
// file here is that JSON: JSON.parse then JSON.stringify gives back the very same bytes, and an
// edit changes only the values edited. The limits below are the C types' (cinfo in PLAYGAME.C:
// long score; int hitpts, lives, meter[MAXSEQ+10]; uchar inv[MAXINV]) and the engine's own caps
// (engine/touch.ts doBlockTouchChar: INF_REPEAT - 1 at the top, -(INF_REPEAT - 128) at the bottom).
import { BACKBL, type Block } from '../../formats/blocks';
import { INF_REPEAT, MAXINV, MAXSEQ, METERS, SEQUENCE_NAMES, type Character } from '../../formats/character';
import { cString } from '../../formats/binary';

export const SAVE_SLOTS = 10;
/** savnames.dat: 10 names of 21 bytes (20 characters and a NUL). */
export const SLOT_NAMES_FILE = 'savnames.dat';
export const SLOT_NAME_LENGTH = 20;
const NAME_RECORD = SLOT_NAME_LENGTH + 1;

export const saveFileName = (slot: number): string => `game${slot}.sav`;

/** The slot a save file name is for (game3.sav → 3), or undefined. */
export function slotOfFile(name: string): number | undefined {
  const m = /^game(\d)\.sav$/i.exec(name);
  return m ? Number(m[1]) : undefined;
}

/** cinfo as saved (engine/world.ts CharInfo). */
export interface SavedCharInfo {
  score: number;
  hitpts: number;
  lives: number;
  /** MAXINV block numbers; BACKBL (150) is an empty slot. */
  inv: number[];
  /** MAXSEQ + 10 counters (see the fields below for what each one is). */
  meter: number[];
  /** Which sequences are on (an inventory block turns its sequence on). */
  seqon: boolean[];
  [other: string]: unknown;
}

/** One game<n>.sav, as parsed. Everything not named here is kept as it was. */
export interface SavedGame {
  version: number;
  prevscene: number;
  /** The level the game was saved in. */
  doscene: number;
  linkin: number;
  /** The game clock (18.2 ticks a second, times 8) when saved. */
  sndClock: number;
  world: {
    ci: SavedCharInfo;
    chr: { x: number[]; y: number[]; cframe: number; cseq: number };
    mx: number;
    my: number;
    [other: string]: unknown;
  };
  rec?: unknown;
  [other: string]: unknown;
}

export class SaveFormatError extends Error {}

const text = new TextDecoder();

/** Reads a save; throws SaveFormatError for a file this port's PLAYGAME could not load. */
export function parseSave(bytes: Uint8Array): SavedGame {
  let data: SavedGame;
  try {
    data = JSON.parse(text.decode(bytes));
  } catch {
    throw new SaveFormatError('This saved game is damaged (or is a DOS save, which this player cannot load).');
  }
  const ci = data?.world?.ci;
  if (!ci || typeof data.doscene !== 'number' || !Array.isArray(ci.inv) || !Array.isArray(ci.meter)) throw new SaveFormatError('This is not a saved game.');
  return data;
}

/** Writes a save the way PLAYGAME does (unchanged values come back byte for byte). */
export function serializeSave(save: SavedGame): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(save));
}

export function cloneSave(save: SavedGame): SavedGame {
  return JSON.parse(JSON.stringify(save));
}

/** savnames.dat's ten names ('' for a slot never named). */
export function parseSlotNames(bytes: Uint8Array | undefined): string[] {
  return Array.from({ length: SAVE_SLOTS }, (_, i) => (bytes ? cString(bytes.subarray(i * NAME_RECORD, i * NAME_RECORD + SLOT_NAME_LENGTH)) : ''));
}

/** Writes savnames.dat; a name left as it was keeps its original bytes. */
export function serializeSlotNames(names: string[], original?: Uint8Array): Uint8Array {
  const out = new Uint8Array(SAVE_SLOTS * NAME_RECORD);
  if (original) out.set(original.subarray(0, out.length));
  const before = parseSlotNames(original);
  for (let i = 0; i < SAVE_SLOTS; i++) {
    const n = names[i] ?? '';
    if (original && n === before[i]) continue;
    out.fill(0, i * NAME_RECORD, (i + 1) * NAME_RECORD);
    for (let c = 0; c < Math.min(SLOT_NAME_LENGTH, n.length); c++) out[i * NAME_RECORD + c] = n.charCodeAt(c) & 0xff;
  }
  return out;
}

// ---------------------------------------------------------------- what the fields are

/** What the save editors know about the game (game data; see gameLabels.ts). All optional. */
export interface SaveLabels {
  /** Level names (the integrator's scene descriptions), by scene number. */
  sceneName?(scene: number): string | undefined;
  /** The character of a level (for sequence names, keys, and which sequences an item turns on). */
  character?(scene: number): Character | undefined;
  /** The background blocks of a level (inventory items are these). */
  blocks?(scene: number): Block[] | undefined;
  /** How many blocks in the whole game change each counter (meter index → count). */
  counterUse?: Map<number, number>;
}

export type FieldGroup = 'player' | 'money' | 'uses' | 'counters' | 'inventory' | 'where';

export const GROUP_LABELS: Record<FieldGroup, string> = {
  player: 'Score, health & lives',
  money: 'Money',
  uses: 'Limited uses (sequence counters)',
  counters: 'Special counters',
  inventory: 'Inventory',
  where: 'Where',
};

export interface SaveField {
  /** 'score', 'hitpts', 'hpPerLife', 'lives', 'money', 'uses:<seq>', 'counter:<n>', 'inv:<slot>', 'scene', 'x', 'y'. */
  id: string;
  group: FieldGroup;
  label: string;
  /** 'int': a number; 'item': an inventory block (0..149, or BACKBL for empty); 'info': shown, not edited. */
  type: 'int' | 'item' | 'info';
  /** The lowest and highest values the field can hold (shown values: money and counters without their +1). */
  min: number;
  max: number;
  /** The highest value the engine handles well; Max all sets this, and more gets a warning. */
  safeMax: number;
  /** Can be made unlimited (INF_REPEAT: never counts down, never runs out). */
  canBeUnlimited?: boolean;
  editable: boolean;
  /** One line on the engine's limit, for a tooltip or help text. */
  note: string;
  /** The meter index behind it, for counters. */
  meter?: number;
}

/** Unlimited counter (INF_REPEAT) — the engine never changes it. */
export const UNLIMITED = 'unlimited' as const;
export type FieldValue = number | typeof UNLIMITED | null;

const LONG_MIN = -2147483648;
const LONG_MAX = 2147483647;
const INT_MIN = -32768;
const INT_MAX = 32767;
/** Highest a counting meter gets (touches stop there; INF_REPEAT itself means unlimited). */
const METER_TOP = INF_REPEAT - 1;
/** Lowest a meter gets from touches. */
const METER_BOTTOM = -(INF_REPEAT - 128);
/** A meter of a sequence the previous character did not have (StartSceneInits). */
export const SEQ_UNDEFINED = -20000;
/** The special counters: meter[20..29]. */
export const COUNTER_FIRST = MAXSEQ;
export const COUNTERS = METERS - MAXSEQ;

/** "Left Arrow", "'Space'"… for a sequence's key (high byte scan code, low byte ASCII). */
export function keyLabel(key: number): string {
  const a = key & 0xff;
  if (a === 32) return 'Space';
  if (a === 13) return 'Enter';
  if (a === 9) return 'Tab';
  if (a > 0 && a <= 26) return `Ctrl+${String.fromCharCode(a + 64)}`;
  if (a > 32 && a < 127) return String.fromCharCode(a).toUpperCase();
  const arrows: Record<number, string> = {
    18432: 'Up',
    19200: 'Left',
    19712: 'Right',
    20480: 'Down',
    18688: 'Up-Right',
    18176: 'Up-Left',
    20224: 'Down-Left',
    20736: 'Down-Right',
  };
  return arrows[key] ?? (key ? `key ${key >> 8}` : 'no key');
}

/** A sequence's name: Idle, Die, Hurt, Pick up, Drop, or "Sequence 7 (Space)". */
export function sequenceLabel(seq: number, chr?: Character): string {
  if (seq < SEQUENCE_NAMES.length) return SEQUENCE_NAMES[seq];
  const key = chr?.sequences[seq]?.key;
  return key ? `Sequence ${seq} (${keyLabel(key)})` : `Sequence ${seq}`;
}

/** Every field of a save the editors show, with its limits, in display order. */
export function saveFields(save: SavedGame, labels: SaveLabels = {}): SaveField[] {
  const { ci } = save.world;
  const scene = save.doscene;
  const chr = labels.character?.(scene);
  const fields: SaveField[] = [
    {
      id: 'score',
      group: 'player',
      label: 'Score',
      type: 'int',
      min: LONG_MIN,
      max: LONG_MAX,
      safeMax: 999_999_999,
      editable: true,
      note: 'A 32-bit long in PLAYGAME: past 2,147,483,647 it wraps around to negative. The high-score table shows 10 digits.',
    },
    {
      id: 'hitpts',
      group: 'player',
      label: 'Hit points',
      type: 'int',
      min: INT_MIN,
      max: INT_MAX,
      safeMax: METER_TOP,
      editable: true,
      note: 'A 16-bit int; healing stops at 32,766. At 0 or less the hero dies at the next touch.',
    },
    {
      id: 'hpPerLife',
      group: 'player',
      label: 'Hit points each new life',
      type: 'int',
      min: 1,
      max: INT_MAX,
      safeMax: METER_TOP,
      editable: true,
      note: 'The hit points a life starts with (the character’s, copied in the first level).',
    },
    {
      id: 'lives',
      group: 'player',
      label: 'Spare lives',
      type: 'int',
      min: 0,
      max: INT_MAX,
      safeMax: 32000,
      editable: true,
      note: 'A 16-bit int: an extra life at 32,767 wraps to negative and ends the game, so keep some room. 0 = the last life.',
    },
  ];
  if (ci.meter[3] !== INF_REPEAT)
    fields.push({
      id: 'money',
      group: 'money',
      label: 'Money',
      type: 'int',
      min: 0,
      max: METER_TOP - 1,
      safeMax: METER_TOP - 1,
      editable: true,
      meter: 3,
      note: 'Kept as money + 1 in a 16-bit int; touches stop adding at 32,765, and a block that would leave none refuses the touch.',
    });
  for (let i = 5; i < MAXSEQ; i++) {
    const v = ci.meter[i];
    if (v === SEQ_UNDEFINED) continue;
    if (chr && !chr.sequences[i]?.key) continue;
    fields.push({
      id: `uses:${i}`,
      group: 'uses',
      label: sequenceLabel(i, chr),
      type: 'int',
      min: 0,
      max: METER_TOP,
      safeMax: METER_TOP,
      canBeUnlimited: true,
      editable: true,
      meter: i,
      note: 'Each run uses one; at 0 the sequence stops working. Unlimited never counts down (blocks that add uses do nothing then).',
    });
  }
  for (let n = 0; n < COUNTERS; n++) {
    const i = COUNTER_FIRST + n;
    const used = labels.counterUse?.get(i) ?? 0;
    fields.push({
      id: `counter:${n + 1}`,
      group: 'counters',
      label: labels.counterUse ? `Counter ${n + 1}${used ? ` (${used} block${used === 1 ? '' : 's'})` : ' (unused)'}` : `Counter ${n + 1}`,
      type: 'int',
      min: METER_BOTTOM - 1,
      max: METER_TOP - 1,
      safeMax: METER_TOP - 1,
      canBeUnlimited: true,
      editable: true,
      meter: i,
      note: 'Kept as value + 1 in a 16-bit int. A block that would take it to 0 or below blocks the way (keys, ammo, collectables).',
    });
  }
  for (let s = 0; s < MAXINV; s++)
    fields.push({
      id: `inv:${s}`,
      group: 'inventory',
      label: `Slot ${s + 1}`,
      type: 'item',
      min: 0,
      max: BACKBL,
      safeMax: BACKBL,
      editable: true,
      note: 'A background block (0–149) or empty. Items fill from the first slot; the 10th slot full means no more pick-ups.',
    });
  const name = labels.sceneName?.(scene);
  fields.push(
    {
      id: 'scene',
      group: 'where',
      label: 'Level',
      type: 'info',
      min: 0,
      max: 0xffff,
      safeMax: 0xffff,
      editable: false,
      note: name ? `Level ${scene}: ${name}` : `Level ${scene}`,
    },
    { id: 'x', group: 'where', label: 'Map column', type: 'info', min: 0, max: 99, safeMax: 99, editable: false, note: 'Where the hero stands (0–99).' },
    { id: 'y', group: 'where', label: 'Map row', type: 'info', min: 0, max: 99, safeMax: 99, editable: false, note: 'Where the hero stands (0–99).' },
  );
  return fields;
}

/** A field by id. */
export function fieldOf(save: SavedGame, id: string, labels?: SaveLabels): SaveField | undefined {
  return saveFields(save, labels).find((f) => f.id === id);
}

function meterIndex(id: string): number | undefined {
  if (id === 'money') return 3;
  if (id === 'hpPerLife') return 0;
  const [kind, n] = id.split(':');
  if (kind === 'uses') return Number(n);
  if (kind === 'counter') return COUNTER_FIRST + Number(n) - 1;
  return undefined;
}

/** Meters shown without their stored +1. */
const plusOne = (id: string) => id === 'money' || id.startsWith('counter:');

/** A field's value as shown: a number, UNLIMITED, or null (not set up yet). */
export function getField(save: SavedGame, id: string): FieldValue {
  const { ci, chr } = save.world;
  switch (id) {
    case 'score':
      return ci.score;
    case 'hitpts':
      return ci.hitpts;
    case 'lives':
      return ci.lives;
    case 'scene':
      return save.doscene;
    case 'x':
      return chr.x[0];
    case 'y':
      return chr.y[0];
  }
  if (id.startsWith('inv:')) return ci.inv[Number(id.slice(4))] ?? BACKBL;
  const m = meterIndex(id);
  if (m === undefined) return null;
  const v = ci.meter[m];
  if (v === INF_REPEAT && id !== 'hpPerLife') return UNLIMITED;
  if (v === undefined || v === -1) return null;
  return plusOne(id) ? v - 1 : v;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.trunc(v)));

/**
 * Sets a field (clamped to what it can hold). Changing the inventory turns the sequences tied
 * to the items carried on or off, as picking up and dropping do (checkseq_fortie).
 */
export function setField(save: SavedGame, id: string, value: number | typeof UNLIMITED, labels: SaveLabels = {}): void {
  const f = fieldOf(save, id, labels);
  if (!f || !f.editable) return;
  const { ci } = save.world;
  if (value === UNLIMITED) {
    const m = meterIndex(id);
    if (f.canBeUnlimited && m !== undefined) ci.meter[m] = INF_REPEAT;
    return;
  }
  const v = clamp(value, f.min, f.max);
  switch (id) {
    case 'score':
      ci.score = v;
      return;
    case 'hitpts':
      ci.hitpts = v;
      return;
    case 'lives':
      ci.lives = v;
      return;
  }
  if (id.startsWith('inv:')) {
    ci.inv[Number(id.slice(4))] = v;
    retieSequences(save, labels);
    return;
  }
  const m = meterIndex(id);
  if (m !== undefined) ci.meter[m] = plusOne(id) ? v + 1 : v;
}

/** Turns on the sequences whose required block is carried (and off those whose block is not). */
function retieSequences(save: SavedGame, labels: SaveLabels): void {
  const chr = labels.character?.(save.doscene);
  if (!chr || !Array.isArray(save.world.ci.seqon)) return;
  const { ci } = save.world;
  chr.sequences.forEach((s, q) => {
    if (s.bloc === BACKBL) return;
    ci.seqon[q] = ci.inv.includes(s.bloc);
  });
}

/** Plain warnings about a field's value (empty when it is fine). */
export function fieldWarnings(save: SavedGame, f: SaveField, labels: SaveLabels = {}): string[] {
  const v = getField(save, f.id);
  const out: string[] = [];
  if (typeof v !== 'number') return out;
  if (f.type === 'item') {
    if (v === BACKBL) return out;
    if (v > BACKBL || v < 0) out.push(`Block ${v} is not a background block (0–149).`);
    const blk = labels.blocks?.(save.doscene)?.[v];
    if (blk && !blk.obj) out.push('This block is not one the hero can pick up: it shows on the F2 screen, and dropping it puts it on the map.');
    return out;
  }
  if (v > f.safeMax) out.push(`Above ${f.safeMax.toLocaleString('en-US')}, more than the game handles well. ${f.note}`);
  if (f.id === 'hitpts' && v <= 0) out.push('0 or less: the hero dies at the next touch.');
  if (f.id === 'lives' && v === 0) out.push('No spare lives: the next death ends the game.');
  if (f.id.startsWith('counter:') && v <= 0) out.push('0 or less: blocks that take from this counter will block the way.');
  if (f.id.startsWith('uses:') && v === 0) out.push('No uses left: the sequence will not run.');
  return out;
}

/** "Max all stats": every number to its safe maximum (counting counters only; items stay). Returns the ids changed. */
export function maxAll(save: SavedGame, labels: SaveLabels = {}): string[] {
  const changed: string[] = [];
  for (const f of saveFields(save, labels)) {
    if (!f.editable || f.type !== 'int') continue;
    const v = getField(save, f.id);
    if (v === UNLIMITED || v === null) continue;
    // a counter no block uses means nothing; one counting down is left as it is
    if (f.group === 'counters' && labels.counterUse && !labels.counterUse.get(f.meter!)) continue;
    if (v >= f.safeMax) continue;
    setField(save, f.id, f.safeMax, labels);
    changed.push(f.id);
  }
  return changed;
}

/** Ids whose values differ between two saves (for "edited" marks). */
export function changedFields(a: SavedGame, b: SavedGame, labels?: SaveLabels): string[] {
  return saveFields(a, labels)
    .filter((f) => getField(a, f.id) !== getField(b, f.id))
    .map((f) => f.id);
}
