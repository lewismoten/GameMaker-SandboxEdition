// Reads the sprite a pixel-trinket definition (pixelTrinketDefs.ts) names from a game's built disk: a hero's standing frame
// (top block over bottom block) or a monster's first picture, with the game's palette. Shared by the 3D trinkets
// (pixelTrinkets.ts) and the laser nickels (laserNickels.ts).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEN, CHARBL, TRANSPARENT, orientIndex, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { PixelPicture } from '@lewismoten/gamemaker-sandbox-tools/mesh/pixelFigure';
import type { Def } from './pixelTrinketDefs';

const here = dirname(fileURLToPath(import.meta.url));

/** The sprite the game draws: a hero's standing frame (top block over bottom block) or a monster's first picture. */
export function picture(game: string, d: Def): PixelPicture {
  const disk = (f: string) => new Uint8Array(readFileSync(join(here, '..', game, 'disk', f)));
  const palette = disk(d.pal).subarray(0, 768);
  const blocks = (f: string, n: number) => parseBlocks(disk(f), n);
  const draw = (pixels: Uint8Array, orient: number, cells: Uint8Array, w: number, row: number) => {
    for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) cells[(row + y) * w + x] = pixels[orientIndex(orient, x, y)];
  };
  if ('draw' in d.source) {
    const p = d.source.draw();
    return { w: p.w, h: p.h, cells: Uint8Array.from(p.px), palette };
  }
  if ('chr' in d.source) {
    const frame = parseCharacter(disk(d.source.chr)).sequences[d.source.seq ?? 0].frames[0];
    const bl = blocks(d.source.cbl, CHARBL);
    const cells = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
    if (frame.pic1 < CHARBL) draw(bl[frame.pic1].pixels, frame.orient & 15, cells, BLEN, 0);
    if (frame.pic2 < CHARBL) draw(bl[frame.pic2].pixels, (frame.orient >> 4) & 15, cells, BLEN, BLEN);
    return { w: BLEN, h: BLEN * 2, cells, palette };
  }
  const mon = parseMonsters(disk(d.source.mon))[d.source.n];
  const cells = new Uint8Array(BLEN * BLEN).fill(TRANSPARENT);
  draw(blocks(d.source.mbl, 100)[mon.pic[0][0]].pixels, 0, cells, BLEN, 0);
  return { w: BLEN, h: BLEN, cells, palette };
}
