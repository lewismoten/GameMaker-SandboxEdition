// The scenes in order: each one's files, its look (a theme over its base block set), Doc Leo's
// character file, its sound set, its song, its monsters' options and how its view scrolls. A
// level of more than one scene (The Timing Beat's three verses) names its level once. Levels 1-4
// are Sir Reginald's dream, ended by the swim (a scene nobody steers); 5 on are the real car.
import type { ThemeName, Pal } from '../art/palette';
import type { Kit } from '../blocks/common';
import type { MonsterOptions } from '../characters';
import type { Place } from '../sound/sounds';
import { beatSong } from '../sound/song';
import { jumpSong, oilSong, sparkSong, swimSong } from '../sound/dreamSongs';
import { beat, beatBlocks, VERSES } from './beat';
import { jump, jumpBlocks } from './jump';
import type { Level } from './maps';
import { oil, oilBlocks } from './oil';
import { spark, sparkBlocks } from './spark';
import { brakeSong, cupsSong, fanSong, muffledSong, pumpSong } from '../sound/realSongs';
import { brake, brakeBlocks } from './brake';
import { capGame, cups, cupsBlocks, ROUNDS } from './cups';
import { fan, fanBlocks, FAN_VERSES } from './fan';
import { muffled, muffledBlocks } from './muffled';
import { pump, pumpBlocks } from './pump';
import { swim, swimBlocks } from './swim';
import { rain, rainBlocks } from './rain';
import { choirSong, hornSong, keySong, rainSong, tuningSong } from '../sound/realSongs2';
import { panel, panelBlocks } from './panel';
import { keyBlocks, keyRoom } from './key';
import { horn, hornBlocks, HORN_ROUNDS } from './horn';
import { drive, driveBlocks, ROUTES } from './drive';
import { driveSong, paradeSong } from '../sound/finaleSongs';
import { parade, paradeBlocks, PARADES } from './parade';

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
  chr: 'leo' | 'piano' | 'oil' | 'teddy' | 'nobody' | 'chez';
  snd: Place;
  song: () => Uint8Array;
  mons: MonsterOptions;
  /** Scrolls side to side (else the level is one screen and the view stays put). */
  wide: boolean;
  /** Cards shown before the level's cartoon (waking from the dream). */
  before?: string[];
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
    mons: { squeak: 4, reach: 13 },
    wide: false,
  },
  // the dream ends: Sir Reginald swims the oil pipe (nobody steers), then Doc Leo wakes him
  {
    file: 'swim',
    level: 4,
    desc: "Oil's Well",
    part: 'the swim',
    theme: 'amber',
    blocks: swimBlocks,
    build: swim,
    chr: 'nobody',
    snd: 'oil',
    song: swimSong,
    mons: {},
    wide: false,
  },
  ...FAN_VERSES.map((v, i): LevelDef => ({
    file: v.file,
    level: 5,
    desc: 'The Fan Band',
    part: ['the cool verse', 'the hot verse'][i],
    theme: i ? 'hot' : 'cool',
    blocks: fanBlocks(v),
    build: fan(v),
    chr: 'leo',
    snd: 'fan',
    song: () => fanSong(i),
    mons: {},
    wide: true,
    before: i ? undefined : ['wake1.gif', 'wake2.gif', 'wake3.gif', 'wake4.gif'],
  })),
  {
    file: 'brake',
    level: 6,
    desc: 'Brake Dance',
    theme: 'disco',
    blocks: brakeBlocks,
    build: brake,
    chr: 'teddy',
    snd: 'brake',
    song: brakeSong,
    mons: {},
    wide: true,
  },
  ...ROUNDS.map((r, i): LevelDef => ({
    file: r.file,
    level: 7,
    desc: 'Hubcaps and Balls',
    part: `round ${i + 1}`,
    theme: 'spot',
    blocks: cupsBlocks,
    build: cups,
    chr: 'leo',
    snd: 'cups',
    song: () => cupsSong(r.speed === 4),
    mons: { caps: capGame(r) },
    wide: false,
  })),
  {
    file: 'pump',
    level: 8,
    desc: 'Pump Up the Volume',
    theme: 'noon',
    blocks: pumpBlocks,
    build: pump,
    chr: 'leo',
    snd: 'pump',
    song: pumpSong,
    mons: {},
    wide: true,
  },
  {
    file: 'hush',
    level: 9,
    desc: 'Muffled',
    theme: 'night',
    blocks: muffledBlocks,
    build: muffled,
    chr: 'teddy',
    snd: 'muffled',
    song: muffledSong,
    mons: {},
    wide: true,
  },
  {
    file: 'rain',
    level: 10,
    desc: 'The Rain Delay',
    theme: 'rain',
    blocks: rainBlocks,
    build: rain,
    chr: 'leo',
    snd: 'rain',
    song: rainSong,
    mons: {},
    wide: true,
    before: ['eggkeep.gif'],
  },
  ...HORN_ROUNDS.map((r, i): LevelDef => ({
    file: r.file,
    level: 11,
    desc: 'The Horn Section',
    part: `round ${i + 1}`,
    theme: 'gold',
    blocks: hornBlocks(r),
    build: horn(r),
    chr: 'piano',
    snd: 'horn',
    song: () => hornSong(r),
    mons: {},
    wide: true,
  })),
  ...[0, 1, 2, 3].map((room): LevelDef => ({
    file: `gear${room + 1}`,
    level: 12,
    desc: 'Key Change',
    part: ['first gear', 'second gear', 'third gear', 'top gear'][room],
    theme: (['gear1', 'gear2', 'gear3', 'gear4'] as const)[room],
    blocks: keyBlocks(room),
    build: keyRoom,
    chr: 'leo',
    snd: (['key1', 'key2', 'key3', 'key4'] as const)[room],
    song: () => keySong(room),
    mons: {},
    wide: true,
  })),
  ...(['tune', 'gauges'] as const).map((scene, i): LevelDef => ({
    file: `dash${i + 1}`,
    level: 13,
    desc: 'The Instrument Panel',
    part: ['the radio', 'the gauges'][i],
    theme: 'dash',
    blocks: panelBlocks(scene),
    build: panel(scene),
    chr: 'teddy',
    snd: i ? 'panel2' : 'panel1',
    song: i ? choirSong : tuningSong,
    mons: {},
    wide: false,
  })),
  ...ROUTES.map((r, i): LevelDef => ({
    file: r.file,
    level: 14,
    desc: 'The Test Drive',
    part: ['round the block', 'Main Street'][i],
    theme: 'noon',
    blocks: driveBlocks,
    build: drive(r),
    chr: 'chez',
    snd: 'drive',
    song: () => driveSong(i),
    mons: {},
    wide: true,
  })),
  ...PARADES.map((p, i): LevelDef => ({
    file: p.file,
    level: 15,
    desc: 'The Parade Route',
    part: ['the morning', 'sunset', 'the fireworks'][i],
    theme: (['parade', 'sunset', 'fireworks'] as const)[i],
    blocks: paradeBlocks(p),
    build: parade(p),
    chr: 'chez',
    snd: (['parade1', 'parade2', 'parade3'] as const)[i],
    song: () => paradeSong(i),
    mons: {},
    wide: true,
  })),
];

/** The first scene of each level (its intro plays before it). */
export const firstOfLevel = (i: number) => i === 0 || LEVELS[i - 1].level !== LEVELS[i].level;
