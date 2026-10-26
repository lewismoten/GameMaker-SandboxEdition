// Renders a leg's map (blocks and placed monsters) to a PNG, for checking art and contrast:
//   cd web && npx vite-node ../games/blaster/tools/preview.ts <leg file> <out.png> [row0 rows [col0 cols [scale]]]
// The ribbon cable (s5r) shows its whole wrapping map unless told otherwise.
import { STAGES } from '../src/stages/stages';
import { buildLeg } from '../src/stages/stage';
import { renderRegion } from '../src/art/render';
import { writePng } from '../../kit/png';
import { ARENA_TOP, EXIT_ROW, X0 } from '../src/stages/mapkit';

const [file, out, r0, n, c0, w, scale] = process.argv.slice(2);
for (const make of STAGES) {
  const st = make();
  const l = st.legs.find((x) => x.file === file) ?? (st.side?.room.file === file ? st.side.room : undefined);
  if (!l) continue;
  const b = buildLeg(l);
  const diag = l.kind === 'diag';
  const top = r0 ? Number(r0) : diag ? 0 : l.kind === 'boss' ? ARENA_TOP : EXIT_ROW;
  const rows = n ? Number(n) : diag ? 100 : l.kind === 'boss' ? 10 : 90;
  const left = c0 ? Number(c0) : diag ? 0 : X0;
  const cols = w ? Number(w) : diag ? 100 : 16;
  writePng(out, renderRegion(b.map, b.bbl, b.mbl, b.mon, left, top, cols, rows), (l.pal ?? st.pal).pal, scale ? Number(scale) : diag ? 1 : 2);
}
