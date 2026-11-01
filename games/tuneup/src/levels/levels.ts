// The scenes in order: each one's files, its look (a theme over its base block set), Doc Leo's
// character file, its sound set, its song, its monsters' options and how its view scrolls. A
// level of more than one scene (The Timing Beat's three verses) names its level once.
import type { ThemeName, Pal } from '../art/palette';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { beatSong, jumpSong, oilSong, sparkSong } from '../sound/song';
import { beat, beatBlocks, VERSES } from './beat';
import { jump, jumpBlocks } from './jump';
import type { Level } from './maps';
import { oil, oilBlocks } from './oil';
import { spark, sparkBlocks } from './spark';

export interface LevelDef {
  /** The scene's .PAL, .MAP, .MON, .BBL and .CMF are named for it. */
  file: string;
  /** The level it belongs to (1 on), and its name. */
  level: number;
  desc: string;
  /** A part of a level: its verse (shown in the walkthrough's chapters). */
  part?: string;
  theme: ThemeName;
  blocks: (pal: Pal) => Kit;
  build: (b: Kit['book']) => Level;
  chr: 'leo' | 'piano' | 'oil';
  snd: Place;
  song: () => Uint8Array;
  mons: MonsterOptions;
  /** Scrolls side to side (else the level is one screen and the view stays put). */
  wide: boolean;
}

export const LEVELS: LevelDef[] = [
  { file: 'jump', level: 1, desc: 'Jump Start', theme: 'dawn', blocks: jumpBlocks, build: jump, chr: 'leo', snd: 'jump', song: jumpSong, mons: {}, wide: true },
  {
    file: 'spark',
    level: 2,
    desc: 'Spark Plucks',
    theme: 'electric',
    blocks: sparkBlocks,
    build: spark,
    chr: 'leo',
    snd: 'spark',
    song: sparkSong,
    mons: {},
    wide: true,
  },
  ...VERSES.map((v, i): LevelDef => ({
    file: v.file,
    level: 3,
    desc: 'The Timing Beat',
    part: ['the straight verse', 'the syncopated verse', 'the double-time verse'][i],
    theme: 'brass',
    blocks: beatBlocks(v),
    build: beat(v),
    chr: 'piano',
    snd: 'beat',
    song: () => beatSong(i),
    mons: {},
    wide: true,
  })),
  {
    file: 'oil',
    level: 4,
    desc: "Oil's Well",
    theme: 'amber',
    blocks: oilBlocks,
    build: oil,
    chr: 'oil',
    snd: 'oil',
    song: oilSong,
    mons: { squeak: 6, reach: 13 },
    wide: false,
  },
];

/** The first scene of each level (its intro plays before it). */
export const firstOfLevel = (i: number) => i === 0 || LEVELS[i - 1].level !== LEVELS[i].level;
