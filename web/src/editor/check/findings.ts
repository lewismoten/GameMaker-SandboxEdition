// What the level check reports: a finding says what is wrong, where, how much it matters, why
// players mind, and which part of The Ultimate Owner's Guide explains it. Each check has an id
// here with its guide section, so the panel, the badges and the upload checklist agree.

export type Severity = 'error' | 'warning' | 'info';

/** A chapter of The Ultimate Owner's Guide (manual/ultimate/plan.ts ids) and a heading in it. */
export interface GuideRef {
  chapter: 'craft' | 'levels' | 'upload' | 'testing' | 'sounds' | 'actors' | 'blocks' | 'logic' | 'show' | 'tricks' | 'check';
  section: string;
}

export interface Where {
  /** The scene (its number in the .gam file). */
  scene?: number;
  /** The map file and a cell on it (y * 100 + x). */
  map?: string;
  cell?: number;
  /** More cells of the same finding (a stuck area, every place a block is used). */
  cells?: number[];
  /** A block in a block set (.bbl or .mbl). */
  block?: { file: string; n: number };
  /** A monster in a .mon file. */
  monster?: { file: string; n: number };
  /** A sound slot in a .snd file. */
  sound?: { file: string; n: number };
  /** A whole file (a character, a text screen). */
  file?: string;
}

/** A one-click suggestion the panel can offer for a finding (generators/*.ts). */
export type FixId = 'ladder' | 'fill-hazard' | 'outline-monster' | 'key-sign' | 'open-gap' | 'shorten-cycle' | 'spread-healing' | 'landmark' | 'no-soltop';

export interface Finding {
  check: CheckId;
  severity: Severity;
  /** One line: what is wrong, here. */
  title: string;
  /** Extra facts (numbers measured). */
  detail?: string;
  where: Where;
  fix?: FixId;
}

export interface CheckInfo {
  name: string;
  /** Why players mind, in one line. */
  why: string;
  guide: GuideRef;
}

const L = (section: string): GuideRef => ({ chapter: 'levels', section });
const C = (section: string): GuideRef => ({ chapter: 'craft', section });

export const CHECKS = {
  stuck: { name: 'Stuck spots', why: 'A player who can’t go on or go back has to start over, and few will.', guide: L('Never trap the player') },
  unreachable: { name: 'Out of reach', why: 'A prize nobody can get to reads as a mistake, not a secret.', guide: L('Everything on the map has a job') },
  'link-unreached': { name: 'Exits never reached', why: 'A link the hero can’t touch is a door to nowhere.', guide: L('Never trap the player') },
  'blind-drop': {
    name: 'Blind drops',
    why: 'A fall faster than the view, or to a landing off screen, is a guess, not a choice.',
    guide: L('Look before you leap'),
  },
  'hazard-landing': {
    name: 'Hazard landings',
    why: 'A long fall onto something that hurts punishes a jump the player couldn’t aim.',
    guide: L('Look before you leap'),
  },
  'hazard-art': {
    name: 'Hazard art smaller than its cell',
    why: 'A block hurts through its whole cell, so thin spikes hurt the hero in thin air.',
    guide: L('Hazards that hit where they are drawn'),
  },
  opposites: { name: 'Opposite blocks side by side', why: 'One tap too many takes the hero the wrong way with no warning.', guide: L('Opposites apart') },
  'hurt-lock': {
    name: 'Hurts that hold',
    why: 'Something that holds the hero while it hurts drains a life with no way to dodge.',
    guide: { chapter: 'tricks', section: 'Hurts that happen once' },
  },
  'every-tick': {
    name: 'Scores or heals every tick',
    why: 'Standing still to farm points or health breaks the game’s balance.',
    guide: { chapter: 'tricks', section: 'Cameos that say hello once' },
  },
  counters: {
    name: 'Counters that run out',
    why: 'Running out of breath, keys or faith before the gate that needs them is a trap.',
    guide: { chapter: 'logic', section: 'Counters, Gates and Puzzles' },
  },
  telegraph: {
    name: 'Hazards that look safe',
    why: 'A hazard drawn in the colors of safe ground can’t be told apart the first time.',
    guide: L('Hazards that hit where they are drawn'),
  },
  mechanics: {
    name: 'Mechanics used once',
    why: 'An idea used once, in its plainest form, is a feature the game forgot to finish.',
    guide: L('Teach, test, twist'),
  },
  maze: { name: 'Mazes', why: 'A maze where every passage looks the same is guessing, not choosing.', guide: L('Mazes with a compass') },
  waits: { name: 'Long waits', why: 'Standing still for a lift or a timed block isn’t a challenge; it is waiting.', guide: L('Waiting is not a challenge') },
  density: { name: 'Crowded screens', why: 'More than two or three enemies on a screen is noise, not a fight.', guide: C('Fair enemies') },
  speed: {
    name: 'Enemies faster than the hero',
    why: 'A foe much faster than the hero can’t be escaped, only memorized.',
    guide: L('Everything on the map has a job'),
  },
  'start-threat': {
    name: 'A threat at the start',
    why: 'A level that hurts before the player has moved feels unfair.',
    guide: L('Everything on the map has a job'),
  },
  chasers: { name: 'Chasers that never let go', why: 'A monster that chases forever turns a level into a race.', guide: C('Fair enemies') },
  births: { name: 'Births that never rest', why: 'A birth block that keeps giving birth floods the screen.', guide: C('Fair enemies') },
  contrast: { name: 'Hard-to-see monsters', why: 'An enemy the color of the scenery hits players who never saw it.', guide: C('Fair enemies') },
  sounds: { name: 'Loud or long frequent sounds', why: 'A sound heard a hundred times has to be short and soft.', guide: C('Polish that players notice') },
  controls: { name: 'Keys never taught', why: 'A key the game never shows is a key most players never find.', guide: L('Controls the level teaches') },
  response: { name: 'Slow keys', why: 'A key that waits before it answers feels broken.', guide: L('Controls the level teaches') },
  'hero-speed': { name: 'Hero speed', why: 'A slow hero makes every level drag; an uneven walk feels slippery.', guide: C('A hero who feels right') },
  curve: {
    name: 'Difficulty curve',
    why: 'Levels should ask a little more each time; a curve that only gets easier loses players.',
    guide: C('A difficulty curve, not a cliff'),
  },
  checkpoints: {
    name: 'Long scenes',
    why: 'A death starts the scene over, so a long scene costs a lot each time.',
    guide: C('A difficulty curve, not a cliff'),
  },
  ending: { name: 'Ending and screens', why: 'A game with no won screen, credits or instructions feels unfinished.', guide: L('An ending, not an ad') },
  variety: { name: 'Variety', why: 'Every level the same blocks, monsters and song gets old fast.', guide: C('Variety') },
  coverage: {
    name: 'How far the check got',
    why: 'Parts the bot didn’t reach in time weren’t checked.',
    guide: { chapter: 'testing', section: 'A play-test checklist' },
  },
} satisfies Record<string, CheckInfo>;

export type CheckId = keyof typeof CHECKS;

export const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Findings sorted worst first, then by check. */
export function sortFindings(list: Finding[]): Finding[] {
  return [...list].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.check.localeCompare(b.check));
}

/** "(12, 40)" for a map cell. */
export const at = (cell: number) => `(${cell % 100}, ${Math.floor(cell / 100)})`;
