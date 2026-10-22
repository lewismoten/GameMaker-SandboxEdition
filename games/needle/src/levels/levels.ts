// The levels in order: each one's files, its light, its block set, the camel's load, its
// sound set and its monsters' options.
import type { Light, Pal } from '../art/pal';
import { cityBlocks } from '../blocks/city';
import { desertBlocks } from '../blocks/desert';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import type { Form } from '../sprites/sprites';
import { city, desert, type Level } from './maps';

export interface LevelDef {
  /** The level's .PAL, .MAP, .MON, .BBL and .CMF are named for it. */
  file: string;
  desc: string;
  light: Light;
  blocks: (pal: Pal) => Kit;
  build: (b: Kit['book']) => Level;
  form: Form;
  snd: Place;
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'city', desc: 'The City Gate', light: 'morning', blocks: cityBlocks, build: city, form: 'loaded', snd: 'city', mons: { strut: 6, dog: 3 }, view: [16, 4] },
  { file: 'desert', desc: 'The Desert Road', light: 'noon', blocks: desertBlocks, build: desert, form: 'saddled', snd: 'desert', mons: {}, view: [40, 4] },
];
