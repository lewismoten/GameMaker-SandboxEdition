// Every Special: a limited-time game (games/<id>, about.json "series": "special") with the window
// it is out (calendar.ts), how it reaches the 1994 desk, and its theme. During its window a
// Special is listed in the home page's Special tab; the desk's arrival is the in-story way to
// find it (it then lands in the disk box). registry.test.ts checks every built Special is here.
// No DOM.
import type { Window } from './calendar';

/**
 * How a Special reaches the desk: a lone floppy in an empty spot on the desk, a file on The
 * Sandbox BBS, shaken loose by tapping the wristwatch, something seen out the window, or the
 * wall phone's subscription offer (which keeps it for good). 'library' only: it is in the
 * Special tab and nowhere on the desk.
 */
export type Arrival = 'floppy' | 'bbs' | 'watch' | 'window' | 'phone' | 'library';

export interface Special {
  /** The game's folder under games/, and its catalog id. */
  id: string;
  window: Window;
  arrival: Arrival;
  /** Days a BBS keeps its file after the window closes, for someone who forgot to grab it. */
  linger?: number;
  /** What it is about, in a few words (the DOS utility's list and the design notes). */
  theme: string;
}

export const SPECIALS: readonly Special[] = [
  {
    id: 'thank-you-parade',
    window: { day: { on: 'date', month: 11, day: 11 }, offset: -1, days: 3 },
    arrival: 'floppy',
    theme: 'Veterans Day: the hometown thank-you parade',
  },
  {
    id: 'lucky-cat',
    window: { day: { on: 'weekday-date', weekday: 5, day: 13 } },
    arrival: 'bbs',
    linger: 3,
    theme: 'Friday the 13th: a black cat proves she is lucky',
  },
  {
    id: 'pass-the-pie',
    window: { day: { on: 'nth', month: 11, weekday: 4, n: 4 }, days: 4 },
    arrival: 'library',
    theme: 'Thanksgiving: a storybook dinner run, and a turkey with a grudge',
  },
  {
    id: 'mountain-next-door',
    window: { day: { on: 'nth', month: 11, weekday: 4, n: 4 }, offset: 1, days: 3 },
    arrival: 'floppy',
    theme: 'The day after Thanksgiving: a mountain moves in next door, and Tess marks its trail home',
  },
  {
    id: 'noodle-observatory',
    window: { day: { on: 'date', month: 12, day: 14 }, days: 3 },
    arrival: 'floppy',
    theme: 'Monkey Day: Nell builds a kitchen observatory to look at a very odd moon',
  },
  {
    id: 'stick-man-stars',
    window: { day: { on: 'date', month: 12, day: 21 }, days: 3 },
    arrival: 'bbs',
    linger: 3,
    theme: 'The longest night: a stick figure picks stars out of the sky and tosses them at little repo houses',
  },
];

/** The Special with this catalog id, or undefined. */
export const specialById = (id: string): Special | undefined => SPECIALS.find((s) => s.id === id);
