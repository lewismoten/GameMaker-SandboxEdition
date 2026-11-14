// Design previews (never on the disk): the block sheet, the hero's hurt pose, each level's whole map
// and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/choose-hero/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { bigBlocks } from '../src/hero';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'choose-hero-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const sky = pal.c('sky', 3);

const hero = buildHeroBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['hurt.top', 'hurt'],
  ['cheer.top', 'jump'],
];
const sheet = new Pixels(poses.length * 24 + 4, 44, sky);
poses.forEach(([t, b], i) => sheet.blit(heroPicture(hero, t, b), 4 + i * 24, 2, 255));
writePng(join(out, 'hero.png'), sheet, pal.pal, 5);

// the two heroes side by side: Fast Feet, then Big Hops
const big = bigBlocks(hero, pal);
const pair = new Pixels(52, 44, sky);
pair.blit(heroPicture(hero, 'stand.top', 'stand'), 4, 2, 255).blit(heroPicture(big, 'stand.top', 'stand'), 28, 2, 255);
writePng(join(out, 'heroes.png'), pair, pal.pal, 6);

const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  const bbl = l.book.finish();
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
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
