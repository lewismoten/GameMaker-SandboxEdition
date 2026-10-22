// The levels in order: each one's files, its light, the form the seed has grown into, its
// sound set and its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { Form, MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { dust, mound, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  form: Form;
  snd: Place;
  mons: MonsterOptions;
}

export const LEVELS: LevelDef[] = [
  { file: 'mound', desc: 'The Mound', light: 'dawn', build: mound, form: 'seed', snd: 'garden', mons: {} },
  { file: 'dust', desc: 'Deep Down in the Dust', light: 'under', build: dust, form: 'sprout', snd: 'dust', mons: {} },
];
