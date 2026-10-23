// The levels in order: each one's files, its block set, who plays it, its light, its sound set,
// its song and its monsters' options.
import type { Light } from '../art/pal';
import type { BlockBook, BlockSet } from '../blocks/blocks';
import type { MonsterOptions, Who } from '../characters';
import type { Place } from '../sound/sounds';
import type { SongName } from '../sound/song';
import { banquet, baths, battle, kitchen, roofs, theater, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  set: BlockSet;
  who: Who;
  light: Light;
  build: (b: BlockBook) => Level;
  snd: Place;
  song: SongName;
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'banquet', desc: 'Canis Meus Flatum Dedit', set: 'villa', who: 'marcus', light: 'banquet', build: banquet, snd: 'banquet', song: 'canis', mons: { run: 3 }, view: [9, 4] },
  // the horde charges along the ground from where it starts to the ditch, and tumbles in
  { file: 'battle', desc: 'Laudes Ignavi', set: 'campus', who: 'marcus', light: 'battle', build: battle, snd: 'battle', song: 'ignavi', mons: { charge: [[41, 0], [43, 2]], chargeSpeed: 2, fall: 1 }, view: [16, 4] },
  { file: 'roofs', desc: 'Titus Torquet Lingua', set: 'campus', who: 'marcus', light: 'roofs', build: roofs, snd: 'roofs', song: 'titus', mons: { run: 2 }, view: [24, 3] },
  { file: 'kitchen', desc: 'Felis Fortissimus', set: 'villa', who: 'felix', light: 'kitchen', build: kitchen, snd: 'kitchen', song: 'felis', mons: { run: 3 }, view: [14, 3] },
  { file: 'baths', desc: 'Canit Piscis Aureus', set: 'thermae', who: 'marcus', light: 'baths', build: baths, snd: 'baths', song: 'piscis', mons: {}, view: [22, 4] },
  { file: 'theater', desc: 'Silentium Ridentium', set: 'thermae', who: 'marcus', light: 'theater', build: theater, snd: 'theater', song: 'silentium', mons: {}, view: [20, 5] },
];
