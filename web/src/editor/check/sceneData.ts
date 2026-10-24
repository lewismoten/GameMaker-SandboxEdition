// The level check's view of a game's scenes: each level scene's map, blocks, monsters,
// character, palette and sounds, parsed once. A slot left blank keeps the scene before's file,
// as loadscene's globals do (taken here in scene order, which is play order for most games).
import { BACKBL, CHARBL, MONBL, newBlockSet, parseBlocks, type Block } from '../../formats/blocks';
import { newCharacter, parseCharacter, type Character } from '../../formats/character';
import type { Game } from '../../formats/game';
import { newMap, parseMap, type GameMap } from '../../formats/map';
import { parseMonsters, type Monster } from '../../formats/monster';
import { defaultPalette, parsePalette } from '../../formats/palette';
import { parseSoundSet, type SoundSet } from '../../formats/sound';
import { levelScenes } from './playtest';
import type { FileSource } from './sim';

export interface SceneData {
  scene: number;
  name: string;
  /** The file each slot uses (after blank slots take the scene before's). */
  names: { pal?: string; map?: string; bbl?: string; mon?: string; mbl?: string; chr?: string; cbl?: string; snd?: string };
  map: GameMap;
  bbl: Block[];
  mbl: Block[];
  cbl: Block[];
  mon: Monster[];
  chr: Character;
  palette: Uint8Array;
  sounds?: SoundSet;
}

const SLOTS = ['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd'] as const;

/** Every level scene of the game, parsed (a file that won't parse is left as an empty one). */
export function scenesOf(game: Game, files: FileSource): SceneData[] {
  const out: SceneData[] = [];
  const names: SceneData['names'] = {};
  for (const scene of levelScenes(game)) {
    const s = game.scenes[scene];
    SLOTS.forEach((k, i) => {
      if (s.files[i]) names[k] = s.files[i];
    });
    const get = (n?: string) => (n ? files.get(n) : undefined);
    const tryParse = <T>(n: string | undefined, f: (b: Uint8Array) => T, fallback: () => T): T => {
      const b = get(n);
      if (!b) return fallback();
      try {
        return f(b);
      } catch {
        return fallback();
      }
    };
    out.push({
      scene,
      name: s.desc.trim() || `Scene ${scene}`,
      names: { ...names },
      map: tryParse(names.map, parseMap, newMap),
      bbl: tryParse(
        names.bbl,
        (b) => parseBlocks(b, BACKBL),
        () => newBlockSet('bbl'),
      ),
      mbl: tryParse(
        names.mbl,
        (b) => parseBlocks(b, MONBL),
        () => newBlockSet('mbl'),
      ),
      cbl: tryParse(
        names.cbl,
        (b) => parseBlocks(b, CHARBL),
        () => newBlockSet('cbl'),
      ),
      mon: tryParse(names.mon, parseMonsters, () => []),
      chr: tryParse(names.chr, parseCharacter, newCharacter),
      palette: tryParse(names.pal, parsePalette, defaultPalette),
      sounds: tryParse(names.snd, parseSoundSet, () => undefined),
    });
  }
  return out;
}

/** How many times each background block is on the map. */
export function blockUse(map: GameMap): Uint32Array {
  const n = new Uint32Array(256);
  for (const b of map.blocks) n[b]++;
  return n;
}

/** WCAG 2 relative luminance of a palette color (6-bit VGA components), as the W3C defines it (NOTICE.md). */
export function luminance(pal: Uint8Array, i: number): number {
  const lin = (v: number) => {
    const c = (v * 255) / 63 / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(pal[i * 3]) + 0.7152 * lin(pal[i * 3 + 1]) + 0.0722 * lin(pal[i * 3 + 2]);
}

/** The contrast ratio of two luminances (1 to 21). */
export const contrastRatio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** The most common colors of some pixels (255, transparent, left out), most common first. */
export function topColors(pixels: Uint8Array, n = 3): number[] {
  const count = new Uint32Array(256);
  for (const p of pixels) if (p !== 255) count[p]++;
  return [...count.keys()]
    .filter((c) => count[c])
    .sort((a, b) => count[b] - count[a])
    .slice(0, n);
}
