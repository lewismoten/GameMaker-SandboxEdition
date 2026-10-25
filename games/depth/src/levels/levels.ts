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
const J = { mon: MON.jaggy, plane: 'both' } as const;
const K = { mon: MON.jaggyV, plane: 'both' } as const;
const M = { mon: MON.mirror, plane: 'both' } as const;
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
  {
    n: 2,
    id: 'l2',
    name: 'The Glass Garden',
    theme: 'glass',
    song: 'glass',
    tagline: 'Everything here is see-through.',
    advice: ['Violet panels come and go:', 'wait for them, then roll. A', 'blur is never a floor.'],
    legend: { e: 'easterEgg', h: 'tinHeart' },
    monsters: { W, V, D: { mon: MON.gwinn, plane: 'both' } },
    rings: {
      '1': { toFar: [0, 1], toNear: [0, -1] },
      '2': { toFar: [-1, 0], toNear: [1, 0] },
    },
    rows: [
      '###############      ###############                    ',
      '#.....k.......#      #.*...........#                    ',
      '#.@.*...*...k.#      #..nnnnn....*.#                    ',
      '#.........*...#      #..n...n......#                    ',
      '#.*.D.........#      #..n.R.n......#                    ',
      '#...........k..PPPPPP...n...n...1..#                    ',
      '#.k...........#      #..nnnnn......#                    ',
      '#.........k...#      #.......W.....#                    ',
      '#+.......*...e#      #.*..*.......*#                    ',
      '###############      #########.#####                    ',
      '                              ~                #########',
      '                              ~                #.....*.#',
      '                    ##########.##############  #....B..#',
      '                    #....................2...==........#',
      '                    #.......................#  #.......#',
      '                    #OOOOOOOOOOOOOOOO..V....#  #.......#',
      '                    #..OOOOOOOOOOOOOO.......#  ####r####',
      '                    #G.PPP..QQQ..PPP........#  ####g####',
      '                    #..OOOOOOOOOOOOOO.......#  ####b####',
      '                    #OOOOOOOOOOOOOOOO.......#  #.......#',
      '                    #OOOOOOOOOOOOOOOO.......#  #...X...#',
      '                    #OOOOOOOOOOOOOOOOh.....+#  #.*...*.#',
      '                    #########################  #.......#',
      '                                               #########',
    ],
  },
  {
    n: 3,
    id: 'l3',
    name: 'The Hall of Mirrors',
    theme: 'mirror',
    song: 'mirror',
    tagline: 'Which one of you is real?',
    advice: ['Nine rooms, near doors and', 'far doors. Your double rolls', 'at you: shoot first.'],
    legend: { L: 'floor' },
    monsters: { W, V, M },
    rings: {
      '1': { toFar: [1, 0], toNear: [-1, 0] },
      '2': { toFar: [1, 0], toNear: [-1, 0] },
      // the green lens sits in a box of far cubes: pull focus here to reach it, then back out
      '3': { toFar: [-1, 0], toNear: [1, 0] },
    },
    // the middle room, where focus is pulled, is drawn isometrically
    iso: [[10, 8, 20, 16]],
    rows: [
      '#################################### ',
      '#.......o.#.........#.........#....# ',
      '#.@....1..#.*.......#.......o.m....# ',
      '#.........#.........#.....R...mL.E.# ',
      '#.........n....o..............#....# ',
      '#..*......#.........#.........#.o..# ',
      '#.o..*..*.#..W....*.#.*.......###### ',
      '#.........#.........#.........#      ',
      '#####f#########n###############      ',
      '#.........#.........#.........#      ',
      '#.........#.......M.#...V...*.#      ',
      '#..*......#.........#.........#      ',
      '#..............2....f.....B...#      ',
      '#......+..#.........#.........#      ',
      '#...W.....#.*.......#.*.......#      ',
      '#.........#.........#.........#      ',
      '###############.#########n#####      ',
      '#.........#.........#..M......#      ',
      '#.*...3...#.*...............*.#      ',
      '#..fff....#.........#.........#      ',
      '#..fGf....n.........#####r#####      ',
      '#..fff....#....o....#####g#####      ',
      '#.......*.#.M.....*.#####b#####      ',
      '#.........#.........#....X....#      ',
      '###############################      ',
    ],
  },
  {
    n: 4,
    id: 'l4',
    name: 'Fractal Peaks',
    theme: 'peaks',
    song: 'peaks',
    tagline: 'Infinitely detailed. Mostly downhill.',
    advice: ['Arrows on the ground pull you', 'their way: ride them down.', 'Mind the slopes into pits.'],
    monsters: { J, K },
    rings: {
      '1': { toFar: [1, 0], toNear: [-1, 0] },
      '2': { toFar: [1, 0], toNear: [-1, 0] },
      // the blue lens sits in a box of near cubes: pull focus here to reach it, then back
      '3': { toFar: [1, 0], toNear: [-1, 0] },
    },
    // the plateau with the red lens is drawn isometrically
    iso: [[26, 0, 46, 9]],
    rows: [
      '###############          #####################',
      '#.............#          #...................#',
      '#.@..*...##...#          #.......nnnnn.*.....#',
      '#..........*..############.......n...n.......#',
      '#.....#.......>>>>>>>>>>>>>>.#...n.R.n.....K.#',
      '#.............############.......n...n.......#',
      '#..*....*...+.#          #.......nnnnn.......#',
      '#.............#          #....1..............#',
      '###############          #.*..........J....*.#',
      '                         #...................#',
      '                         ###############v#####',
      '                                       #v#    ',
      '                                       #v#    ',
      '                                       #v#    ',
      '                                       #v#    ',
      '                                       #v#    ',
      '#####################                  #v#    ',
      '#....*.......nnn....#                  #v#    ',
      '#.......3....nBn.K..#     ##############v#####',
      // its patrols keep clear of the far plane's landing by ring 2 (they restart as the scene loads)
      '#............nnn....#     #.*..K........v....#',
      '#####r####......+...#     #...G..............#',
      '#####g####...........=====.f............#....#',
      '#####b####..J.......#     #f........2........#',
      '#####.####..........#     #f.J...............#',
      '####.X.###.......*..#     #OOOOOOO<<.......*.#',
      '##########..........#     #OOOOOOO<<.........#',
      '#####################     ####################',
    ],
  },
  {
    n: 5,
    id: 'l5',
    name: 'Teapot Temple',
    theme: 'teapot',
    song: 'teapot',
    tagline: 'The most rendered object there is.',
    advice: ['Teapots steam at you. THE', 'CHEZ is plugged in: push its', 'charge port for light.'],
    legend: { w: 'watt' },
    monsters: { W, J, H: { mon: MON.leo, plane: 'both' } },
    rings: {
      '1': { toFar: [1, 0], toNear: [-1, 0] },
      '2': { toFar: [-1, 0], toNear: [1, 0] },
    },
    // the shrine of the vanishing point is drawn isometrically
    iso: [
      [17, 10, 27, 17],
      [21, 18, 23, 19],
    ],
    rows: [
      '##############################################',
      '#............#...............................#',
      '#.@....[]....#..I...I...I...I...I...I...I....#',
      '#......{}w...#...............................#',
      '#............#............nnnUnnn..*.........#',
      '#...*........#............n.....n............#',
      '#.........*.....*.....1...n..R..n.......*....#',
      '#............#............n.....n............#',
      '#............#............nnnnnnn............#',
      '#..H.........#......................fffffff..#',
      '#..........*.#...###########..W.....f.....f..#',
      '#............#...#.........#........f.....f..#',
      '##############...#.*.....o.#.....2..f..G..U..#',
      '             #...#....X....#........f.....f..#',
      '             #..*#.........#........f.....f..#',
      '             #...#.o.....*.#..*.....fffffff..#',
      '             #...#.........#.................#',
      '             #...#####r#####.................#',
      '             #.+.....#g#................J....#',
      '             #.......#b#.....................#',
      '             #......U...........U.......*....#',
      '             #...............................#',
      '             #..*.........U.........B........#',
      '             #...............................#',
      '             #..I...I...I...I...I...I...I..*.#',
      '             #................*..............#',
      '             #################################',
    ],
  },
  {
    n: 6,
    id: 'l6',
    name: 'The Vanishing Point',
    theme: 'vanish',
    song: 'vanish',
    tagline: 'Where all parallel lines meet.',
    advice: ['Count Polygon swoops, then', 'dives. Three rays per stage.', 'Follow him to the far plane.'],
    legend: { S: 'prism', ',': 'steps', b: 'sealB', a: 'stair:1', c: 'stair:2', d: 'stair:3', h: 'stair:4' },
    monsters: { W, V, N: { mon: MON.count1, plane: 'near' }, Z: { mon: MON.count3, plane: 'far' } },
    rings: {
      '1': { toFar: [1, 0], toNear: [-1, 0] },
      '2': { toFar: [-1, 0], toNear: [1, 0] },
      // up behind the blue gate: Count Polygon's half of the arena in the far plane
      '3': { toFar: [0, 3], toNear: [0, 3] },
    },
    // the arena is drawn isometrically
    iso: [[24, 0, 44, 21]],
    rows: [
      '                                 #3#              ',
      '                        ##########b##########     ',
      '                        #+...h.........h...*#     ',
      '                        #...d...........d...#     ',
      '                        #..c......*......c..#     ',
      '#########################.a...............a.#     ',
      '#.......n.....f...OOO...#.......n....n......#     ',
      '#...*...n.R...f...OOO.*.#...S...........S...#     ',
      '#.......n.....f.*.QQQ...#...................#     ',
      '#.......n..*..f...OOO...#.....f........f....#     ',
      '#.......n.....f.V.OOO...#...................######',
      '#.@...1.n.....f...PPP...f,,.........N.......CrgX##',
      '#.......n.W...f...OOO...#...................######',
      '#.......n.....f...OOO...#.....f...Z....f....#     ',
      '#.......n...2.f...OOO.A.#...................#     ',
      '#...*...n.....f.G.OOO.+.#...................#     ',
      '#.......n.....f...OOO...#...S...n....n..S...#     ',
      '#########################...................#     ',
      '                        #.........*.........#     ',
      '                        #...................#     ',
      '                        #*.................+#     ',
      '                        #####################     ',
      '                                                  ',
    ],
  },
];
