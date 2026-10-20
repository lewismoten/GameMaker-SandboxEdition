import { suburbSet } from './blocks';
import { level1 } from './level1';
import { level2 } from './level2';
import { renderMap } from './render';
import { PAL } from './pal';
import { writePng } from './png';
import { buildMonsterBlocks } from './sprites';
import { buildMonsters } from './monsters';
const set = suburbSet();
const mb = buildMonsterBlocks();
const mons = buildMonsters(mb);
for (const [n, f, w, h] of [
  ['l1', level1, 48, 32],
  ['l2', level2, 32, 30],
] as const) {
  const m = f(set);
  console.log(n, 'pages', m.count('page'), 'quarters', m.count('quarter'), 'mons', m.monsters);
  writePng(`${process.env.OUT}/y2k-${n}.png`, renderMap(m.done(), set.build(), 0, 0, w, h, mb.build(), mons), PAL.pal, 1);
}
