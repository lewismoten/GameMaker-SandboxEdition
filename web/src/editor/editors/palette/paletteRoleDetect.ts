// Finds palette indices a project's block sets use exclusively for characters, monsters or backgrounds.
import { BLOCK_COUNTS, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Project } from '../../core/project';
import type { PaletteReservation, PaletteRole } from './paletteReservations';

const kindFor = (name: string): PaletteRole | undefined => {
  const ext = name.match(/\.([^.]+)$/)?.[1].toLowerCase();
  return ext === 'cbl' ? 'character' : ext === 'mbl' ? 'monster' : ext === 'bbl' ? 'background' : undefined;
};

/** Adjacent colors with exactly one kind of use become a reservation; shared colors stay free. */
export function rangesFromUses(uses: readonly (ReadonlySet<PaletteRole> | undefined)[]): PaletteReservation[] {
  const out: PaletteReservation[] = [];
  let first: number | undefined;
  let role: PaletteRole | undefined;
  const close = (last: number) => {
    if (first !== undefined && role) out.push({ first, last, role });
    first = undefined;
    role = undefined;
  };
  for (let color = 1; color <= 254; color++) {
    const next = uses[color]?.size === 1 ? [...uses[color]!][0] : undefined;
    if (next === role) continue;
    close(color - 1);
    if (next) {
      first = color;
      role = next;
    }
  }
  close(254);
  return out;
}

/** Dedicated areas for the block sets actually drawn with this palette. */
export function detectPaletteRoles(project: Pick<Project, 'files' | 'paletteFor'>, paletteFile: string): PaletteReservation[] {
  const uses: Set<PaletteRole>[] = Array.from({ length: 256 }, () => new Set<PaletteRole>());
  const source = paletteFile.toLowerCase();
  for (const name of project.files.names()) {
    const role = kindFor(name);
    if (!role || project.paletteFor(name).source.toLowerCase() !== source) continue;
    const ext = name.match(/\.([^.]+)$/)![1].toLowerCase() as keyof typeof BLOCK_COUNTS;
    try {
      for (const block of parseBlocks(project.files.get(name)!, BLOCK_COUNTS[ext]))
        for (const color of block.pixels) if (color !== 0 && color !== 255) uses[color].add(role);
    } catch {
      // A malformed block set belongs to the project's health report, not this optional suggestion.
    }
  }
  return rangesFromUses(uses);
}
