// Design previews: each scene drawn whole (blocks and the monsters standing on it) as a PNG,
// twice size, from the built disk; the five base block sets in each theme; and the cartoons as
// contact sheets (every fourth frame). Opens nothing; prints the files it wrote.
//   cd web && npx vite-node ../games/tuneup/tools/preview.ts [outDir]
import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildPalette, THEMES, type ThemeName } from '../src/art/palette';
import { kit } from '../src/blocks/common';
import { baseSet, SET_NAMES } from '../src/blocks/sets';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';
import { SP } from '../src/screens/art';
import { card } from '../src/screens/cards';
import { INTRO, OUTRO } from '../src/screens/banter';
import { endingReel, openingReel, stingReel } from '../src/screens/reels';

const out = process.argv[2] ?? join(tmpdir(), 'tuneup-preview');
mkdirSync(out, { recursive: true });
const wrote = (f: string) => console.log(join(out, f));
const disk = (n: string) => new Uint8Array(readFileSync(new URL(`../disk/${n}`, import.meta.url)));
const mbl = parseBlocks(disk('cast.mbl'), 100);
for (const l of LEVELS) {
  const map = parseMap(disk(`${l.file}.map`));
  const bbl = parseBlocks(disk(`${l.file}.bbl`), 150);
  const level = l.build(l.blocks(buildPalette(l.theme)).book);
  const [w, h] = level.size;
  const pic = renderRegion(map, bbl, mbl, parseMonsters(disk(`${l.file}.mon`)), ORIGIN, ORIGIN, w, h);
  writePng(join(out, `${l.file}.png`), pic, parsePalette(disk(`${l.file}.pal`)), 2);
  wrote(`${l.file}.png`);
}
// the base sets: a row of blocks per set, a sheet per theme
for (const theme of Object.keys(THEMES) as ThemeName[]) {
  const pal = buildPalette(theme);
  const rows = SET_NAMES.map((s) => {
    const k = kit(pal);
    baseSet(k, s);
    return [...k.book.pics.values()];
  });
  const sheet = new Pixels(22 * Math.max(...rows.map((r) => r.length)), 22 * rows.length, 0);
  rows.forEach((r, y) => r.forEach((p, x) => sheet.blit(p, x * 22 + 1, y * 22 + 1)));
  writePng(join(out, `sets-${theme}.png`), sheet, pal.pal, 3);
  wrote(`sets-${theme}.png`);
}
// the cards and the cartoons' contact sheets
for (const [n, k] of Object.entries(INTRO)) {
  writePng(join(out, `intro${n}.png`), card(k), SP.pal, 2);
  wrote(`intro${n}.png`);
}
for (const [f, k] of Object.entries(OUTRO)) {
  writePng(join(out, `${f}out.png`), card(k), SP.pal, 2);
  wrote(`${f}out.png`);
}
const sheet = (name: string, r: Reel, every = 4) => {
  const frames = r.frames.filter((_, i) => i && i % every === 0);
  const cols = 4;
  const p = new Pixels(320 * cols, 200 * Math.ceil(frames.length / cols), 0);
  frames.forEach((f, i) => {
    const q = new Pixels(320, 200);
    q.px.set(f);
    p.blit(q, (i % cols) * 320, Math.floor(i / cols) * 200);
  });
  writePng(join(out, `${name}.png`), p, SP.pal, 1);
  wrote(`${name}.png`);
};
sheet('opening', openingReel());
sheet('sting2', stingReel(2, 'plug', 'SPARK PLUCKS'));
sheet('ending', endingReel(4));
