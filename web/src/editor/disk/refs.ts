// Which scene uses which file: the adventure scenes' palette, map, block sets, monsters and
// character slots (code/GM/GRATOR.H: pal, map, bbl, mon, mbl, chr, cbl, snd, ...), by stored name.
import { ADVTYPE, parseGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { GameFiles } from '../../project/files';

export const SLOT = { pal: 0, map: 1, bbl: 2, mon: 3, mbl: 4, chr: 5, cbl: 6 } as const;
type Slot = keyof typeof SLOT;

export type SceneUse = { index: number } & Partial<Record<Slot, string>>;

/** Every adventure scene with the stored name of each file it opens (missing files left out). */
export function sceneUses(files: GameFiles, game: Game): SceneUse[] {
  const out: SceneUse[] = [];
  game.scenes.forEach((s, index) => {
    if (s.gametype !== ADVTYPE) return;
    const use: SceneUse = { index };
    for (const [k, slot] of Object.entries(SLOT) as [Slot, number][]) {
      const at = files.resolve(s.files[slot]);
      if (at) use[k] = at;
    }
    out.push(use);
  });
  return out;
}

/** The scenes that open a file in a slot. */
export const usersOf = (uses: SceneUse[], slot: Slot, file: string): SceneUse[] => uses.filter((u) => u[slot] === file);

/** The set of distinct stored names scenes use in a slot, in order of first use. */
export function filesIn(uses: SceneUse[], slot: Slot): string[] {
  const seen = new Set<string>();
  for (const u of uses) if (u[slot]) seen.add(u[slot]);
  return [...seen];
}

export function readGame(files: GameFiles, gam: string): Game {
  return parseGame(files.get(gam)!);
}

/** Points every scene that names `from` in a slot at `to` instead. */
export function repoint(game: Game, files: GameFiles, slot: Slot, from: string, to: string): void {
  for (const s of game.scenes) if (s.gametype === ADVTYPE && files.resolve(s.files[SLOT[slot]]) === from) s.files[SLOT[slot]] = to;
}
