// The six scenes of Depth Perception, drawn as text. Every level has a near plane and a far
// plane: the same map, two scenes. Sharp things are solid; a blur isn't there. Step on a focus
// ring (a digit) to pull focus to the other plane.
//
//   #  wall          .  floor         space  the void      O  pit
//   n  near cube     f  far cube      =  near glass bridge  ~  far glass bridge
//   *  photon        +  light bulb    R G B  lenses          r g b  the RGB gate
//   X  vanishing point   @  start     o  chrome orb          1-9  focus rings
import { MON } from '../ids';
import type { ThemeId } from '../tiles/themes';
import type { LevelText } from './map';

export interface Level extends LevelText {
  n: number;
  id: string;
  name: string;
  theme: ThemeId;
  /** Its song (SONGS in sound/music.ts). */
  song: string;
  /** The level card: a line under the title and three lines of advice. */
  tagline: string;
  advice: string[];
}

const W = { mon: MON.wire, plane: 'both' } as const;
const V = { mon: MON.wireV, plane: 'both' } as const;
export const LONG = { mon: MON.wireH, plane: 'both' } as const;

export const LEVELS: Level[] = [
  {
    n: 1,
    id: 'l1',
    name: 'The Checkerboard',
    theme: 'checker',
    song: 'checker',
    tagline: 'Where every render begins.',
    advice: ['Roll with the arrows. A blur', "isn't there: roll a ring to", 'pull focus. SPACE fires.'],
    monsters: { W, V, T: { mon: MON.teddy, plane: 'both' } },
    rings: {
      '1': { toFar: [1, 0], toNear: [-1, 0] },
      '2': { toFar: [-1, 0], toNear: [1, 0] },
      '3': { toFar: [1, 0], toNear: [-1, 0] },
    },
    rows: [
      '############################################',
      '#@..*.*.*...#.......n.....f......OOOOOOO...#',
      '#...........#..*.*..n..*..f......OOOOOOO.B.#',
      '#..o....o...#.......n..R..f..*...===3~~~...#',
      '#.T.................n.....f......OOOOOOO...#',
      '#...........#..1....n..V..f...*..OOOOOOO...#',
      '#.*.....+...#.......n..2..f......OOOOOOO...#',
      '#...........#.......n.....f......########r##',
      '#####.....###########.....###############g##',
      '    #..W..#         #..G..#            ##b##',
      '    #..*..#         #.....#            ##X##',
      '    #######         #######            #####',
    ],
  },
];
