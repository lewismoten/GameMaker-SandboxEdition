// Palette reservations proposed for a game that has none: from how its monster and character block
// files use colors across scenes, one range of color numbers per sprite role (tools/palette-reserve
// planRanges), plus what the sync into those ranges would change (rangeSync.ts). Nothing is saved
// here; the dialog saves the roles to the companion only when the person clicks.
import { planRanges, type Proposed, type RoleDemand } from '@lewismoten/gamemaker-sandbox-tools/palette-reserve';
import type { GameFiles } from '../../project/files';
import type { PaletteReservation } from '../editors/palette/paletteReservations';
import { rangeSyncs, type RangeSync } from './rangeSync';
import { colorsOf, SPRITE_ROLE, type SpriteSlot } from './spriteColors';

export interface ReservationProposal {
  roles: PaletteReservation[];
  ranges: (Proposed & { files: string[]; palettes: number })[];
  /** What syncing the colors into the proposed ranges would do, and why a role could not be. */
  syncs: RangeSync[];
  stuck: { role: string; why: string }[];
  /** A palette to draw the strip in. */
  palette: Uint8Array;
}

/** undefined when the game already has reservations or has no sprites to reserve for. */
export function proposeReservations(files: GameFiles, gam: string, existing: readonly PaletteReservation[]): ReservationProposal | undefined {
  if (existing.length) return undefined;
  const c = colorsOf(files, gam);
  const others = new Array<number>(256).fill(0);
  for (const at of c.drawnWith.values()) at.bbl.forEach((i) => (others[i] = 1));
  const demands: RoleDemand[] = [];
  const names = new Map<string, { files: string[]; palettes: Set<string> }>();
  for (const slot of ['mbl', 'cbl'] as SpriteSlot[]) {
    const usage = new Array<number>(256).fill(0);
    const rgb = new Set<number>();
    const mine = c.sprites[slot];
    for (const f of mine) {
      const ref = files.get(f.palettes[0])!;
      for (const n of f.shown)
        for (const v of f.blocks[n]?.pixels ?? []) {
          if (v === 0 || v === 255) continue;
          usage[v]++;
          rgb.add((ref[v * 3] << 12) | (ref[v * 3 + 1] << 6) | ref[v * 3 + 2]);
        }
    }
    if (!mine.length || !rgb.size) continue;
    demands.push({ role: SPRITE_ROLE[slot], distinct: rgb.size, usage });
    names.set(SPRITE_ROLE[slot], { files: mine.map((f) => f.name), palettes: new Set(mine.flatMap((f) => f.palettes)) });
  }
  const ranges = planRanges(demands, others).map((r) => ({ ...r, files: names.get(r.role)!.files, palettes: names.get(r.role)!.palettes.size }));
  if (!ranges.length) return undefined;
  const roles = ranges.map(({ first, last, role }) => ({ first, last, role }));
  const { syncs, stuck } = rangeSyncs(files, gam, roles);
  const first = c.sprites.mbl[0] ?? c.sprites.cbl[0];
  return { roles, ranges, syncs, stuck, palette: files.get(first.palettes[0])! };
}
