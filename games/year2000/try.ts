// Development aid: renders each level's map (with its monsters) to OUT.
import { citySet, moonSet, suburbSet } from './blocks';
import type { BlockSet } from './book';
import type { LevelMap } from './mapkit';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { renderMap } from './src/art/render';
import { PAL } from './src/art/pal';
import { writePng } from './png';
import { buildMonsterBlocks } from './sprites';
import { buildMonsters } from './monsters';

const mb = buildMonsterBlocks();
const mons = buildMonsters(mb);
const sets = { suburb: suburbSet(), city: citySet(), moon: moonSet() };
const list: [string, (s: BlockSet) => LevelMap, number, number, keyof typeof sets][] = [
  ['l1', level1, 48, 32, 'suburb'],
  ['l2', level2, 32, 30, 'suburb'],
  ['l3', level3, 44, 33, 'city'],
  ['l4', level4, 74, 31, 'city'],
  ['l5', level5, 40, 29, 'moon'],
  ['l6', level6, 30, 22, 'moon'],
];
const only = process.env.ONLY;
for (const [n, f, w, h, sn] of list) {
  if (only && only !== n) continue;
  const set = sets[sn];
  const m = f(set);
  console.log(n, 'pages', m.count('page'), 'quarters', m.count('quarter'), 'mons', m.monsters);
  writePng(`${process.env.OUT}/y2k-${n}.png`, renderMap(m.done(), set.build(), 0, 0, w, h, mb.build(), mons), PAL.pal, 1);
}
