// The levels in order: each one's files, its light, its sound set, its song, its monsters'
// options and which of your two block sets it loads (the last level's has the foam sword).
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { HALL_TOP, fakeWoods, fogHall, lastHall, zombieParade, type Level } from './maps';

export interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  snd: Place;
  /** The level's song (sound/song.ts allSongs()). */
  song: 'foyer' | 'parade' | 'webs' | 'exit';
  mons: MonsterOptions;
  /** Your blocks: plain, or holding the $12 foam sword. */
  cbl: 'smirked' | 'sword';
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'foyer', desc: 'Mild Scares for All Ages', light: 'fog', build: fogHall, snd: 'foyer', song: 'foyer', mons: { lily: [[0, -11]], ghost: 5 }, cbl: 'smirked', view: [7, 0] },
  { file: 'parade', desc: 'GET DOWN!', light: 'crypt', build: zombieParade, snd: 'parade', song: 'parade', mons: { lily: [[10, 0], [10, -7], [22, -7], [22, 0]], zombie: 3 }, cbl: 'smirked', view: [8, 3] },
  { file: 'webs', desc: 'Strategic Repositioning', light: 'moon', build: fakeWoods, snd: 'webs', song: 'webs', mons: { lily: [[0, 5], [18, 5], [18, 10], [28, 10]], pats: true }, cbl: 'smirked', view: [3, 1] },
  { file: 'exit', desc: 'The Emergency Exit Sign', light: 'exit', build: lastHall, snd: 'exit', song: 'exit', mons: { sword: true }, cbl: 'sword', view: [7, HALL_TOP - 2] },
];
