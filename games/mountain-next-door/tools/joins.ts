// Finds art that doesn't meet, from the built levels' maps and block pictures:
//   hang    a standing thing (ladder, post, leg, trunk, door, fence, sign post) whose bottom edge stops over sky in the
//           cell below: rails, poles and legs that end short of the floor or float
//   floor   a ladder through a floor (floor both sides) drawn without the floor behind it: a hole in the turf
//   top     the top of a ladder ending in the air with no cap: rails that just stop
//   beam    a beam, deck or bridge that stops one cell short of a wall or post
// Prints each finding per level with its cell and block name, and exits 1 if there are any.
//   cd web && npx vite-node ../games/mountain-next-door/tools/joins.ts
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import { OPEN } from '../src/level';
import { buildLevels } from '../src/levels';

const STANDS = /^(ladder|post|leg|trunk|doorBottom|doorwayBottom|houseDoorBottom|fence|gate\.|plug\.|signPost|stack|brace)/;
const FLOORS = /^(ledge|grass|plank|deck|floor|tFloor|footbridge|step|roof[LMRF]?\b|roof\d|turf)/;
const BEAMS = /^(plank|deck|footbridge|logL|logR|arborBeam)/;

const { pal, levels } = buildLevels();
const sky = pal.c('sky', 3);
let total = 0;
for (const l of levels) {
  const names = new Map([...l.book.index].map(([n, i]) => [i, n]));
  const nameAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= l.map.width || y >= l.map.height ? '' : (names.get(l.map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN]) ?? '');
  const pic = (x: number, y: number) => l.book.pics.get(nameAt(x, y));
  const solid = (n: string) => (n && l.book.has(n) ? (l.book.rulesOf(n).solid ?? 0) !== 0 : false);
  const found: string[] = [];
  for (let y = 0; y < l.map.height; y++)
    for (let x = 0; x < l.map.width; x++) {
      const n = nameAt(x, y);
      const p = pic(x, y);
      if (!p || OPEN.test(n)) continue;
      const base = n.replace(/@.*/, '');
      if (STANDS.test(base) && y + 1 < l.map.height) {
        const q = pic(x, y + 1);
        // the thing itself, not what a variant drew behind it
        const own = l.book.pics.get(base.replace(/(Thru|Top)$/, '')) ?? p;
        let hang = 0;
        for (let i = 0; q && i < 20; i++) if (own.get(i, 19) !== sky && q.get(i, 0) === sky) hang++;
        if (hang >= 2) found.push(`hang (${x},${y}) ${n} over ${nameAt(x, y + 1)} ${hang}`);
      }
      if (/^ladder/.test(base) && !/Thru|Top/.test(base)) {
        const [a, b] = [nameAt(x - 1, y), nameAt(x + 1, y)];
        if (FLOORS.test(a) && FLOORS.test(b)) found.push(`floor (${x},${y}) ${n} between ${a} and ${b}`);
        const up = nameAt(x, y - 1);
        if (!/^ladder/.test(up) && !solid(up) && solid(nameAt(x, y + 1)) === false && /^(ladder)/.test(nameAt(x, y + 1)))
          found.push(`top (${x},${y}) ${n} under ${up}`);
      }
      if (BEAMS.test(base))
        for (const d of [-1, 1]) {
          const gap = nameAt(x + d, y);
          const wall = nameAt(x + 2 * d, y);
          if (/^sky/.test(gap) && solid(wall) && !BEAMS.test(wall)) found.push(`beam (${x},${y}) ${n} short of ${wall}`);
        }
    }
  total += found.length;
  console.log(`${l.file}: ${found.length}${found.length ? '\n  ' + found.join('\n  ') : ''}`);
}
console.log(`${total} findings`);
if (total) process.exitCode = 1;
