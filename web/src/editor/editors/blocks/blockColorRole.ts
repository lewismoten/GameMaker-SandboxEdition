// The block editors' light touch for palette reservations: a short note when the drawing color is
// reserved for another kind of art (monster, character or background). It never blocks painting;
// reservations are a convention the person set in the palette editor, and global colors, color 0
// and color 255 are always fine.
import type { BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { reservationAt, type PaletteReservation, type PaletteRole } from '../palette/paletteReservations';

const OWN: Record<BlockKind, PaletteRole> = { cbl: 'character', mbl: 'monster', bbl: 'background' };
const PLURAL: Record<PaletteRole, string> = { character: 'characters', monster: 'monsters', background: 'backgrounds' };

/** The role this block set's art is meant to use, when `color` is reserved for a different one. */
export function foreignRole(kind: BlockKind, ranges: readonly PaletteReservation[], color: number): PaletteRole | undefined {
  const role = reservationAt(ranges, color);
  return role && role !== 'menu' && role !== 'transparent' && role !== OWN[kind] ? role : undefined;
}

/** A sentence for under the color picker, or '' when the color is fine. */
export function colorRoleNote(kind: BlockKind, ranges: readonly PaletteReservation[], color: number): string {
  const role = foreignRole(kind, ranges, color);
  return role ? ` Color ${color} is reserved for ${PLURAL[role]} in this project; fine if it’s on purpose.` : '';
}
