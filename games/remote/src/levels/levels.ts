// The levels in order: each one's files, its light, its sound set, its song and its monsters'
// options.
import type { Light } from '../art/pal';
import type { BlockBook } from '../blocks/blocks';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { kitchen, livingRoom, theRide, theVoid, type Level } from './maps';

interface LevelDef {
  file: string;
  desc: string;
  light: Light;
  build: (b: BlockBook) => Level;
  snd: Place;
  /** The level's song (sound/song.ts allSongs()). */
  song: 'den' | 'kitchen' | 'void' | 'ride';
  mons: MonsterOptions;
  /** The card's view: its top-left block (level coordinates) of 16 x 6. */
  view: [number, number];
}

export const LEVELS: LevelDef[] = [
  { file: 'den', desc: "Where's the Remote?!", light: 'den', build: livingRoom, snd: 'den', song: 'den', mons: { cat: 6 }, view: [1, 3] },
  { file: 'kitchen', desc: 'Who Knows Anymore?', light: 'kitchen', build: kitchen, snd: 'kitchen', song: 'kitchen', mons: { toast: 4 }, view: [9, 0] },
  { file: 'void', desc: 'The Void Between the Cushions', light: 'void', build: theVoid, snd: 'void', song: 'void', mons: {}, view: [10, 1] },
  { file: 'ride', desc: 'The Living Room Ride', light: 'ride', build: theRide, snd: 'ride', song: 'ride', mons: { ride: [20, 3] }, view: [6, 2] },
];
