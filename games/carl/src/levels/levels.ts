// The levels in order: each one's files, its block set and light, its sound set, its song and
// its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { theAux, theBed, theCouch, theWalls, theWild, theWindow, type Level } from './maps';

export type BlockSet = 'house' | 'yard';

export interface LevelDef {
  file: string;
  desc: string;
  set: BlockSet;
  light: Light;
  build: (b: BlockBook) => Level;
  snd: Place;
  /** The level's song (sound/song.ts allSongs()). */
  song: 'couch' | 'walls' | 'bed' | 'window' | 'wild' | 'aux';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'couch', desc: 'The Couch', set: 'house', light: 'day', build: theCouch, snd: 'house', song: 'couch', mons: {}, view: [20, 5] },
  { file: 'walls', desc: 'The Walls', set: 'house', light: 'kitchen', build: theWalls, snd: 'kitchen', song: 'walls', mons: { wind: 16 }, view: [18, 3] },
  { file: 'bed', desc: 'Joins Me in Bed', set: 'house', light: 'night', build: theBed, snd: 'bed', song: 'bed', mons: { wind: 24 }, view: [10, 5] },
  { file: 'window', desc: 'The Open Window', set: 'yard', light: 'yard', build: theWindow, snd: 'yard', song: 'window', mons: { patrol: 6 }, view: [0, 3] },
  { file: 'wild', desc: 'Carl Has Seen Things', set: 'yard', light: 'doc', build: theWild, snd: 'wild', song: 'wild', mons: { patrol: 6 }, view: [13, 6] },
  { file: 'aux', desc: 'The Aux Cord', set: 'house', light: 'gloom', build: theAux, snd: 'aux', song: 'aux', mons: { wind: 14, mop: 4 }, view: [36, 5] },
];
