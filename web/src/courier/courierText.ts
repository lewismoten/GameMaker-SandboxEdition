// The words Scoot's card (desk) and SCOOT.EXE (the PC) both show, so the two always agree: the
// four sections, what an empty one says, a letter's date, and a stamp's line. No count of what
// is missing, no "of N", nothing that asks for more play.
import { STAMP_WORDS, worldName } from './tables';
import { deskDate } from '../retro/dos/vfs';
import type { Courier, Postcard, Stamp } from './courierStore';
import type { Arrival } from './trips';

export const SECTIONS = ['Mail', 'Postcards', 'Packages', 'Setup'] as const;
export type Section = (typeof SECTIONS)[number];

export const EMPTY: Readonly<Record<Exclude<Section, 'Setup'>, string>> = {
  Mail: 'No letters yet. A call to a BBS on the PC can bring one home for Scoot.',
  Postcards:
    'No postcards yet. A game played to its end here puts the first stamp on this screen’s postcard, and each screen Scoot rides along to gives one of its own.',
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

export const SEND_WORDS = 'Send Scoot on a trip';
export const LOAD_WORDS = 'Scoot is back / a visitor arrived';
export const VISITOR_HOME_WORDS = 'Send the visitor home';
export const CALL_HOME_WORDS = 'Call Scoot home';

/** Where Scoot is, and any visiting courier, in a line or two. */
export function tripStatus(c: Courier): string[] {
  const lines: string[] = [];
  if (c.out) lines.push('Scoot is on a trip. Open its trip file (SCOOT.SCT) on another screen, and bring it back here when Scoot comes home.');
  else if (c.home) lines.push(`Scoot lives here, at ${worldName(c.home.world)}. A trip file takes it to another screen and back.`);
  else lines.push('A trip file (SCOOT.SCT) takes Scoot to another screen and back.');
  if (c.visitor)
    lines.push(
      `A courier from ${worldName(c.visitor.world)} is visiting. Games played to their end here go on its postcard${c.home ? ` from ${worldName(c.home.world)}` : ''} too.`,
    );
  return lines;
}

/** What happened when a trip file was opened. */
export function arrivalText(a: Arrival): string {
  if (a.kind === 'home') return a.postcards ? 'Welcome home, Scoot! Its new postcards are in Postcards.' : 'Welcome home, Scoot!';
  if (a.kind === 'visitor') return `A courier from ${worldName(a.world)} arrived. It stays until it is sent home.`;
  switch (a.why) {
    case 'mine':
      return 'That trip file was made on this screen. Open it on another screen for Scoot to visit there.';
    case 'replay':
      return 'Scoot has already delivered that trip here, so nothing changed.';
    case 'busy':
      return 'A visiting courier is already here. Send it home first.';
    case 'full':
      return 'That courier’s satchel is full. Send it home first.';
    case 'catalog':
      return 'The game list did not load, so Scoot cannot read its stamps yet. Try again in a moment.';
    case 'version':
      return 'That trip file is from a newer courier than this one.';
    case 'size':
    case 'not-capsule':
      return 'That is not a courier’s trip file, so nothing changed.';
    default:
      return 'That trip file is damaged or was changed, so nothing changed.';
  }
}
