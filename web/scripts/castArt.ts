// The cast page's pictures (src/cast/castData.ts), drawn from the games' own built files into
// public/cast/<id>.png: a crop of a title card, cartoon frame or slide, a character's first
// frame, or a few blocks laid out. Small palette PNGs of only the colors used. Run it after a
// game's art changes:
//
//   cd web && npx vite-node scripts/castArt.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyFliFrame, newFliCanvas, parseFli } from '../src/formats/fli';
import { decodeGif } from '../src/formats/gif';
import { BLEN, TRANSPARENT, parseBlocks, BLOCK_COUNTS, type BlockKind } from '../src/formats/blocks';
import { parsePalette } from '../src/formats/palette';
import { heroPixels, type LevelPicture } from '../src/gfx/levelPicture';
import { encodeIndexedPng } from './gameShots';

type Crop = [x: number, y: number, w: number, h: number];

/** Where each picture comes from: games/<game>/disk/<file>. */
type Source =
  | { game: string; fli: string; frame: number; crop: Crop }
  | { game: string; gif: string; crop: Crop }
  | { game: string; chr: string; cbl: string; pal: string; seq?: number }
  /** Blocks of a .bbl/.mbl/.cbl laid out in rows (-1 for none), in a palette. */
  | { game: string; blocks: string; pal: string; grid: number[][] };

export const CAST_ART: Record<string, Source> = {
  teddy: { game: 'teddy', fli: 'cast.fli', frame: 40, crop: [22, 12, 156, 156] },
  gwinn: { game: 'teddy', fli: 'cast.fli', frame: 62, crop: [168, 26, 146, 146] },
  leo: { game: 'teddy', fli: 'cast.fli', frame: 125, crop: [56, 8, 212, 160] },
  chicken: { game: 'teddy', fli: 'cast.fli', frame: 125, crop: [206, 56, 60, 112] },
  chez: { game: 'teddy', fli: 'cast.fli', frame: 150, crop: [0, 38, 196, 160] },
  doghouse: { game: 'teddy', fli: 'cast.fli', frame: 185, crop: [36, 14, 164, 182] },
  bard: { game: 'carl', gif: 'bardpic.gif', crop: [178, 12, 120, 112] },
};

const disk = (game: string, file: string) => readFileSync(join(__dirname, '../../games', game, 'disk', file));

function crop(width: number, pixels: Uint8Array, palette: Uint8Array, [x0, y0, w, h]: Crop): LevelPicture {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(pixels.subarray((y0 + y) * width + x0, (y0 + y) * width + x0 + w), y * w);
  return { width: w, height: h, pixels: out, palette };
}

export function castPicture(s: Source): LevelPicture | undefined {
  if ('fli' in s) {
    const anim = parseFli(disk(s.game, s.fli));
    const canvas = newFliCanvas(anim);
    for (let i = 0; i <= s.frame; i++) applyFliFrame(anim, i, canvas);
    return crop(anim.width, canvas.pixels, canvas.palette, s.crop);
  }
  if ('gif' in s) {
    const img = decodeGif(disk(s.game, s.gif));
    return crop(img.width, img.pixels, img.palette, s.crop);
  }
  if ('chr' in s) return heroPixels({ get: (name) => disk(s.game, name) }, s);
  const kind = s.blocks.split('.').pop()!.toLowerCase() as BlockKind;
  const blocks = parseBlocks(disk(s.game, s.blocks), BLOCK_COUNTS[kind]);
  const cols = Math.max(...s.grid.map((r) => r.length));
  const width = cols * BLEN;
  const pixels = new Uint8Array(width * s.grid.length * BLEN).fill(TRANSPARENT);
  s.grid.forEach((row, r) =>
    row.forEach((b, c) => {
      if (b < 0) return;
      for (let y = 0; y < BLEN; y++) pixels.set(blocks[b].pixels.subarray(y * BLEN, (y + 1) * BLEN), (r * BLEN + y) * width + c * BLEN);
    }),
  );
  return { width, height: s.grid.length * BLEN, pixels, palette: parsePalette(disk(s.game, s.pal)) };
}

{
  // run as a script (nothing imports this file)
  const dir = join(__dirname, '../public/cast');
  mkdirSync(dir, { recursive: true });
  for (const [id, s] of Object.entries(CAST_ART)) {
    const pic = castPicture(s);
    if (!pic) throw new Error(`${id}: nothing to draw from ${s.game}`);
    const png = encodeIndexedPng(pic, 'blocks' in s || 'chr' in s ? TRANSPARENT : undefined);
    writeFileSync(join(dir, `${id}.png`), png);
    console.log(`${id}.png ${pic.width}x${pic.height} ${png.length} bytes`);
  }
}
