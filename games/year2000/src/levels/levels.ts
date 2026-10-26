// The six levels in order, with the files each scene loads and what its card says.
import { citySet, moonSet, suburbSet } from '../blocks/blocks';
import type { BlockSet } from '../blocks/book';
import type { LevelMap } from './mapkit';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { exchangeSong, fairSong, highwaySong, mallSong, moonSong, suburbSong } from '../sound/music';

export const SETS = { suburb: suburbSet, city: citySet, moon: moonSet };

export interface Level {
  file: string;
  desc: string;
  set: keyof typeof SETS;
  build: (s: BlockSet) => LevelMap;
  chr: 'dex.chr' | 'moon.chr';
  song: () => Uint8Array;
  /** Size of the map's playfield, for pictures. */
  size: [number, number];
  card: { title: string; lines: string[]; view: [number, number] };
  /** Level intro graphic: the card, maybe after an animation. */
  intro: string[];
}

export const LEVELS: Level[] = [
  {
    file: 'dome',
    desc: 'Dome Sweet Dome',
    set: 'suburb',
    build: level1,
    chr: 'dex.chr',
    song: suburbSong,
    size: [48, 32],
    card: {
      title: 'DOME SWEET DOME',
      lines: [
        'Hover Heights, 8:00 AM. Find the',
        'garage remote, the Zapper (SPACE',
        'fires it) and your report pages!',
        'Corner phone: 25 cents. F5 saves!',
      ],
      view: [0, 9],
    },
    intro: [],
  },
  {
    file: 'skyway',
    desc: 'Superhighway',
    set: 'suburb',
    build: level2,
    chr: 'dex.chr',
    song: highwaySong,
    size: [32, 30],
    card: {
      title: 'THE INFORMATION',
      lines: ['SUPERHIGHWAY. 9:30 AM. Rush hour.', 'Fourteen lanes of hover traffic', 'hauling faxes. Look both ways!', 'A bump hurts, then cars swerve.'],
      view: [0, 1],
    },
    intro: ['tele.fli'],
  },
  {
    file: 'mall',
    desc: 'Mega Mall 2000',
    set: 'city',
    build: level3,
    chr: 'dex.chr',
    song: mallSong,
    size: [44, 33],
    card: {
      title: 'MEGA MALL 2000',
      lines: ['11:00 AM. Arcade, TV-RAMA, FOOD.', 'The STAFF ONLY keycard is in the', 'laser display case at TV-RAMA.', 'Wait for the lasers to blink off!'],
      view: [0, 10],
    },
    intro: ['tele.fli'],
  },
  {
    file: 'exchange',
    desc: 'Teleport Exchange',
    set: 'city',
    build: level4,
    chr: 'dex.chr',
    song: exchangeSong,
    size: [74, 31],
    card: {
      title: 'WRONG NUMBER!',
      lines: [
        'The Teleport-A-Phone Exchange,',
        '12:30 PM. Every booth goes somewhere.',
        'Few go where you want. Keep dialing',
        'until you reach the Moon Shuttle!',
      ],
      view: [0, 1],
    },
    intro: [],
  },
  {
    file: 'moon',
    desc: 'The Moon',
    set: 'moon',
    build: level5,
    chr: 'moon.chr',
    song: moonSong,
    size: [40, 29],
    card: {
      title: 'THE MOON',
      lines: [
        '2:15 PM. One small step... and a',
        'big hop. Get the Moon Pass at the',
        'Visitor Center (mind the meteors),',
        'then the airlock to Moon School.',
      ],
      view: [0, 22],
    },
    intro: ['launch.fli'],
  },
  {
    file: 'school',
    desc: 'Science Fair',
    set: 'moon',
    build: level6,
    chr: 'dex.chr',
    song: fairSong,
    size: [30, 22],
    card: {
      title: 'THE SCIENCE FAIR',
      lines: ['2:55 PM! Zap Sparky three times', 'for the cover page. Turn in 20', 'pages and the cover to the judges,', 'then step up to the podium!'],
      view: [7, 5],
    },
    intro: [],
  },
];
