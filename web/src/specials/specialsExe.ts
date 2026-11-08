// SPECIALS.EXE: an unlisted program on the desk's PC (and dos.html's), like EGG.EXE, for testing
// the Specials offline. SPECIALS lists each one, its window and where it stands; LOCK hides one
// whatever the date, UNLOCK brings one out whatever the date (and sets its desk arrival waiting),
// RESET forgets it was kept (RESET ALL: every one, and the test date), and DATE sets the date the
// Specials go by (DATE RESET: the real one again). It only changes localStorage (state.ts,
// clock.ts). Plain lines, as a DOS command prints them. No DOM.
import { nextOpening, openSpan } from './calendar';
import { setTestDate, specialsNow, testDate } from './clock';
import { SPECIALS, specialById } from './registry';
import { forced, forceSpecial, keptHow, resetAllSpecials, resetSpecial } from './state';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (d: Date) => `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, ' ')} ${d.getFullYear()}`;

const HELP = [
  'Tests the Specials, the limited-time games.',
  '',
  'SPECIALS                 lists them and where each stands',
  'SPECIALS LOCK id         hides one, whatever the date',
  'SPECIALS UNLOCK id       brings one out, whatever the date',
  'SPECIALS RESET id|ALL    forgets one was kept (ALL: the date too)',
  'SPECIALS DATE yyyy-mm-dd the date they go by (DATE RESET: today)',
];

/** Where a Special stands at `now`, in a few words. */
function standing(id: string, now: Date): string {
  const s = specialById(id)!;
  const f = forced(id);
  const kept = keptHow(id);
  const open = openSpan(s.window, now);
  const last = open ? new Date(open.end.getTime() - 1) : undefined;
  const when = open ? `out until ${day(last!)}` : `next ${nextOpening(s.window, now) ? day(nextOpening(s.window, now)!) : 'never'}`;
  return [f === 'lock' ? 'LOCKED' : f === 'unlock' ? 'UNLOCKED' : '', kept ? `kept (${kept})` : '', when].filter(Boolean).join(', ');
}

/** Runs SPECIALS with `args`; the lines it prints. */
export function specialsCommand(args: string[]): string[] {
  const [verb = 'LIST', arg] = args.map((a) => a.trim()).filter(Boolean);
  const v = verb.toUpperCase();
  if (v === '/?' || v === 'HELP') return HELP;
  if (v === 'DATE') {
    if (!arg) return [`The Specials go by ${testDate() ? `the test date ${testDate()}` : 'today'}.`];
    if (arg.toUpperCase() === 'RESET') {
      setTestDate(undefined);
      return ['The Specials go by today again.'];
    }
    return setTestDate(arg) ? [`The Specials go by ${arg} now.`] : ['Invalid date (yyyy-mm-dd, or yyyy-mm-ddThh:mm)'];
  }
  if (v === 'LOCK' || v === 'UNLOCK' || v === 'RESET') {
    if (v === 'RESET' && arg?.toUpperCase() === 'ALL') {
      resetAllSpecials();
      setTestDate(undefined);
      return ['Every Special is as new, and they go by today.'];
    }
    const id = arg?.toLowerCase();
    if (!id || !specialById(id)) return [`No Special called ${arg ?? '(none)'}. SPECIALS lists them.`];
    if (v === 'RESET') resetSpecial(id);
    else forceSpecial(id, v === 'LOCK' ? 'lock' : 'unlock');
    return [`${id}: ${standing(id, specialsNow())}`];
  }
  if (v !== 'LIST') return [`Unknown option ${verb}.`, ...HELP];
  const now = specialsNow();
  const width = Math.max(...SPECIALS.map((s) => s.id.length));
  return [
    `Specials on ${day(now)}${testDate() ? ' (test date)' : ''}`,
    '',
    ...SPECIALS.flatMap((s) => [`${s.id.padEnd(width)}  ${s.arrival.padEnd(11)} ${standing(s.id, now)}`]),
    '',
    'SPECIALS /? for LOCK, UNLOCK, RESET and DATE.',
  ];
}
