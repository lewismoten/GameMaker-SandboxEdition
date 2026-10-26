// The levels in order: each one's files, its light, its block set, the camel's load, its
// sound set and its monsters' options.
import type { Light, Pal } from '../art/pal';
import { cityBlocks } from '../blocks/city';
import { desertBlocks } from '../blocks/desert';
import { eyeBlocks } from '../blocks/eye';
import { tailorBlocks } from '../blocks/tailor';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import type { Form } from '../sprites/sprites';
import { city, desert, eye, tailor, type Level } from './maps';

interface LevelDef {
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
  {
    file: 'city',
    desc: 'The City Gate',
    light: 'morning',
    blocks: cityBlocks,
    build: city,
    form: 'loaded',
    snd: 'city',
    mons: { strut: 6, dog: 3, guard: 2 },
    view: [16, 4],
  },
  { file: 'desert', desc: 'The Desert Road', light: 'noon', blocks: desertBlocks, build: desert, form: 'saddled', snd: 'desert', mons: {}, view: [47, 4] },
  {
    file: 'tailor',
    desc: "The Tailor's Shop",
    light: 'lamp',
    blocks: tailorBlocks,
    build: tailor,
    form: 'shod',
    snd: 'tailor',
    mons: { snip: 4 },
    view: [20, 4],
  },
  { file: 'eye', desc: 'The Eye of the Needle', light: 'night', blocks: eyeBlocks, build: eye, form: 'bare', snd: 'eye', mons: { roll: [4, 2] }, view: [2, 1] },
];
