// Gwin, Teddy's (younger) big sister: a brown pit-lab mix, all muscle, floppy ears, a
// whip of a tail and a tongue that never goes back in. She is taller than Teddy and fills
// her whole block. Drawn facing right; she is mirrored when running left.
import type { Pixels } from '../kit/pixels';
import { sprite } from './src/art/draw';
import { P } from './src/art/pal';

const K: Record<string, number> = {
  o: P.c('gwin', 0),
  d: P.c('gwin', 1),
  g: P.c('gwin', 2),
  G: P.c('gwin', 3),
  h: P.c('gwin', 4),
  w: P.c('fur', 2),
  k: P.c('ink', 0),
  p: P.c('tongue', 1),
  r: P.c('red', 2),
  y: P.c('yellow', 3),
  s: P.c('cloud', 1),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

const HEAD = [
  '..........ooooo.....',
  '.........oGhhGGoo...',
  '........odoGGGGGGo..',
  '........odoGkGGGGGo.',
  '........oddoGGGGGGkk',
  '.........ooGGGwwGGo.',
  '..........oGkkpooo..',
  '..........ogGopp....',
];

export const GWIN: Record<string, Pixels> = {
  gwin1: S([
    ...HEAD,
    '..o......oggGo.p....',
    '...o..ooorrryo......',
    '....oogGGGGgggo.....',
    '....ogGGGGGGggwo....',
    '...ogGGGGGGGggwo....',
    '...oggggggggggwo....',
    '...oggddddddggo.....',
    '...ogdo...ogdo......',
    '...ogo....ogo.......',
    '...ogo....ogo.......',
    '...ooo....ooo.......',
  ]),
  gwin2: S([
    ...HEAD,
    '.........oggGo.p....',
    '.ooo..ooorrryo......',
    '....oogGGGGgggo.....',
    '....ogGGGGGGggwo....',
    '...ogGGGGGGGggwo....',
    '...oggggggggggwo....',
    '...oggddddddggo.....',
    '..ogdo.....ogdo.....',
    '.ogo........ogo.....',
    '.ogo.........ogo....',
    '.oo..........ooo....',
  ]),
  gwin3: S([
    ...HEAD,
    '.o.......oggGo.p....',
    '..o...ooorrryo......',
    '...ooogGGGGgggo.....',
    '....ogGGGGGGggwo....',
    '...ogGGGGGGGggwo....',
    '...oggggggggggwo....',
    '...oggddddddggo.....',
    '....ogdo.ogdo.......',
    '....ogo..ogo........',
    '....ogo..ogo........',
    '....ooo..ooo........',
  ]),
  // Bounding off with her ears flapping.
  gwinRun1: S([
    '.........ooooo......',
    '..o.....oGhhGGoo....',
    '...o...odoGGGGGGo...',
    '....o..odoGkGGGGGo..',
    '....o..oddoGGGGGGkk.',
    '.....o..ooGGGwwGGo..',
    '......ooogGGkpooo...',
    '....oorrrygggoppp...',
    '...ogGGGGGGGgggo....',
    '..ogGGGGGGGGggwwo...',
    '..oggggggggggggwo...',
    '.oggddddddddggggo...',
    'ogdo..........ogdo..',
    'ogo............ogo..',
    'oo..............oo..',
  ]),
  gwinRun2: S([
    '.........ooooo......',
    '........oGhhGGoo....',
    '.......odoGGGGGGo...',
    '.......odoGkGGGGGo..',
    '..oo...oddoGGGGGGkk.',
    '....ooo.ooGGGwwGGo..',
    '......ooogGGkpooo...',
    '....oorrrygggoppp...',
    '...ogGGGGGGGgggo....',
    '..ogGGGGGGGGggwwo...',
    '..oggggggggggggwo...',
    '...oggddddddggggo...',
    '....ogdo.ogdo.......',
    '.....ogoogo.........',
    '.....oo.oo..........',
  ]),
  // Rolling in something she should not be rolling in.
  gwinRoll: S([
    '...o..o.......o..o..',
    '..ogoogo.....ogoogo.',
    '..ogo.ogo...ogo.ogo.',
    '..oooooooooooooooooo',
    '.oggggggggwwwwgggGGo',
    'oGGGGGGGgwwwwwgGGkGo',
    'oggggggggggggggGGGGk',
    '.oooooooooooooooopo.',
  ]),
};
