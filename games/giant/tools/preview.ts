// Design previews (never on the disk): the block sheet, the hero's poses, the monsters, and
// each level's whole map and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/giant/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'giant-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const sky = pal.c('sky', 3);
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);

const hero = buildHeroBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['blink.top', 'stand'],
  ['stand.top', 'walk0'],
  ['stand.top', 'walk1'],
  ['stand.top', 'walk2'],
  ['stand.top', 'walk3'],
  ['cheer.top', 'jump'],
  ['back.top', 'climb0'],
  ['back.top', 'climb1'],
  ['stand.top', 'throw0'],
  ['cheer.top', 'throw1'],
  ['stand.top', 'throw2'],
];
const sheet = new Pixels(poses.length * 24 + 4, 44, sky);
poses.forEach(([t, b], i) => sheet.blit(heroPicture(hero, t, b), 4 + i * 24, 2, 255));
writePng(join(out, 'hero.png'), sheet, pal.pal, 5);

const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
writePng(join(out, 'monsters.png'), blockSheet(mbl.slice(0, mb.index.size), 6, sky), pal.pal, 6);

// each giant whole, as its four parts put back together: Rocky (two wiggles), Beep (two), cracked Beep, and the red blink
const whole = (names: string[]): Pixels => {
  const w = new Pixels(names.length * 44 + 4, 44, sky);
  names.forEach((n, i) =>
    (['tl', 'tr', 'bl', 'br'] as const).forEach((k, j) => {
      const t = new Pixels(20, 20);
      t.px.set(mbl[mb.n(n.replace('#', k))].pixels);
      w.blit(t, 4 + i * 44 + (j % 2) * 20, 2 + Math.floor(j / 2) * 20, 255);
    }),
  );
  return w;
};
writePng(join(out, 'giants.png'), whole(['gol_#0', 'gol_#1', 'rob_#0', 'rob_#1', 'crk_#0', 'hot_#']), pal.pal, 5);

for (const l of levels) {
  const m = l.map.done();
  const pic = renderRegion(m, bbl, mbl, monsterSet(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
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
