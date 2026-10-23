// Renders a leg's map (blocks and placed monsters) to a PNG, for checking art and contrast:
//   cd web && npx vite-node ../games/blaster/tools/preview.ts <leg file> <out.png> [row0 rows]
import { STAGES } from '../src/stages/stages';
import { buildLeg } from '../src/stages/stage';
import { renderRegion } from '../src/art/render';
import { writePng } from '../../kit/png';
import { ARENA_TOP, EXIT_ROW, X0 } from '../src/stages/mapkit';

const [file, out, r0, n] = process.argv.slice(2);
for (const make of STAGES) {
  const st = make();
  const l = st.legs.find((x) => x.file === file) ?? (st.side?.room.file === file ? st.side.room : undefined);
  if (!l) continue;
  const b = buildLeg(l);
  const top = r0 ? Number(r0) : l.kind === 'boss' ? ARENA_TOP : EXIT_ROW;
  const rows = n ? Number(n) : l.kind === 'boss' ? 10 : 90;
  writePng(out, renderRegion(b.map, b.bbl, b.mbl, b.mon, X0, top, 16, rows), st.pal.pal, 2);
}
