// Design previews (never on the disk): the block sheet, the hero's hurt pose, each level's whole map
// and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/duck/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { heroPicture } from '../../kit/starter/hero';
import { buildHeroBlocks2 } from '../src/hero';
import { buildMonsterBlocks, buildMonsters } from '../src/monsters';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'duck-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const sky = pal.c('sky', 3);
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);

const hero = buildHeroBlocks2(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['hurt.top', 'hurt'],
  ['cheer.top', 'jump'],
];
const ducks = ['duck0', 'duck1'];
const sheet = new Pixels((poses.length + ducks.length) * 24 + 4, 44, sky);
poses.forEach(([t, b], i) => sheet.blit(heroPicture(hero, t, b), 4 + i * 24, 2, 255));
ducks.forEach((d, i) => sheet.blit(hero.pics.get(d)!, 4 + (poses.length + i) * 24, 22, 255));
writePng(join(out, 'hero.png'), sheet, pal.pal, 5);

const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  const m = l.map.done();
  const pic = renderRegion(m, bbl, mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 1);
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
