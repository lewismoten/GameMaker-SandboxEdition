// Design previews (never on the disk): the block sheet, the monster pictures, every burst's frames whole (as the
// engine's mirrors put them together) with the rocket, and every picture on the built disk, as PNGs in the folder given
// (default: the system temp dir).
//   cd web && npx vite-node ../games/fireworks/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildLevels, finishBlocks } from '../src/levels';
import { buildMonsterBlocks } from '../src/monsters';
import { BURSTS, burstPicture, rocketPicture, sampleTimes } from '../src/sparks';

const out = process.argv[2] ?? join(tmpdir(), 'fireworks-preview');
mkdirSync(out, { recursive: true });
const { pal, book } = buildLevels();
const sky = pal.c('sky', 3);
writePng(join(out, 'blocks.png'), blockSheet(finishBlocks(book).slice(0, book.index.size), 12, 0), pal.pal, 3);
const mb = buildMonsterBlocks(pal).book;
writePng(join(out, 'monster-pictures.png'), blockSheet(mb.finish().slice(0, mb.index.size), 12, sky), pal.pal, 3);
// every burst, frame by frame, one row each, and the rocket's two pictures under them
const sheet = new Pixels(7 * 64 + 4, (BURSTS.length + 1) * 64 + 4, sky);
BURSTS.forEach((kind, row) =>
  sampleTimes(kind.ticks).forEach((t, k) => {
    const pic = burstPicture(pal, kind, t, k);
    const off = (60 - pic.w) / 2;
    sheet.blit(pic, 4 + k * 64 + off, 4 + row * 64 + off, 255);
  }),
);
for (let f = 0; f < 2; f++) sheet.blit(rocketPicture(pal, f), 24 + f * 64, 24 + BURSTS.length * 64, 255);
writePng(join(out, 'bursts.png'), sheet, pal.pal, 3);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
