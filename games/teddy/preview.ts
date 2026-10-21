// Design previews: renders sprite sheets to PNG in a scratch folder.
//   cd web && npx vite-node ../games/teddy/preview.ts <outdir>
import { Pixels } from '../kit/pixels';
import { writePng } from './png';
import { P } from './src/art/pal';
import { POSES, PAW_UP } from './teddy';

const out = process.argv[2] ?? '.';
export function sheet(pics: Pixels[], cols = 8, bg = 255): Pixels {
  const rows = Math.ceil(pics.length / cols);
  const p = new Pixels(cols * 22, rows * 22, bg);
  pics.forEach((q, i) => p.blit(q, (i % cols) * 22 + 1, Math.floor(i / cols) * 22 + 1));
  return p;
}
writePng(`${out}/teddy.png`, sheet([...Object.values(POSES), PAW_UP]), P.pal, 6);
import { FX } from './fx';
writePng(`${out}/fx.png`, sheet(Object.values(FX)), P.pal, 6);
import { GWIN } from './gwin';
writePng(`${out}/gwin.png`, sheet([...Object.values(GWIN), POSES.stand]), P.pal, 6);
