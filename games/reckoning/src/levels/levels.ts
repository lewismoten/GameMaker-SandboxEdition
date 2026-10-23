// The acts in order: each one's files, its light, the form the man is in, its sound set and its
// monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { Form, MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { bedroom, dash, fridge, reckoning, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  form: Form;
  snd: Place;
  /** The act's song (sound/song.ts allSongs()). */
  song: 'sneak' | 'fridge' | 'dash' | 'hell';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'bedroom', desc: '3:17 A.M.', light: 'night', build: bedroom, form: 'leo', snd: 'bedroom', song: 'sneak', mons: {}, view: [0, 4] },
  { file: 'fridge', desc: 'The Enemy-Lover', light: 'fridge', build: fridge, form: 'leo', snd: 'fridge', song: 'fridge', mons: { shelf: 3 }, view: [30, 0] },
  { file: 'dash', desc: 'Oh No No No', light: 'dash', build: dash, form: 'leo', snd: 'dash', song: 'dash', mons: { gurgle: 2 }, view: [14, 4] },
  { file: 'hell', desc: 'The Reckoning', light: 'hell', build: reckoning, form: 'hell', snd: 'hell', song: 'hell', mons: {}, view: [12, 4] },
];
