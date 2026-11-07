// The words Scoot's card (desk) and SCOOT.EXE (the PC) both show, so the two always agree: the
// four sections, what an empty one says, a letter's date, and a stamp's line. No count of what
// is missing, no "of N", nothing that asks for more play.
import { STAMP_WORDS, worldName } from './tables';
import { deskDate } from '../retro/dos/vfs';
import type { Postcard, Stamp } from './courierStore';

export const SECTIONS = ['Mail', 'Postcards', 'Packages', 'Setup'] as const;
export type Section = (typeof SECTIONS)[number];

export const EMPTY: Readonly<Record<Exclude<Section, 'Setup'>, string>> = {
  Mail: 'No letters yet. A call to a BBS on the PC can bring one home for Scoot.',
  Postcards: 'No postcards yet. When Scoot rides along to another screen, it brings home a postcard from there.',
  Packages: 'The satchel is empty. It holds up to three special deliveries, each a game from the catalog.',
};

export const QUIET_WORDS = 'Quiet (no words, just waves)';

/** The PC's day (DATE's December 1994, retro/dos/vfs.ts deskDate), YYYY-MM-DD: when a letter came. */
export function mailDay(now?: Date | number): string {
  const d = deskDate(now);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/** "12-07-94", as DOS showed dates, on the card and in SCOOT.EXE alike; empty for none. */
export function letterDate(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return m ? `${m[2]}-${m[3]}-${m[1].slice(2)}` : '';
}

/** A stamp's line: a catalog game by its title (`title` looks it up by id), else its kind's words. */
export function stampText(s: Stamp, title: (id: string) => string | undefined = () => undefined): string {
  if (s.kind === 'game') return (s.game && title(s.game)) || 'A game';
  return STAMP_WORDS[s.kind];
}

/** A postcard's heading: the world's name. */
export const postcardTitle = (p: Postcard): string => `Greetings from ${worldName(p.world)}`;

/** A postcard's stamps as text rows of two columns, `width` wide (SCOOT.EXE), each name cut to fit. */
export function stampRows(p: Postcard, title: (id: string) => string | undefined, width: number): string[] {
  const col = Math.floor((width - 2) / 2);
  const cell = (st: Stamp) => {
    const t = stampText(st, title);
    return (t.length > col - 2 ? `${t.slice(0, col - 3)}.` : t).padEnd(col);
  };
  const rows: string[] = [];
  for (let i = 0; i < p.stamps.length; i += 2)
    rows.push(
      `  ${p.stamps
        .slice(i, i + 2)
        .map(cell)
        .join('')}`.trimEnd(),
    );
  return rows;
}
