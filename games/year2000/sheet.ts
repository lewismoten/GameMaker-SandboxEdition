// Development aid: contact sheets of every block set, written to OUT (default /tmp).
//   cd web && OUT=<dir> npx vite-node ../games/year2000/sheet.ts
import { Pixels } from '../kit/pixels';
import type { BlockSet } from './src/blocks/book';
import { citySet, moonSet, suburbSet } from './src/blocks/blocks';
import { PAL } from './src/art/pal';
import { writePng } from './png';

const out = process.env.OUT ?? '/tmp';

export function sheet(set: { pics: Pixels[] }, cols = 15): Pixels {
  const n = set.pics.length;
  const rows = Math.ceil(n / cols);
  const p = new Pixels(cols * 22, rows * 22, 0);
  set.pics.forEach((pic, i) => p.blit(pic, (i % cols) * 22 + 1, Math.floor(i / cols) * 22 + 1));
  return p;
}

const sets: [string, BlockSet][] = [
  ['suburb', suburbSet()],
  ['city', citySet()],
  ['moon', moonSet()],
];
for (const [name, s] of sets) {
  writePng(`${out}/y2k-${name}.png`, sheet(s), PAL.pal, 3);
  console.log(name, s.names.length, 'blocks');
}
import { buildCharBlocks, buildMonsterBlocks } from './src/sprites/sprites';
writePng(`${out}/y2k-mbl.png`, sheet(buildMonsterBlocks(), 12), PAL.pal, 4);
writePng(`${out}/y2k-cbl.png`, sheet(buildCharBlocks(), 13), PAL.pal, 4);
