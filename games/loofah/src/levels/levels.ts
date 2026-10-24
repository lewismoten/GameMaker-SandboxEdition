// The acts in order: each one's files, its light, its sound set and its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { aisle, bathroom, home, shower, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  snd: Place;
  /** The act's song (sound/song.ts allSongs()). */
  song: 'bath' | 'aisle' | 'home' | 'shower';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'bath', desc: 'Cursed in the Shower', light: 'bath', build: bathroom, snd: 'bath', song: 'bath', mons: { run: 3, fall: 8 }, view: [8, 5] },
  { file: 'aisle', desc: 'The Forest-Dark Aisle', light: 'aisle', build: aisle, snd: 'aisle', song: 'aisle', mons: { run: 3 }, view: [10, 3] },
  { file: 'home', desc: 'You Crossed a Line', light: 'home', build: home, snd: 'home', song: 'home', mons: { run: 2 }, view: [16, 8] },
  { file: 'shower', desc: 'Scrubbus Maximus', light: 'shower', build: shower, snd: 'shower', song: 'shower', mons: {}, view: [14, 0] },
];
