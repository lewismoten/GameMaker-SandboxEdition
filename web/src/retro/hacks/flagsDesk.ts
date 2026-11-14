// FLAGS items for the desk's newer remembered state: Starter course grades (and so the
// graduations), Scoot's mail and postcard, the desk buddy, the rubber chicken, and the last visit
// "What's new" remembers. Browser progress flags only; a game's save file is never written.
// Nothing here names a secret game: the postcard counts stamps without saying whose they are.
import { CEREMONIES, needed, stageGames } from '../../project/ceremonies';
import { gpa, isB, parseGrades, type Grade, type Grades } from '../../project/grades';
import { COURIER_KEY, loadCourier, saveCourier } from '../../courier/courierStore';
import { LETTERS } from '../../courier/tables';
import { CHICKEN_KEY, chickenNow, setChicken } from '../../chicken/chickenState';
import { SEEN_KEY, isDay, readSeen, writeSeen } from '../../tour/seenDay';
import { deskNow } from '../dos/deskClock';
import { FlagError, type FlagItem } from './flagsTypes';

const GRADES_KEY = 'gm-course-grades';
const BUDDY_KEY = 'gm-desk-buddy';
const LADDER: readonly Grade[] = ['A', 'B', 'B-', 'C+', 'C', 'C-', 'D+'];

const tell = (e: string) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(e));
};
const read = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null): void => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
};

// ---- Starter grades --------------------------------------------------------------------------

const grades = (): Grades => {
  try {
    return parseGrades(JSON.parse(read(GRADES_KEY) ?? 'null'));
  } catch {
    return {};
  }
};
const putGrades = (g: Grades) => {
  write(GRADES_KEY, Object.keys(g).length ? JSON.stringify(g) : null);
  tell('course-grades-changed');
};

/** The Starters a stage word covers: 1 to 6, or ALL for every stage in course order. */
export function courseScope(word: string | undefined): string[] {
  const w = (word ?? '').toUpperCase();
  if (w === 'ALL') return CEREMONIES.flatMap((c) => stageGames(c));
  const n = Number(w);
  if (!/^\d$/.test(w) || n < 1 || n > CEREMONIES.length) throw new FlagError(`Which stage? 1 to ${CEREMONIES.length}, or ALL`);
  return stageGames(CEREMONIES[n - 1]);
}

/** "3", ALL or NONE out of `total`. */
function howMany(word: string | undefined, total: number): number {
  const w = (word ?? '').toUpperCase();
  if (w === 'ALL') return total;
  if (w === 'NONE') return 0;
  if (!/^\d+$/.test(w) || Number(w) > total) throw new FlagError(`How many? 0 to ${total}, ALL or NONE`);
  return Number(w);
}

export function parseGradeWord(word: string | undefined): Grade {
  const g = LADDER.find((x) => x === (word ?? 'A').toUpperCase());
  if (!g) throw new FlagError(`A grade is one of ${LADDER.join(' ')}`);
  return g;
}

/** The first n of `scope` get `grade`; the others in `scope` lose theirs. Pure. */
export function withGrades(have: Grades, scope: string[], n: number, grade: Grade): Grades {
  const out = { ...have };
  scope.forEach((id, i) => {
    if (i < n) out[id] = grade;
    else delete out[id];
  });
  return out;
}

const gradesItem: FlagItem = {
  id: 'GRADES',
  label: 'Starter course grades (graduations)',
  async show() {
    const g = grades();
    const all = CEREMONIES.flatMap((c) => stageGames(c));
    const graded = all.filter((id) => g[id]);
    const stages = CEREMONIES.map((c, i) => `${i + 1}:${stageGames(c).filter((id) => isB(g[id])).length}/${needed(c)}`).join(' ');
    return `${graded.length} of ${all.length} Starters graded, GPA ${gpa(graded.map((id) => g[id])) ?? 'none'}; B+ vs needed ${stages}`;
  },
  async set(words) {
    const scope = courseScope(words[0]);
    const n = howMany(words[1], scope.length);
    const grade = parseGradeWord(words[2]);
    putGrades(withGrades(grades(), scope, n, grade));
    return `${n} of ${scope.length} Starters now have a ${grade}; the rest of that scope have none (a finished game still counts as an A).`;
  },
  async clear(words) {
    const scope = courseScope(words[0] ?? 'ALL');
    putGrades(withGrades(grades(), scope, 0, 'A'));
    return `Grades cleared for ${words[0] ? `stage ${words[0]}` : 'every stage'}.`;
  },
  async reset() {
    putGrades({});
    return 'No Starter has a grade; the transcript is blank.';
  },
};

// ---- Scoot's mail and postcard ---------------------------------------------------------------

