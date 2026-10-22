// The levels in order: each one's files, its light, its wall, its song and its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { MonsterOptions } from '../characters';
import { course, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  /** The level's song (sound/song.ts allSongs()). */
  song: 'course' | 'lab' | 'sewer' | 'tower';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [{ file: 'course', desc: 'The Course', light: 'course', build: course, song: 'course', mons: {}, view: [6, 4] }];
