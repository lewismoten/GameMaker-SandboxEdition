// The graduations: one small game per stage of the Starters ("Graduation: First Steps") that opens once
// most of that stage's Starters are Done, and hands over a certificate; the last, "The Sandbox Diploma",
// needs all six certificates. Pure rules, no DOM: the Starters tab, the Certificates dialog and the desk
// frame read this. Earned = the ceremony's game id is in the achievements finished set (homeDone.ts
// loadFinished). Design: .for-lewis/research/ceremonies/2026-11-05-design.md.
import { STARTER_GROUPS } from './starter';

export interface Ceremony {
  /** The game id (games/<id>). */
  id: string;
  /** The stage name: "First Steps". The game is "Graduation: First Steps", the paper "Certificate of First Steps". */
  stage: string;
  /** Names of the STARTER_GROUPS this stage covers; empty for the diploma. */
  groups: string[];
  /** What the certificate says the player can do. */
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
    groups: ['Drawing with Blocks', 'Showcase Tricks'],
    skills: 'drawn and animated blocks, light and dark, the big-game tricks',
  },
];

/** The last graduation: it opens when all six certificates are earned. */
export const DIPLOMA: Ceremony = { id: 'graduation-diploma', stage: 'The Sandbox Diploma', groups: [], skills: 'Game Maker, first class' };

const ALL: Ceremony[] = [...CEREMONIES, DIPLOMA];

/** A graduation game (not one of the Starters in STARTER_GROUPS). */
export const isCeremony = (id: string): boolean => ALL.some((c) => c.id === id);

/** The game's title: "Graduation: First Steps". */
export const ceremonyTitle = (c: Ceremony): string => (c === DIPLOMA ? DIPLOMA.stage : `Graduation: ${c.stage}`);

/** What the paper is called: "Certificate of First Steps"; the diploma is "The Sandbox Diploma". */
export const certificateTitle = (c: Ceremony): string => (c === DIPLOMA ? DIPLOMA.stage : `Certificate of ${c.stage}`);

/** The Starters a stage covers, in group order. */
export const stageGames = (c: Ceremony): string[] => c.groups.flatMap((g) => STARTER_GROUPS.find((x) => x.name === g)?.games ?? []);

/** How many of a stage's Starters must be Done: at least three of every four, rounded up. */
export const needed = (c: Ceremony): number => Math.ceil((stageGames(c).length * 3) / 4);

export type CeremonyState =
  | { state: 'locked'; done: number; needed: number; progress: string; missing: string[] }
  | { state: 'open'; done: number; needed: number }
  | { state: 'earned'; done: number; needed: number };

/** Where one graduation stands, given the set of finished game ids. Nothing is stored: it is worked out each time. For the diploma, `missing` lists the certificate game ids. */
export function ceremonyState(c: Ceremony, finished: ReadonlySet<string>): CeremonyState {
  const games = c === DIPLOMA ? CEREMONIES.map((x) => x.id) : stageGames(c);
  const done = games.filter((id) => finished.has(id)).length;
  const need = c === DIPLOMA ? games.length : needed(c);
  if (finished.has(c.id)) return { state: 'earned', done, needed: need };
  if (done >= need) return { state: 'open', done, needed: need };
  return { state: 'locked', done, needed: need, progress: `${done} of ${need} needed`, missing: games.filter((id) => !finished.has(id)) };
}

/** Every graduation's state, in order, the diploma last. */
export const allCeremonyStates = (finished: ReadonlySet<string>): { ceremony: Ceremony; state: CeremonyState }[] =>
  ALL.map((ceremony) => ({ ceremony, state: ceremonyState(ceremony, finished) }));

export type Level = 'Beginner' | 'Maker' | 'Designer' | 'Master' | 'Graduate';

/** The desk frame's title for the highest level earned, or undefined when no certificate is. The diploma is Graduate; 1-2 certificates Beginner, 3-4 Maker, 5 Designer, 6 Master. */
export function highestLevel(finished: ReadonlySet<string>): Level | undefined {
  if (finished.has(DIPLOMA.id)) return 'Graduate';
  const n = CEREMONIES.filter((c) => finished.has(c.id)).length;
  if (n === 0) return undefined;
  return n <= 2 ? 'Beginner' : n <= 4 ? 'Maker' : n === 5 ? 'Designer' : 'Master';
}
