import { writePng } from '../../kit/png';
import { Pixels } from '../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../kit/quantize';
import { coverRgb } from '../src/art/cover';
const out = process.argv[2];
const f = [coverRgb(0), coverRgb(1)];
const pal = medianCutPalette(f, [[0, 0, 0]]);
const q = new Quantizer(pal, 10);
f.forEach((rgb, i) => { const p = new Pixels(320, 200); p.px.set(q.apply(rgb, 320, 200)); writePng(`${out}/cover${i}.png`, p, pal, 3); });
