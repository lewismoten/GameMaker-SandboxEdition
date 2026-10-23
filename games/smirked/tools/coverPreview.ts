// Renders the title art (art/cover.ts) at a few moments of its animation as PNGs, reduced to
// the cover's palette the same way the FLI is (design aid, never on the disk).
//   cd web && npx vite-node ../games/smirked/tools/coverPreview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';
import { medianCutPalette, Quantizer } from '../../kit/quantize';
import { coverRgb } from '../src/art/cover';

const out = process.argv[2] ?? join(tmpdir(), 'smirked-cover');
mkdirSync(out, { recursive: true });
const moments = [0, 0.3, 0.56, 0.92];
const frames = moments.map((t) => coverRgb(t));
const pal = medianCutPalette(frames, [[0, 0, 0]]);
const q = new Quantizer(pal, 10);
frames.forEach((f, i) => {
  const p = new Pixels(320, 200);
  p.px.set(q.apply(f, 320, 200));
  writePng(join(out, `cover-${i}.png`), p, pal, 3);
});
console.log(`cover previews in ${out}`);
