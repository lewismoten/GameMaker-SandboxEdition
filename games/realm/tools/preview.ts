// Design previews (never on the disk): block sheets and map windows as PNGs.
//   cd web && npx vite-node ../games/realm/tools/preview.ts <outdir> [what]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '../../kit/pixels';
import { blockSheet, writePng } from '../../kit/png';
import type { Block } from '../../../web/src/formats/blocks';

export function mapWindow(blocks: Uint8Array, set: Block[], x0: number, y0: number, w: number, h: number): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let by = 0; by < h; by++)
    for (let bx = 0; bx < w; bx++) {
      const b = set[blocks[((y0 + by) % 100) * 100 + ((x0 + bx) % 100)]];
      for (let i = 0; i < 400; i++) p.px[(by * 20 + Math.floor(i / 20)) * p.w + bx * 20 + (i % 20)] = b.pixels[i];
    }
  return p;
}

export function sheet(out: string, set: Block[], pal: Uint8Array, count = 150): void {
  writePng(out, blockSheet(set.slice(0, count), 15), pal, 3);
}

export function outDir(): string {
  const d = process.argv[2] ?? '/private/tmp/realm-prev';
  mkdirSync(d, { recursive: true });
  return d;
}
export { join, writePng };
