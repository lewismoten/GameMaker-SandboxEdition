// The levels in order: each one's files, its light, its block set, Teddy's character file, its
// sound set, its song, its monsters' options and how its view scrolls.
import type { Pal, TimeOfDay } from '../art/pal';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import { bandSong, railSong, shopSong } from '../sound/song';
import type { Place } from '../sound/sounds';
import type { Level } from './maps';
import { rail, railBlocks } from './rail';
import { shop, shopBlocks } from './shop';

export interface LevelDef {
  /** The level's .PAL, .MAP, .MON, .BBL and .CMF are named for it. */
  file: string;
  desc: string;
  light: TimeOfDay;
  blocks: (pal: Pal) => Kit;
  build: (b: Kit['book']) => Level;
  chr: 'teddy' | 'rail';
  snd: Place;
  song: () => Uint8Array;
  mons: MonsterOptions;
  /** Scrolls side to side (else the level is one screen and the view stays put). */
  wide: boolean;
}

export const LEVELS: LevelDef[] = [
  {
    file: 'shop',
    desc: 'The Piano Shop',
    light: 'morning',
    blocks: shopBlocks,
    build: shop,
    chr: 'teddy',
    snd: 'shop',
    song: shopSong,
    mons: { march: 4 },
    wide: true,
  },
  { file: 'piano', desc: 'The Player Piano', light: 'noon', blocks: railBlocks, build: rail, chr: 'rail', snd: 'rail', song: railSong, mons: {}, wide: false },
];

export { bandSong };
