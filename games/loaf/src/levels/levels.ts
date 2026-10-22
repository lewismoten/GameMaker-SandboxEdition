// The levels in order: each one's files, its light, the form the loaf is in, its sound set and
// its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { Form, MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { baskets, hillside, home, wicker, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  form: Form;
  snd: Place;
  /** The level's song (sound/song.ts allSongs()). */
  song: 'hill' | 'wicker' | 'baskets' | 'home';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'hill', desc: 'The Hungry Crowd', light: 'noon', build: hillside, form: 'loaf', snd: 'hill', song: 'hill', mons: { reach: 5 }, view: [0, 4] },
  { file: 'wicker', desc: 'The Wicker Wasteland', light: 'shade', build: wicker, form: 'loaf', snd: 'wicker', song: 'wicker', mons: {}, view: [6, 8] },
  { file: 'baskets', desc: 'Twelve Baskets Full', light: 'dusk', build: baskets, form: 'loaf', snd: 'baskets', song: 'baskets', mons: { feet: 5 }, view: [1, 4] },
  { file: 'home', desc: 'The Way Home', light: 'night', build: home, form: 'bundle', snd: 'home', song: 'home', mons: { girl: 6 }, view: [24, 4] },
];
