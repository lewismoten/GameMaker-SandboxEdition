// The level check's color roles check: a block that draws with a color the project reserved for a
// different kind of art (a character block using a monster color, and so on). Reservations are the
// project's palette ranges (editors/palette/paletteReservations.ts). They are a convention, not a
// rule of the engine, so the finding is a suggestion; global colors (in no range), color 0 and
// color 255 are always fine, and a project with no reservations gets no findings.
import { BLOCK_COUNTS, type Block, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { reservationAt, type PaletteReservation, type PaletteRole } from '../../editors/palette/paletteReservations';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';

const KINDS: { kind: BlockKind; role: PaletteRole; noun: string }[] = [
  { kind: 'cbl', role: 'character', noun: 'Character' },
  { kind: 'mbl', role: 'monster', noun: 'Monster' },
  { kind: 'bbl', role: 'background', noun: 'Background' },
];
const PLURAL: Record<PaletteRole, string> = { character: 'characters', monster: 'monsters', background: 'backgrounds' };

/** Colors as "40–42, 50", for a sorted list. */
function spans(colors: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < colors.length;) {
    let j = i;
    while (j + 1 < colors.length && colors[j + 1] === colors[j] + 1) j++;
    out.push(j > i ? `${colors[i]}–${colors[j]}` : `${colors[i]}`);
    i = j + 1;
  }
  return out.join(', ');
}

/** The colors a block draws with that the project reserves for another role, by that role. */
export function foreignColors(block: Block, own: PaletteRole, ranges: readonly PaletteReservation[]): Map<PaletteRole, number[]> {
  const seen = new Set(block.pixels);
  const out = new Map<PaletteRole, number[]>();
  for (const color of [...seen].sort((a, b) => a - b)) {
    const role = reservationAt(ranges, color);
    if (role && role !== 'menu' && role !== 'transparent' && role !== own) out.set(role, [...(out.get(role) ?? []), color]);
  }
  return out;
}

export function colorRoles(scenes: SceneData[], ranges: readonly PaletteReservation[] | undefined): Finding[] {
  if (!ranges?.length) return [];
  const out: Finding[] = [];
  const done = new Set<string>();
  for (const d of scenes) {
    for (const { kind, role, noun } of KINDS) {
      const file = d.names[kind];
      if (!file || done.has(file.toLowerCase())) continue;
      done.add(file.toLowerCase());
      d[kind].slice(0, BLOCK_COUNTS[kind]).forEach((block, n) => {
        for (const [other, colors] of foreignColors(block, role, ranges))
          out.push({
            check: 'color-roles',
            severity: 'warning',
            title: `${noun} block ${n} in ${file} draws with ${colors.length > 1 ? 'colors' : 'color'} ${spans(colors)}, which this project reserves for ${PLURAL[other]}`,
            detail: `If that’s on purpose, dismiss this. The check can’t see whether the art is meant to share a color, or whether a palette change would look worse; it only compares the colors in the block with the ranges set in the palette editor.`,
            where: { scene: d.scene, file, block: { file, n } },
          });
      });
    }
  }
  return out;
}
