// The levels in order, each printed on its own paper: the same inks on another stock for each hour of the parade
// morning (a dawn pink, a windy gray, a bakery pink, the airstrip's butter yellow, a creek-water sage, the hall's warm
// buff, a practice-hall lilac, a mint for the drum-off, plain cream for the route, a stadium blue, a truck-lot gray
// and a gold for ten o'clock).
import { printPalette, swap, type Pal, type Ramp } from './print';
import { type Level } from './lay';
import { bakery } from './bakery';
import { creek } from './creek';
import { bleachers } from './bleachers';
import { hall } from './hall';
import { truck } from './truck';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { level7 } from './level7';

export type { Level } from './lay';

/** Each level's paper, by file name: [darkest, lightest, middle] of the sky ramp (shade 3, the lightest, is the paper itself). */
const PAPERS: Record<string, Ramp | undefined> = {
  calltime: [4, [206, 150, 132], [252, 222, 204], [236, 188, 168]], // dawn
  gust: [4, [150, 160, 170], [226, 230, 228], [196, 202, 204]], // windy gray
  bakery: [4, [214, 150, 150], [252, 218, 210], [238, 184, 176]], // a bakery pink
  airstrip: [4, [214, 182, 96], [252, 240, 186], [238, 214, 140]], // the airstrip
  creek: [4, [150, 190, 176], [220, 240, 226], [190, 218, 202]], // creek sage
  float: [4, [196, 160, 120], [242, 222, 192], [222, 192, 156]], // the fire hall
  hall: [4, [170, 150, 190], [232, 222, 244], [204, 190, 222]], // practice-hall lilac
  drumoff: [4, [150, 190, 170], [216, 238, 222], [186, 216, 198]], // mint
  route: undefined, // cream
  stands: [4, [150, 170, 206], [222, 232, 248], [186, 202, 228]], // stadium blue
  truck: [4, [160, 150, 170], [230, 226, 236], [196, 190, 208]], // truck-lot gray
  stepoff: [4, [214, 162, 80], [252, 226, 162], [238, 196, 120]], // ten o'clock gold
};

/** The levels in play order, with the file name each one saves under (which picks its paper). */
const MAKERS: [string, (pal: Pal) => Level][] = [
  ['calltime', level1],
  ['gust', level2],
  ['bakery', bakery],
  ['airstrip', level3],
  ['creek', creek],
  ['float', level4],
  ['hall', hall],
  ['drumoff', level5],
  ['route', level6],
  ['stands', bleachers],
  ['truck', truck],
  ['stepoff', level7],
];

/** The base palette and the levels. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = printPalette();
  const built = MAKERS.map(([file, make]) => {
    const paper = PAPERS[file];
    return make(paper ? swap(pal, { sky: paper }) : pal);
  });
  return { pal, levels: built };
}
