// Design aid (not part of the disk): writes PNG sheets of the blocks of every room to the
// folder named by PREVIEW_DIR, 3x size.
//   PREVIEW_DIR=/tmp/x npx vite-node ../games/logic/preview.ts
import { join } from 'node:path';
import { Pixels } from '../kit/pixels';
import { writePng } from './png';
import { PAL } from './pal';
import { STYLES, buildTiles } from './tiles';
import type { BlockSet } from './sets';

const dir = process.env.PREVIEW_DIR ?? '.';

export function sheet(bs: BlockSet, cols = 16): Pixels {
  const n = bs.names.length;
  const p = new Pixels(cols * 21, Math.ceil(n / cols) * 21, 0);
  bs.pics.forEach((px, i) => p.blit(px, (i % cols) * 21, Math.floor(i / cols) * 21));
  return p;
}

if (process.env.PREVIEW_DIR) {
  for (const st of Object.values(STYLES)) writePng(join(dir, `tiles-${st.id}.png`), sheet(buildTiles(st)), PAL.pal, 3);
  console.log('written to', dir);
}
