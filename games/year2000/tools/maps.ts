// Development aid: renders each level's map (with its monsters) to PNGs in OUT.
//   cd web && OUT=<dir> npx vite-node ../games/year2000/tools/maps.ts      (ONLY=l2 for one)
import { LEVELS, SETS } from '../src/levels/levels';
import { renderMap } from '../src/art/render';
import { PAL } from '../src/art/pal';
import { writePng } from '../../kit/png';
import { buildMonsterBlocks } from '../src/sprites/sprites';
import { buildMonsters } from '../src/characters/monsters';
import { buildSkyMonsterBlocks } from '../src/sprites/skySprites';
import { buildSkyMonsters } from '../src/characters/skyMonsters';

const mb = buildMonsterBlocks();
const skyMb = buildSkyMonsterBlocks();
const only = process.env.ONLY;
LEVELS.forEach((l, i) => {
  const n = `l${i + 1}`;
  if (only && only !== n) return;
  const set = SETS[l.set]();
  const m = l.build(set);
  const [w, h] = l.size;
  console.log(n, 'pages', m.count('page'), 'quarters', m.count('quarter'), 'mons', m.monsters);
  const [mbl, mons] = l.mon === 'sky' ? [skyMb.build(), buildSkyMonsters(skyMb)] : [mb.build(), buildMonsters(mb)];
  writePng(`${process.env.OUT}/y2k-${n}.png`, renderMap(m.done(), set.build(), 0, 0, w, h, mbl, mons), PAL.pal, 1);
});
