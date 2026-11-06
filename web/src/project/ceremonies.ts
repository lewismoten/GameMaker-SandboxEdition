// The stages of the Starters, their course numbers and transcript, and the graduations: one small game per
// stage ("Graduation: First Steps") that opens once the player has a B or better in at least three of every
// four of the stage's courses (grades.ts) and hands over its honors; the last, "The Sandbox Diploma", needs
// all six honors. Pure rules, no DOM: the Starters tab, the transcript and Certificates dialogs and the desk
// frame read this. Earned = the ceremony's game id is in the achievements finished set (homeDone.ts
// loadFinished). Design: .for-lewis/research/ceremonies/2026-11-05-design.md.
import { gpa, isB, withFinished, type Grade, type Grades } from './grades';
import { ADDED_LATER, STARTER_GROUPS } from './starter';

export interface Ceremony {
  /** The game id (games/<id>). */
  id: string;
  /** The stage name: "First Steps". The game is "Graduation: First Steps", the award "Honors in First Steps". */
  stage: string;
  /** Names of the STARTER_GROUPS this stage covers; empty for the diploma. */
  groups: string[];
  /** What the award says the player can do. */
  skills: string;
}

export const CEREMONIES: Ceremony[] = [
  { id: 'graduation-basics', stage: 'First Steps', groups: ['The Basics'], skills: 'walks, opens doors, meets monsters, collects coins, breaks walls' },
  {
    id: 'graduation-moving',
    stage: 'Moving and Pushing',
    groups: ['Moving and Pushing', 'Worlds That Push Back'],
    skills: 'power-ups, throwing, ice, water, gravity and wind',
  },
  {
    id: 'graduation-heroes',
    stage: 'Heroes and Foes',
    groups: ['Changing Your Hero', 'Foes and Bosses'],
    skills: 'new heroes and vehicles, foes that think, bosses that take hits',
  },
  {
    id: 'graduation-story',
    stage: 'Story and Finish',
    groups: ['Telling a Story', 'Putting It Together'],
    skills: 'words, pictures, sound, timing and a whole small game',
  },
  {
    id: 'graduation-wiring',
    stage: 'Wiring and Worlds',
    groups: ['Wiring and Puzzles', 'Bigger Worlds'],
    skills: 'counters that think, switches, many rooms, scrolling',
  },
  {
    id: 'graduation-blocks',
    stage: 'Blocks and Showcase',
    groups: ['Drawing with Blocks', 'Weather', 'Showcase Tricks'],
    // Append the new group here, even though its home tab is before Showcase: old course numbers stay put.
    groups: ['Drawing with Blocks', 'Showcase Tricks', 'Weather'],
    skills: 'drawn and animated blocks, light and dark, the big-game tricks',
  },
];

/** The last graduation: it opens when all six honors are earned. */
export const DIPLOMA: Ceremony = { id: 'graduation-diploma', stage: 'The Sandbox Diploma', groups: [], skills: 'Game Maker, first class' };

const ALL: Ceremony[] = [...CEREMONIES, DIPLOMA];

/** A graduation game (not one of the Starters in STARTER_GROUPS). */
export const isCeremony = (id: string): boolean => ALL.some((c) => c.id === id);

/** The game's title: "Graduation: First Steps". */
export const ceremonyTitle = (c: Ceremony): string => (c === DIPLOMA ? DIPLOMA.stage : `Graduation: ${c.stage}`);

/** What the award is called: "Honors in First Steps"; the diploma is "The Sandbox Diploma". */
export const certificateTitle = (c: Ceremony): string => (c === DIPLOMA ? DIPLOMA.stage : `Honors in ${c.stage}`);

/** The Starters (courses) a stage covers, in group order, then the stage's ADDED_LATER games in the order they came (so their course numbers follow the others'). */
export const stageGames = (c: Ceremony): string[] => {
  const all = c.groups.flatMap((g) => STARTER_GROUPS.find((x) => x.name === g)?.games ?? []);
  return [...all.filter((id) => !ADDED_LATER.includes(id)), ...ADDED_LATER.filter((id) => all.includes(id))];
};

/**
 * A course number: the stage's number (1 to 6) and the Starter's place in the stage, 101 for the first Starter of
 * the first stage, 201 for the first of the second. A graduation or a Starter in no stage has none.
 */
