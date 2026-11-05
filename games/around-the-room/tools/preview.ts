// Design previews (never on the disk): each room's block sheet and hero, each level's whole map and every picture on
// the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/around-the-room/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildRoomHeroBlocks } from '../src/hero';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'around-the-room-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const sky = pal.c('sky', 3);
levels.forEach((l, i) => {
  const bbl = l.book.finish();
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
  const heroes = buildRoomHeroBlocks(pal, l.frame);
  const sheet = new Pixels(6 * 24 + 4, 28, sky);
  [...heroes.pics.values()].forEach((p, n) => sheet.blit(p, 4 + n * 24, 4, 255));
  writePng(join(out, `hero-${l.file}.png`), sheet, pal.pal, 5);
  const m = l.map.done();
  writePng(join(out, `${l.file}.png`), renderRegion(m, bbl, mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 1);
  void i;
});
const disk = new URL('../disk/', import.meta.url);
try {
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
} catch {
  // no disk built yet
}
console.log(`previews in ${out}`);
