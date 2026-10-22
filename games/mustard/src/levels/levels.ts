// The levels in order: each one's files, its light, the form the seed has grown into, its
// sound set and its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { Form, MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { dust, mound, mountain, sky, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  form: Form;
  snd: Place;
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'mound', desc: 'The Mound', light: 'dawn', build: mound, form: 'seed', snd: 'garden', mons: {}, view: [0, 4] },
  { file: 'dust', desc: 'Deep Down in the Dust', light: 'under', build: dust, form: 'sprout', snd: 'dust', mons: {}, view: [2, 4] },
  { file: 'mountain', desc: 'The Mountain', light: 'day', build: mountain, form: 'plant', snd: 'mountain', mons: {}, view: [8, 8] },
  { file: 'sky', desc: "The Palm of God's Hand", light: 'gold', build: sky, form: 'plant', snd: 'sky', mons: { crow: 5 }, view: [5, 0] },
];
