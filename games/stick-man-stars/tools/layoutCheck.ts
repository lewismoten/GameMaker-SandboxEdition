// Layout check: no sign stands over another sign, over a house or a door, inside a brick tunnel, or against a wall.
// Signs are rectangles (the board and the row of legs); a house's name board may stand over its own house.
//   cd web && npx vite-node ../games/stick-man-stars/tools/layoutCheck.ts
import { ORIGIN } from '../../kit/starter/map';
import { PLACED, STAND, buildLevels, type Level } from '../src/levels';
import { L0, L1, L2, L4 } from '../src/levels';

type R = { what: string; x: number; y: number; w: number; h: number };
const hit = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const tunnels = [L0.tunnel, L1.tunnel, L2.tunnel, L4.tunnel];
const { levels } = buildLevels();
let problems = 0;
levels.forEach((l: Level, i) => {
  const signs = PLACED.get(l.map) ?? [];
  const out: string[] = [];
  const width = l.map.width;
  const fixed: R[] = [
    { what: 'the entrance', x: 3, y: 8, w: 1, h: 2 },
    { what: 'the exit door', x: l.map.exits[0].from[0] - ORIGIN, y: 8, w: 1, h: 2 },
    { what: 'the left wall', x: 0, y: 0, w: 1, h: 10 },
    { what: 'the right wall', x: width - 1, y: 0, w: 1, h: 10 },
  ];
  const t = [L0.tunnel, L1.tunnel, L2.tunnel, L4.tunnel][i];
  if (t) fixed.push({ what: 'the brick tunnel', x: t[0], y: 0, w: t[1] - t[0] + 1, h: 8 });
  for (const m of l.map.map.monsters.slice(0, 200)) {
    if (!m || !m.monnum) continue;
    const x = m.curx - ORIGIN;
    const y = m.cury - ORIGIN;
    if (y !== STAND) continue;
    // a house or bot standing on the ground (a mover walks 5 blocks to its right)
    fixed.push({ what: `monster ${m.monnum} at ${x}`, x, y, w: 1, h: 1 });
  }
  signs.forEach((s, a) => {
    if (s.x < 1 || s.x + s.w > width - 1) out.push(`${s.what} at ${s.x} is cut off by a wall`);
    for (const b of signs.slice(a + 1)) if (hit(s, b)) out.push(`${s.what} at ${s.x}-${s.x + s.w - 1} overlaps ${b.what} at ${b.x}-${b.x + b.w - 1}`);
    for (const f of fixed) {
      // a board over its own house is the point; only legs (the bottom row) and boards over other things count
      if (s.what.startsWith('name ') && f.what.startsWith('monster') && f.x === s.x + 1) continue;
      if (hit(s, f)) out.push(`${s.what} at ${s.x}-${s.x + s.w - 1} overlaps ${f.what}`);
    }
  });
  console.log(`${l.title}: ${signs.length} signs, ${out.length ? out.length + ' problems' : 'ok'}`);
  for (const o of out) console.log(`  ${o}`);
  problems += out.length;
});
if (tunnels.length && problems) process.exitCode = 1;
