// Design previews: each level drawn whole (blocks and the monsters standing on it) as a PNG,
// twice size, from the built disk, and the title and menu pictures.
//   cd web && npx vite-node ../games/tuneup/tools/preview.ts [outDir]
import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildPalette } from '../src/art/pal';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';

const out = process.argv[2] ?? join(tmpdir(), 'tuneup-preview');
mkdirSync(out, { recursive: true });
const disk = (n: string) => new Uint8Array(readFileSync(new URL(`../disk/${n}`, import.meta.url)));
const mbl = parseBlocks(disk('things.mbl'), 100);
for (const l of LEVELS) {
  const map = parseMap(disk(`${l.file}.map`));
  const bbl = parseBlocks(disk(`${l.file}.bbl`), 150);
  const level = l.build(l.blocks(buildPalette(l.light)).book);
  const [w, h] = level.size;
  const pic = renderRegion(map, bbl, mbl, parseMonsters(disk(`${l.file}.mon`)), ORIGIN, ORIGIN, w, h);
  const pal = parsePalette(disk(`${l.file}.pal`));
  writePng(join(out, `${l.file}.png`), pic, pal, 2);
  console.log(join(out, `${l.file}.png`));
}