const courierItem: FlagItem = {
  id: 'COURIER',
  label: "Scoot's mail and postcard",
  async show() {
    const c = loadCourier();
    const stamps = c.postcards.find((p) => p.here)?.stamps.length ?? 0;
    const unread = c.mail.filter((m) => !m.read).length;
    return `${c.mail.length} of ${LETTERS.length} letters in the mail (${unread} unread), ${stamps} stamps${c.out ? '; Scoot is away on a trip' : ''}`;
  },
  async set(words) {
    if ((words[0] ?? '').toUpperCase() !== 'MAIL') throw new FlagError('SET COURIER MAIL <n|ALL|NONE> puts that many letters in the mail, unread');
    const n = howMany(words[1], LETTERS.length);
    const c = loadCourier();
    const day = deskNow().toISOString().slice(0, 10);
    const ids = LETTERS.map((l) => l.id);
    c.mail = ids
      .slice(0, n)
      .reverse()
      .map((id) => ({ id, day, read: false }));
    c.got = [...c.got.filter((id) => !ids.includes(id)), ...ids.slice(0, n)];
    saveCourier(c);
    return `${n} of ${LETTERS.length} letters now sit in the mail, unread; the rest wait for a BBS call.`;
  },
  async clear() {
    return this.set!(['MAIL', 'NONE']);
  },
  async reset() {
    write(COURIER_KEY, null);
    tell('courier-changed');
    return 'Scoot has no mail, stamps, trips or home yet; they start over.';
  },
};

// ---- the desk buddy --------------------------------------------------------------------------

function buddy(): Record<string, unknown> {
  try {
    const o: unknown = JSON.parse(read(BUDDY_KEY) ?? '{}');
    return o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const buddyItem: FlagItem = {
  id: 'BUDDY',
  label: 'Desk buddy (Scoot)',
  async show() {
    const b = buddy();
    return `${b.quiet === true ? 'quiet' : 'chatty'}; ${b.met === true ? `met${typeof b.helloDay === 'string' ? `, last hello ${b.helloDay}` : ''}` : 'not met yet'}`;
  },
  async set(words) {
    const w = (words[0] ?? '').toUpperCase();
    if (w !== 'QUIET' && w !== 'CHATTY') throw new FlagError('SET BUDDY QUIET or CHATTY');
    write(BUDDY_KEY, JSON.stringify({ ...buddy(), quiet: w === 'QUIET' }));
    tell('courier-changed');
    return `The buddy is ${w.toLowerCase()}.`;
  },
  async clear() {
    return this.reset!();
  },
  async reset() {
    write(BUDDY_KEY, null);
    tell('courier-changed');
    return 'The buddy has not met you yet and is chatty again.';
  },
};

// ---- the rubber chicken ----------------------------------------------------------------------

const chickenItem: FlagItem = {
  id: 'CHICKEN',
  label: 'Rubber chicken',
  show: async () => (chickenNow() === 'lady' ? 'Lady Regina (tiara)' : 'Sir Reginald'),
  async set(words) {
    const w = (words[0] ?? '').toUpperCase();
    if (w !== 'SIR' && w !== 'LADY') throw new FlagError('SET CHICKEN SIR or LADY');
    setChicken(w === 'LADY' ? 'lady' : 'sir');
    return w === 'LADY' ? 'The chicken is Lady Regina.' : 'The chicken is Sir Reginald.';
  },
  async clear() {
    return this.reset!();
  },
  async reset() {
    setChicken('sir');
    return 'The chicken is Sir Reginald.';
  },
};

// ---- "What's new" ----------------------------------------------------------------------------

const tourItem: FlagItem = {
  id: 'TOUR',
  label: 'Last visit for "What\'s new"',
  show: async () => readSeen() ?? 'no visit recorded',
  async set(words) {
    const day = words[0] ?? '';
    if (!isDay(day)) throw new FlagError('SET TOUR needs a day written YYYY-MM-DD, such as 2026-10-01');
    writeSeen(day);
    return `The last visit counts as ${day}; the tour's What's new offers what came after.`;
  },
  async clear() {
    return this.reset!();
  },
  async reset() {
    write(SEEN_KEY, null);
    return 'No visit is recorded; the next one counts as a first visit and offers nothing as new.';
  },
};

const specials: FlagItem = {
  id: 'SPECIALS',
  label: 'Specials (kept, locked)',
  show: async () => undefined,
  elsewhere: 'SPECIALS.EXE does the Specials: LOCK, UNLOCK, RESET, DATE.',
};

export const DESK_ITEMS: readonly FlagItem[] = [gradesItem, courierItem, buddyItem, chickenItem, tourItem, specials];

/** The keys these items keep (FLAGS /BACKUP holds them). */
export const DESK_KEYS = [GRADES_KEY, COURIER_KEY, BUDDY_KEY, CHICKEN_KEY, SEEN_KEY, 'gm-honors-dates'] as const;
