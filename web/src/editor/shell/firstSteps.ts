// "First steps": a beginner's checklist for a game started from the ready-to-play starter. Each
// step ticks itself as the game changes: the starter's files are fingerprinted when it is made,
// so changing a block, the map, the hero or a monster shows. The state lives in the companion
// file (editor-only), never in the game's own files. The panel that shows it is firstStepsPanel.ts.
import type { Project } from '../core/project';
import { ADVTYPE, ENDTYPE, type Game } from '../../formats/game';
import { kindOf } from '../core/project';

const FIRST_STEPS = 'firstSteps';

interface FirstStepsState {
  /** Each starter file's fingerprint, by name. */
  base: Record<string, number>;
  /** Play tested at least once. */
  played?: boolean;
  /** The panel has been shown once (it opens by itself the first time). */
  seen?: boolean;
  /** Every step was done (the achievement is given once). */
  done?: boolean;
}

/** Facts about the game a step can be judged by. */
interface StepFacts {
  /** File extensions with at least one file that differs from the starter's (or is new). */
  changed: Set<string>;
  game: Game;
  has: (file: string) => boolean;
  played: boolean;
  /** Maps with a saved Level check. */
  checked: boolean;
}

/** A chapter of the Ultimate Owner's Guide (its id) and the section to read there. */
interface StepGuide {
  chapter: string;
  section: string;
}

export interface Step {
  id: string;
  icon: string;
  title: string;
  how: string;
  /** The file to open to do it (by kind), or the game itself. */
  open: string[] | 'gam' | 'play';
  guide?: StepGuide;
  done: (f: StepFacts) => boolean;
}

const endScene = (g: Game) => g.scenes.findIndex((s) => s.gametype === ENDTYPE);

export const STEPS: Step[] = [
  {
    id: 'play',
    icon: '▶',
    title: 'Play the starter level',
    how: 'Press ▶ Play test to see what you are starting from. Esc or Stop comes back.',
    open: 'play',
    done: (f) => f.played,
  },
  {
    id: 'palette',
    icon: '🎨',
    title: 'Change a color',
    how: 'In the palette, pick a color and move its sliders. Everything drawn in it changes.',
    open: ['pal'],
    guide: { chapter: 'palettes', section: 'Palettes: One Map, Many Moods' },
    done: (f) => f.changed.has('pal'),
  },
  {
    id: 'blocks',
    icon: '🧱',
    title: 'Draw a block of scenery',
    how: 'In the background blocks, pick one and paint it pixel by pixel.',
    open: ['bbl'],
    guide: { chapter: 'blocks', section: 'Blocks That Behave' },
    done: (f) => f.changed.has('bbl'),
  },
  {
    id: 'map',
    icon: '🗺',
    title: 'Build your level',
    how: 'In the map, choose a block on the left and paint walls, floors and secrets.',
    open: ['map'],
    guide: { chapter: 'levels', section: 'Levels Players Forgive' },
    done: (f) => f.changed.has('map'),
  },
  {
    id: 'hero',
    icon: '🦸',
    title: 'Make the hero yours',
    how: 'In the character, change how it moves or its hit points; draw it in the character blocks.',
    open: ['chr', 'cbl'],
    guide: { chapter: 'actors', section: 'The hero’s own tricks' },
    done: (f) => f.changed.has('chr') || f.changed.has('cbl'),
  },
  {
    id: 'monster',
    icon: '👾',
    title: 'Change a monster',
    how: 'In the monsters, change one’s path or speed; redraw it in the monster blocks.',
    open: ['mon', 'mbl'],
    guide: { chapter: 'actors', section: 'Ways to move' },
    done: (f) => f.changed.has('mon') || f.changed.has('mbl'),
  },
  {
    id: 'sound',
    icon: '🔊',
    title: 'Give it a sound of your own',
    how: 'In the sound set, try 🎛 Make one with the sound effect maker, or draw the PC speaker steps.',
    open: ['snd'],
    guide: { chapter: 'sounds', section: 'The Sound Set, Slot by Slot' },
    done: (f) => f.changed.has('snd') || f.changed.has('voc'),
  },
  {
    id: 'exit',
    icon: '🚪',
    title: 'Add a way to win',
    how: 'In the game (Integrator), select Level 1. Under its links, choose Game Won and pick the exit block on the map.',
    open: 'gam',
    guide: { chapter: 'scenes', section: 'How a link works' },
    done: (f) => {
      const end = endScene(f.game);
      return end >= 0 && f.game.scenes.some((s) => s.gametype === ADVTYPE && s.links.some((l) => l.toScene === end));
    },
  },
  {
    id: 'won',
    icon: '🏆',
    title: 'Make a Game won screen',
    how: 'In the Integrator, open Game Won and choose a picture or text screen for “Game won graphic”.',
    open: 'gam',
    guide: { chapter: 'show', section: 'Text screens and slide shows' },
    done: (f) => {
      const end = f.game.scenes[endScene(f.game)];
      return !!end?.files[0] && f.has(end.files[0]);
    },
  },
  {
    id: 'check',
    icon: '🩺',
    title: 'Run the Level check',
    how: 'In the map, press 🩺 Level check. It plays the level and points out traps and dead ends.',
    open: ['map'],
    guide: { chapter: 'check', section: 'What the Level check plays' },
    done: (f) => f.checked,
  },
];

/** A file's fingerprint (FNV-1a, 32 bits): enough to tell whether it changed. */
export function fingerprint(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h;
}

/** Starts the checklist for a new starter game: remembers how every file began. */
export function beginFirstSteps(project: Project): void {
  const base: Record<string, number> = {};
  for (const [name, bytes] of project.files.entries()) base[name] = fingerprint(bytes);
  project.setExtras(project.gam, FIRST_STEPS, { base } satisfies FirstStepsState);
}

export function firstStepsState(project: Project): FirstStepsState | undefined {
  const s = project.extras<FirstStepsState | undefined>(project.gam, FIRST_STEPS, undefined);
  return s && typeof s === 'object' && s.base && typeof s.base === 'object' ? s : undefined;
}

export function updateFirstSteps(project: Project, change: Partial<FirstStepsState>): void {
  const s = firstStepsState(project);
  if (s) project.setExtras(project.gam, FIRST_STEPS, { ...s, ...change });
}

/** Play testing ticks the first step (only in a game that has the checklist). */
export function notePlayed(project: Project): void {
  const s = firstStepsState(project);
  if (s && !s.played) updateFirstSteps(project, { played: true });
}

/** What the steps are judged by, now. */
function stepFacts(project: Project, state: FirstStepsState): StepFacts {
  const changed = new Set<string>();
  for (const [name, bytes] of project.files.entries()) {
    if (name === project.gam) continue;
    const was = state.base[name];
    if (was === undefined || was !== fingerprint(bytes)) changed.add(kindOf(name));
  }
  const maps = project.files.byExtension('map');
  return {
    changed,
    game: project.game(),
    has: (f) => project.files.has(f),
    played: !!state.played,
    checked: maps.some((m) => project.extras<unknown>(m, 'levelCheck', undefined) !== undefined),
  };
}

/** Which steps are done, in STEPS order. */
export function stepsDone(project: Project, state: FirstStepsState): boolean[] {
  const facts = stepFacts(project, state);
  return STEPS.map((s) => s.done(facts));
}
