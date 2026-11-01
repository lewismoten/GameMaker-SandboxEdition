// The levels in order: each one's files, its light, its block set, Teddy's character file, its
// sound set, its song, its monsters' options and how its view scrolls.
import type { Pal, TimeOfDay } from '../art/pal';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import { arcadeSong, bandSong, fieldSong, railSong, rinkSong, shopSong, stringsSong, woodsSong } from '../sound/song';
import { basementSong, choirSong, clockSong } from '../sound/laterSongs';
import { clock, clockBlocks } from './clock';
import { basement, basementBlocks } from './basement';
import { choir, choirBlocks } from './choir';
import { woods, woodsBlocks } from './woods';
import { field, fieldBlocks } from './field';
import { arcade, arcadeBlocks } from './arcade';
import type { Place } from '../sound/sounds';
import { band, bandBlocks } from './band';
import type { Level } from './maps';
import { rail, railBlocks } from './rail';
import { rink, rinkBlocks } from './rink';
import { shop, shopBlocks } from './shop';
import { strings, stringsBlocks } from './strings';

export interface LevelDef {
  /** The level's .PAL, .MAP, .MON, .BBL and .CMF are named for it. */
  file: string;
  desc: string;
  light: TimeOfDay;
  blocks: (pal: Pal) => Kit;
  build: (b: Kit['book']) => Level;
  chr: 'teddy' | 'rail' | 'rink' | 'baton' | 'staff';
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
  {
    file: 'band1',
    desc: 'The Bandstand',
    light: 'sunset',
    blocks: bandBlocks(0),
    build: band(0),
    chr: 'teddy',
    snd: 'band',
    song: () => bandSong(1),
    mons: {},
    wide: false,
  },
  {
    file: 'store',
    desc: "The Music Store's Back Room",
    light: 'afternoon',
    blocks: stringsBlocks,
    build: strings,
    chr: 'teddy',
    snd: 'strings',
    song: stringsSong,
    mons: { march: 3 },
    wide: true,
  },
  {
    file: 'band2',
    desc: 'The Bandstand Again',
    light: 'sunset',
    blocks: bandBlocks(1),
    build: band(1),
    chr: 'teddy',
    snd: 'band',
    song: () => bandSong(2),
    mons: {},
    wide: false,
  },
  {
    file: 'choir',
    desc: 'The Choir Loft',
    light: 'noon',
    blocks: choirBlocks,
    build: choir,
    chr: 'teddy',
    snd: 'choir',
    song: choirSong,
    mons: {},
    wide: false,
  },
  bandstand(3),
  {
    file: 'basement',
    desc: 'The Basement',
    light: 'night',
    blocks: basementBlocks,
    build: basement,
    chr: 'teddy',
    snd: 'basement',
    song: basementSong,
    mons: {},
    wide: true,
  },
  bandstand(4),
  {
    file: 'arcade',
    desc: 'The Arcade',
    light: 'show',
    blocks: arcadeBlocks,
    build: arcade,
    chr: 'teddy',
    snd: 'arcade',
    song: arcadeSong,
    mons: { march: 3 },
    wide: true,
  },
  bandstand(5),
  { file: 'rink', desc: 'The Roller Rink', light: 'show', blocks: rinkBlocks, build: rink, chr: 'rink', snd: 'rink', song: rinkSong, mons: {}, wide: true },
  bandstand(6),
  {
    file: 'field',
    desc: 'The Marching Field',
    light: 'afternoon',
    blocks: fieldBlocks,
    build: field,
    chr: 'baton',
    snd: 'field',
    song: fieldSong,
    mons: {},
    wide: true,
  },
  bandstand(7),
  {
    file: 'woods',
    desc: 'The Woods by the River',
    light: 'afternoon',
    blocks: woodsBlocks,
    build: woods,
    chr: 'staff',
    snd: 'woods',
    song: woodsSong,
    mons: {},
    wide: true,
  },
  // the save sign is here, in the level after the felt egg's
  bandstand(8, true),
  {
    file: 'clock',
    desc: 'The Clock Tower',
    light: 'morning',
    blocks: clockBlocks,
    build: clock,
    chr: 'teddy',
    snd: 'clock',
    song: clockSong,
    mons: {},
    wide: true,
  },
  bandstand(9),
];

/** The bandstand after the `n`th family comes home (from the third on). */
function bandstand(n: number, sign = false): LevelDef {
  return {
    file: `band${n}`,
    desc: 'The Bandstand Again',
    light: 'sunset',
    blocks: bandBlocks(n - 1, sign),
    build: band(n - 1, sign),
    chr: 'teddy',
    snd: 'band',
    song: () => bandSong(n),
    mons: {},
    wide: false,
  };
}
