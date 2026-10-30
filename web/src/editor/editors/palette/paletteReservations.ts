// Project-wide palette roles are editor metadata; native palette and game bytes stay unchanged.
import type { Project } from '../../core/project';

export type PaletteRole = 'character' | 'background' | 'monster';
export interface PaletteReservation {
  first: number;
  last: number;
  role: PaletteRole;
}
export const PALETTE_RESERVATIONS = 'paletteReservations';
const roles: readonly string[] = ['character', 'background', 'monster'];

/** Reassign a selection, splitting old ranges and joining adjacent ranges of the same role. */
export function reserveColors(ranges: readonly PaletteReservation[], first: number, last: number, role?: PaletteRole): PaletteReservation[] {
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last > 254 || first > last || (role !== undefined && !roles.includes(role)))
    throw new RangeError('Choose a palette range within colors 1–254');
  const out = ranges.flatMap((range) => {
    if (range.last < first || range.first > last) return [{ ...range }];
    return [...(range.first < first ? [{ ...range, last: first - 1 }] : []), ...(range.last > last ? [{ ...range, first: last + 1 }] : [])];
  });
  if (role) out.push({ first, last, role });
  out.sort((a, b) => a.first - b.first);
  const joined: PaletteReservation[] = [];
  for (const range of out) {
    const previous = joined.at(-1);
    if (previous && previous.role === range.role && previous.last + 1 === range.first) previous.last = range.last;
    else joined.push(range);
  }
  return joined;
}

/** Ignore malformed imported metadata; later valid ranges take precedence over earlier ones. */
export function readReservations(value: unknown): PaletteReservation[] {
  let ranges: PaletteReservation[] = [];
  if (!Array.isArray(value)) return ranges;
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || !roles.includes(entry.role)) continue;
    try {
      ranges = reserveColors(ranges, entry.first, entry.last, entry.role as PaletteRole);
    } catch {
      // Metadata from another editor version must not prevent opening the palette.
    }
  }
  return ranges;
}

export function paletteReservations(project: Pick<Project, 'gam' | 'extras'>): PaletteReservation[] {
  return readReservations(project.extras<unknown>(project.gam, PALETTE_RESERVATIONS, []));
}

export function reservationAt(ranges: readonly PaletteReservation[], color: number): PaletteRole | 'menu' | 'transparent' | undefined {
  if (color === 0) return 'menu';
  if (color === 255) return 'transparent';
  return ranges.find((range) => range.first <= color && color <= range.last)?.role;
}
