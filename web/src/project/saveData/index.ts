// Save data of one game, read and written as a whole: its ten save slots, their names, and its
// high-score table, over project/storage.ts's save record. The save editors (the web's
// "Saves & scores" panel, the desk PC's SAVEHACK.EXE and BACKUP.EXE) start here.
import { loadSaveData, replaceSaveData, writeSaveFile } from '../storage';
import { parseSave, parseSlotNames, saveFileName, serializeSave, serializeSlotNames, SAVE_SLOTS, SLOT_NAMES_FILE, type SavedGame } from './saveGame';
import { emptyHighScores, findHighScoreFile, highScoreFileName, parseHighScoreTable, serializeHighScoreTable, type HighScoreTable } from './highScores';

export * from './saveGame';
export * from './highScores';
export * from './gameLabels';
export * from './backups';
export * from './newGame';
export * from './saveLevel';

interface SaveSlot {
  slot: number;
  /** The name typed when saving ('' when never named). */
  name: string;
  /** The parsed save; undefined for an empty slot. */
  save?: SavedGame;
  /** Why the file there could not be read. */
  error?: string;
  bytes?: Uint8Array;
}

export interface GameSaves {
  /** Save id ('game:<catalog id>' or 'project:<id>'). */
  game: string;
  files: Record<string, Uint8Array>;
  slots: SaveSlot[];
  /** The save record's high-score file name (or the one the game would write). */
  highScoreFile?: string;
  highScores: HighScoreTable;
  /** True when the table came from the game's disk, not from play in this browser. */
  highScoresFromDisk: boolean;
}

/**
 * Reads a game's saves. `gam` names the high-score file; `disk` reads the game's own files for
 * the high-score table it shipped with when none has been saved yet.
 */
export async function loadGameSaves(game: string, opts: { gam?: string; disk?: { get(name: string): Uint8Array | undefined } } = {}): Promise<GameSaves> {
  const files = await loadSaveData(game);
  const names = parseSlotNames(files[SLOT_NAMES_FILE]);
  const slots: SaveSlot[] = Array.from({ length: SAVE_SLOTS }, (_, slot) => {
    const bytes = files[saveFileName(slot)];
    if (!bytes) return { slot, name: names[slot] };
    try {
      return { slot, name: names[slot], save: parseSave(bytes), bytes };
    } catch (e) {
      return { slot, name: names[slot], error: (e as Error).message, bytes };
    }
  });
  let hsFile = findHighScoreFile(files, opts.gam);
  let fromDisk = false;
  let hsBytes = hsFile ? files[hsFile] : undefined;
  if (!hsBytes && opts.gam) {
    hsFile = highScoreFileName(opts.gam);
    hsBytes = opts.disk?.get(hsFile);
    fromDisk = !!hsBytes;
  }
  return { game, files, slots, highScoreFile: hsFile, highScores: hsBytes ? parseHighScoreTable(hsBytes) : emptyHighScores(), highScoresFromDisk: fromDisk };
}

/** Writes one slot's save (and its name, when given). */
export async function writeSlot(game: string, slot: number, save: SavedGame, name?: string): Promise<void> {
  await writeSaveFile(game, saveFileName(slot), serializeSave(save));
  if (name !== undefined) await writeSlotName(game, slot, name);
}

/** Writes a slot's raw save file (an imported .sav). */
export async function writeSlotBytes(game: string, slot: number, bytes: Uint8Array): Promise<void> {
  await writeSaveFile(game, saveFileName(slot), bytes);
}

async function writeSlotName(game: string, slot: number, name: string): Promise<void> {
  const files = await loadSaveData(game);
  const names = parseSlotNames(files[SLOT_NAMES_FILE]);
  if (names[slot] === name) return;
  names[slot] = name;
  await writeSaveFile(game, SLOT_NAMES_FILE, serializeSlotNames(names, files[SLOT_NAMES_FILE]));
}

/** Empties a slot: its save file goes, and its name. */
export async function deleteSlot(game: string, slot: number): Promise<void> {
  const files = await loadSaveData(game);
  delete files[saveFileName(slot)];
  if (files[SLOT_NAMES_FILE]) {
    const names = parseSlotNames(files[SLOT_NAMES_FILE]);
    names[slot] = '';
    files[SLOT_NAMES_FILE] = serializeSlotNames(names, files[SLOT_NAMES_FILE]);
  }
  await replaceSaveData(game, files);
}

/** Writes the high-score table under `file` (highScoreFileName(gam)). */
export async function writeHighScores(game: string, file: string, table: HighScoreTable): Promise<void> {
  await writeSaveFile(game, file, serializeHighScoreTable(table));
}
