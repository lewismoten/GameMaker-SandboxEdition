// Design aid (not part of the disk): PNG sheets of Joe, every block set and the screens.
//   PREVIEW_DIR=/tmp/x npx vite-node ../games/brief/tools/preview.ts
import { join } from 'node:path';
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';
import { CLEAR } from '../src/art/draw';
import { PAL, c } from '../src/art/pal';
import type { BlockSet } from '../src/blocks/sets';
import { buildJoeBlocks } from '../src/sprites/joe';
import { renderWindow } from '../src/art/render';
import { compileWing } from '../src/levels/wing';
import { WING_SPECS } from '../src/levels/wings';

const dir = process.env.PREVIEW_DIR ?? '.';

export function sheet(bs: BlockSet, cols = 16): Pixels {
  const n = bs.names.length;
  const p = new Pixels(cols * 21, Math.ceil(n / cols) * 21, c('paper', 2));
  bs.pics.forEach((px, i) => p.blit(px, (i % cols) * 21, Math.floor(i / cols) * 21, CLEAR));
  return p;
}

if (process.env.PREVIEW_DIR) {
  writePng(join(dir, 'joe.png'), sheet(buildJoeBlocks(), 8), PAL.pal, 6);
  const only = process.env.PREVIEW_WING;
  WING_SPECS.forEach((spec, i) => {
    if (only && spec.wing.id !== only) return;
    const w = compileWing(spec, i);
    writePng(join(dir, `${spec.wing.id}-tiles.png`), sheet(w.area.tiles), PAL.pal, 3);
    writePng(join(dir, `${spec.wing.id}-mbl.png`), sheet(w.area.mb), PAL.pal, 3);
    for (let k = 0; k < 5; k++) writePng(join(dir, `${spec.wing.id}-${k}.png`), renderWindow(w.area, k * 16, 0), PAL.pal, 2);
  });
  const extra = process.env.PREVIEW_MORE ? await import(process.env.PREVIEW_MORE) : undefined;
  await extra?.default?.(dir, sheet);
  console.log('written to', dir);
}