export function courseNumber(id: string): number | undefined {
  for (const [i, c] of CEREMONIES.entries()) {
    const at = stageGames(c).indexOf(id);
    if (at >= 0) return (i + 1) * 100 + at + 1;
  }
  return undefined;
}

/** The game with a course number, or undefined. */
export const courseGame = (n: number): string | undefined => stageGames(CEREMONIES[Math.floor(n / 100) - 1] ?? DIPLOMA)[(n % 100) - 1];

/** How many courses of a stage need a B or better: at least three of every four, rounded up. */
export const needed = (c: Ceremony): number => Math.ceil((stageGames(c).length * 3) / 4);

/** One line for a padlock tile. */
export const unlockRule = (c: Ceremony): string =>
  c === DIPLOMA ? 'Earn the honors from all six stages.' : `Get a B or better in ${needed(c)} of the ${stageGames(c).length} courses.`;

export interface TranscriptRow {
  id: string;
  /** 101, 102 ... */
  course: number;
  /** Undefined: never played. */
  grade: Grade | undefined;
}

export interface TranscriptStage {
  ceremony: Ceremony;
  rows: TranscriptRow[];
  /** The stage's GPA over its graded courses. */
  gpa: number | undefined;
}

/** Every course by stage with its grade, each stage's GPA and the overall GPA. `finished` gives an A to any game in it. */
export function transcript(grades: Readonly<Grades>, finished: ReadonlySet<string> = new Set()): { stages: TranscriptStage[]; gpa: number | undefined } {
  const g = withFinished(grades, finished);
  const stages = CEREMONIES.map((ceremony) => {
    const rows = stageGames(ceremony).map((id) => ({ id, course: courseNumber(id)!, grade: g[id] }));
    return { ceremony, rows, gpa: gpa(rows.map((r) => r.grade)) };
  });
  return { stages, gpa: gpa(stages.flatMap((s) => s.rows.map((r) => r.grade))) };
}

export type CeremonyState =
  | { state: 'locked'; done: number; needed: number; progress: string; missing: string[] }
  | { state: 'open'; done: number; needed: number }
  | { state: 'earned'; done: number; needed: number };

/** Where one graduation stands, given the grades and the set of finished game ids. Nothing is stored: it is worked out each time. For the diploma, `missing` lists the graduation game ids. */
export function ceremonyState(c: Ceremony, grades: Readonly<Grades>, finished: ReadonlySet<string>): CeremonyState {
  const g = withFinished(grades, finished);
  const games = c === DIPLOMA ? CEREMONIES.map((x) => x.id) : stageGames(c);
  const done = games.filter((id) => (c === DIPLOMA ? finished.has(id) : isB(g[id]))).length;
  const need = c === DIPLOMA ? games.length : needed(c);
  if (finished.has(c.id)) return { state: 'earned', done, needed: need };
  if (done >= need) return { state: 'open', done, needed: need };
  const missing = games.filter((id) => (c === DIPLOMA ? !finished.has(id) : !isB(g[id])));
  return { state: 'locked', done, needed: need, progress: `${done} of ${need} needed`, missing };
}

/** Every graduation's state, in order, the diploma last. */
export const allCeremonyStates = (grades: Readonly<Grades>, finished: ReadonlySet<string>): { ceremony: Ceremony; state: CeremonyState }[] =>
  ALL.map((ceremony) => ({ ceremony, state: ceremonyState(ceremony, grades, finished) }));

export type Level = 'Beginner' | 'Maker' | 'Designer' | 'Master' | 'Graduate';

/** The desk frame's title for the highest level earned, or undefined when no honors are. The diploma is Graduate; 1-2 honors Beginner, 3-4 Maker, 5 Designer, 6 Master. */
export function highestLevel(finished: ReadonlySet<string>): Level | undefined {
  if (finished.has(DIPLOMA.id)) return 'Graduate';
  const n = CEREMONIES.filter((c) => finished.has(c.id)).length;
  if (n === 0) return undefined;
  return n <= 2 ? 'Beginner' : n <= 4 ? 'Maker' : n === 5 ? 'Designer' : 'Master';
}
