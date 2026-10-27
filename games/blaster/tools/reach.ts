// Flood-fills every leg from its start over cells that aren't solid blocks, and reports any
// pickup or way out the ship can't reach (scrolling strips run 16 columns wide):
//   cd web && npx vite-node ../games/blaster/tools/reach.ts
import { STAGES } from '../src/stages/stages';
import { buildLeg, startOf, type Leg } from '../src/stages/stage';
import { MLEN, MWID } from '../../../web/src/formats/map';
import { PICKUPS } from '../src/blocks/tiles';
import { X0 } from '../src/stages/mapkit';
import { ROWS, TOP } from '../src/stages/sideLeg';

function audit(l: Leg): string[] {
  const b = buildLeg(l);
  // a diagonal leg wraps on every side; a strip is 16 columns between its edges
  const wraps = l.kind === 'diag';
  const side = l.kind === 'side';
  // a side leg is its band, from the launch to the gate
  const outside = (x: number, y: number) => (side ? x < 0 || x >= MLEN || y < TOP || y >= TOP + ROWS : x < X0 || x > X0 + 15 || y < 0 || y >= MWID);
  const solid = (x: number, y: number) =>
    !wraps && outside(x, y) ? true : (b.bbl[b.map.blocks[((y + MWID) % MWID) * MLEN + ((x + MLEN) % MLEN)]].solid ?? 0) !== 0;
  const seen = new Set<number>();
  const s = startOf(l);
  const todo = [[s.x, s.y]];
  while (todo.length) {
    const [x0, y0] = todo.pop()!;
    const [x, y] = wraps ? [(x0 + MLEN) % MLEN, (y0 + MWID) % MWID] : [x0, y0];
    const k = y * MLEN + x;
    if (seen.has(k) || solid(x, y)) continue;
    seen.add(k);
    todo.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const out: string[] = [];
  const names = l.kit.bs.names;
  for (let y = 0; y < MWID; y++)
    for (let x = wraps || side ? 0 : X0; x <= (wraps || side ? MLEN - 1 : X0 + 15); x++) {
      const n = names[b.map.blocks[y * MLEN + x]];
      if ((PICKUPS as readonly string[]).includes(n) && !seen.has(y * MLEN + x)) out.push(`${n} at ${x},${y} unreachable`);
    }
  if (!l.grid.links.some((p) => seen.has(p.y * MLEN + p.x))) out.push('no way out reachable');
  return out;
}

let bad = 0;
for (const make of STAGES) {
  const st = make();
  for (const l of [...st.legs, ...(st.side ? [st.side.room] : [])]) {
    const r = audit(l);
    bad += r.length;
    console.log(`${l.file} ${l.title}: ${r.length ? r.join('; ') : 'every pickup and the way out reachable'}`);
  }
}
if (bad) throw new Error(`${bad} reachability problems`);
