// Design previews for a graduation game (never on its disk): the block sheet, the hero's poses, the monsters,
// the hall's whole map and every picture on the built disk, as PNGs in a folder (default: the system temp dir).
// A game's tools/preview.ts calls this with its folder's URL and its built levels.
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from './map';
import { buildHeroBlocks, heroPicture } from './hero';
import { buildMonsterBlocks, buildMonsters } from './monsters';
import type { buildLevels } from './graduationLevel';

/** Writes the previews of the game in folder `dir` (a file URL ending in a slash) to argv[2]. */
export function graduationPreview(id: string, dir: URL, built: ReturnType<typeof buildLevels>): void {
  const out = process.argv[2] ?? join(tmpdir(), `${id}-preview`);
  mkdirSync(out, { recursive: true });
  const { book, pal, levels } = built;
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
    ['hurt.top', 'hurt'],
  ];
  const sheet = new Pixels(poses.length * 24 + 4, 44, sky);
  poses.forEach(([t, b], i) => sheet.blit(heroPicture(hero, t, b), 4 + i * 24, 2, 255));
  writePng(join(out, 'hero.png'), sheet, pal.pal, 5);

  const mb = buildMonsterBlocks(pal);
  const mbl = mb.finish();
  writePng(join(out, 'monsters.png'), blockSheet(mbl.slice(0, mb.index.size), 6, sky), pal.pal, 6);

  for (const l of levels) {
    const m = l.map.done();
    const blocks = l.book.finish();
    if (l.bbl !== 'grad') writePng(join(out, `${l.bbl}-blocks.png`), blockSheet(blocks.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
    const pic = renderRegion(m, blocks, mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
    writePng(join(out, `${l.file}.png`), pic, pal.pal, 1);
  }
  const disk = new URL('disk/', dir);
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
  console.log(`previews in ${out}`);
}
