// The shared block sets: scenes drawn in the same palette roles share one .BBL (kit/shareBlocks
// merges their used blocks), each scene keeping its own .PAL. A scene not listed keeps its own
// set, numbered as its book numbers it. diskNumber gives the routes a block's number on the disk.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { shareBlocks } from '@lewismoten/gamemaker-sandbox-tools/kit/shareBlocks';
import { buildPalette } from '../art/palette';
import { LEVELS } from '../levels/levels';
import { EGG_BLOCK } from '../levels/muffled';

/** Each shared .BBL (by name, without .bbl) and its scenes. */
export const SHARED_SETS: Record<string, string[]> = {
  street: ['band1', 'band2', 'band3', 'road1', 'road2'],
  curb: ['cups1', 'cups2', 'cups3', 'horn1', 'horn2', 'horn3'],
  garage: ['jump', 'brake', 'hush'],
  engine: ['fan1', 'fan2', 'oil'],
  gear: ['gear1', 'gear2', 'gear3', 'gear4'],
  dash: ['dash1', 'dash2'],
};

/** The .BBL a scene uses. */
export const bblOf = (file: string): string => `${Object.keys(SHARED_SETS).find((s) => SHARED_SETS[s].includes(file)) ?? file}.bbl`;

export interface SceneSet {
  file: string;
  blocks: Block[];
  map: GameMap;
}

/** The disk's block sets by file name, and each scene's map and numbers (local to disk) in them. */
export function shareSets(scenes: SceneSet[]): { sets: Map<string, Block[]>; maps: Map<string, GameMap>; numbers: Map<string, number[]> } {
  const sets = new Map<string, Block[]>();
  const maps = new Map<string, GameMap>();
  const numbers = new Map<string, number[]>();
  for (const s of scenes) {
    if (bblOf(s.file) !== `${s.file}.bbl`) continue;
    sets.set(`${s.file}.bbl`, s.blocks);
    maps.set(s.file, s.map);
    numbers.set(
      s.file,
      s.blocks.map((_, i) => i),
    );
  }
  for (const [name, files] of Object.entries(SHARED_SETS)) {
    const group = files.map((f) => scenes.find((s) => s.file === f)!);
    const shared = shareBlocks(group, [EGG_BLOCK]);
    sets.set(`${name}.bbl`, shared.blocks);
    group.forEach((s, k) => {
      maps.set(s.file, shared.maps[k]);
      numbers.set(s.file, shared.numbers[k]);
    });
  }
  return { sets, maps, numbers };
}

/** Every level scene's blocks and map, as the build makes them. */
export function sceneSets(): SceneSet[] {
  return LEVELS.map((l) => {
    const k = l.blocks(buildPalette(l.theme));
    const level = l.build(k.book);
    return { file: l.file, blocks: k.book.finish(), map: level.m.build() };
  });
}

let cached: Map<string, number[]> | undefined;
/** A scene's block, numbered by its own book, as numbered on the disk. */
export function diskNumber(file: string, local: number): number {
  cached ??= shareSets(sceneSets()).numbers;
  const n = cached.get(file)?.[local];
  if (n === undefined || n < 0) throw new Error(`${file}: block ${local} isn't on the disk`);
  return n;
}
