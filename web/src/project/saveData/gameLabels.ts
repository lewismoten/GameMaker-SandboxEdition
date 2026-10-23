// Names and pictures for a save's fields from the game's own files: level names (the
// integrator's scene descriptions), the level's character (sequence names, keys, and which
// sequences an item turns on), its background blocks and palette (inventory pictures), and how
// many blocks in the game change each counter (an unused counter is labeled so).
import { BACKBL, MONBL, parseBlocks, type Block } from '../../formats/blocks';
import { METERS, parseCharacter, type Character } from '../../formats/character';
import { parseGame, type Game } from '../../formats/game';
import { parsePalette, type Palette } from '../../formats/palette';
import type { SaveLabels } from './saveGame';

/** Anything files can be read from by name (GameFiles, a Map with a get, the desk's drive…). */
export interface FileSource {
  get(name: string): Uint8Array | undefined;
}

// ADV_FILES slots of a level
const PAL = 0;
const BBL = 2;
const MBL = 4;
const CHR = 5;

export interface GameLabels extends SaveLabels {
  game: Game;
  sceneName(scene: number): string | undefined;
  character(scene: number): Character | undefined;
  blocks(scene: number): Block[] | undefined;
  palette(scene: number): Palette | undefined;
  counterUse: Map<number, number>;
}

/** Reads the labels from a game's files; undefined when its .gam is missing or damaged. */
export function gameLabels(files: FileSource, gam: string): GameLabels | undefined {
  const bytes = files.get(gam);
  if (!bytes) return undefined;
  let game: Game;
  try {
    game = parseGame(bytes);
  } catch {
    return undefined;
  }
  const cache = new Map<string, unknown>();
  const read = <T>(scene: number, slot: number, parse: (b: Uint8Array) => T): T | undefined => {
    const name = game.scenes[scene]?.files[slot];
    if (!name) return undefined;
    const key = `${slot}:${name.toLowerCase()}`;
    if (!cache.has(key)) {
      const b = files.get(name);
      let v: T | undefined;
      try {
        v = b ? parse(b) : undefined;
      } catch {
        v = undefined;
      }
      cache.set(key, v);
    }
    return cache.get(key) as T | undefined;
  };
  const counterUse = new Map<number, number>();
  const seen = new Set<string>();
  game.scenes.forEach((s, i) => {
    for (const [slot, count] of [
      [BBL, BACKBL],
      [MBL, MONBL],
    ] as const) {
      const name = s.files[slot]?.toLowerCase();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      for (const b of read(i, slot, (x) => parseBlocks(x, count)) ?? []) if (b.effect > 2 && b.effect < METERS) counterUse.set(b.effect, (counterUse.get(b.effect) ?? 0) + 1);
    }
  });
  return {
    game,
    counterUse,
    sceneName: (scene) => game.scenes[scene]?.desc?.trim() || undefined,
    character: (scene) => read(scene, CHR, parseCharacter),
    blocks: (scene) => read(scene, BBL, (x) => parseBlocks(x, BACKBL)),
    palette: (scene) => read(scene, PAL, parsePalette),
  };
}
