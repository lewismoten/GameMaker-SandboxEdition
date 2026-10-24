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
import { chezPicture } from '../../games/kit/chez';
import type { Pixels } from '../../games/kit/pixels';
import { EGG_PAL, eggShine } from './castEgg';
import { TIN_HEART_H, TIN_HEART_PAL, TIN_HEART_W, tinHeartFrames } from './castTinHeart';

/** THE CHEZ's colors (6-bit VGA): tomato red, a black roof, white steel wheels. */
const CHEZ_PAL: [number, number, number][] = [
  [0, 0, 0],
  [42, 8, 4], // 1 body shadow
  [58, 16, 9], // 2 body
  [63, 32, 22], // 3 body highlight
  [34, 4, 3], // 4 door seams
  [8, 12, 20], // 5 dark glass
  [40, 48, 56], // 6 light glass
  [4, 4, 6], // 7 roof
  [6, 6, 7], // 8 tires, stripes
  [50, 52, 56], // 9 chrome
  [12, 12, 14], // 10 bumpers
  [63, 44, 0], // 11 amber marker
  [52, 4, 4], // 12 red marker
  [61, 61, 60], // 13 white: lens, pinstripes, rims
];

function chezArt(scale: number): LevelPicture {
  const car = chezPicture(
    { body: [1, 2, 3], trim: 4, glass: [5, 6], roof: 7, tire: 8, hub: 9, bumper: 10, lamp: 11, tail: 12, lens: 13, pin: 13, rim: 13 },
    'right',
    scale,
  );
  const palette = new Uint8Array(768);
  CHEZ_PAL.forEach((c, i) => palette.set(c, i * 3));
  return { width: car.w, height: car.h, pixels: Uint8Array.from(car.px), palette };
}

type Crop = [x: number, y: number, w: number, h: number];

/** Where each picture comes from: games/<game>/disk/<file>. */
type Source =
  | { game: string; fli: string; frame: number; crop: Crop }
  | { game: string; gif: string; crop: Crop }
  | { game: string; chr: string; cbl: string; pal: string; seq?: number }
  /** THE CHEZ's shared side view (games/kit/chez.ts) at `chez` times its 40x20, in its own colors. */
  | { game: string; chez: number }
  /** Drawn here in colors of its own (6-bit VGA). */
  | { game: string; paint: Pixels; colors: [number, number, number][] }
  /** The tin heart (castTinHeart.ts), `tinHeart` times its size. */
  | { game: string; tinHeart: number }
  /** Blocks of a .bbl/.mbl/.cbl laid out in rows (-1 for none), in a palette. */
  | { game: string; blocks: string; pal: string; grid: number[][] };

export const CAST_ART: Record<string, Source> = {
  teddy: { game: 'teddy', fli: 'cast.fli', frame: 40, crop: [22, 12, 156, 156] },
  gwinn: { game: 'teddy', fli: 'cast.fli', frame: 62, crop: [168, 26, 146, 146] },
  leo: { game: 'teddy', fli: 'cast.fli', frame: 125, crop: [44, 23, 224, 147] },
  chicken: { game: 'teddy', fli: 'cast.fli', frame: 125, crop: [206, 56, 60, 112] },
  chez: { game: 'teddy', chez: 3 },
  doghouse: { game: 'teddy', fli: 'cast.fli', frame: 185, crop: [36, 14, 164, 182] },
  lewis: { game: 'sandcast', fli: 'sysop.fli', frame: 182, crop: [6, 16, 180, 180] },
  tinHeart: { game: 'teddy', tinHeart: 1 },
  easterEgg: { game: 'teddy', paint: eggShine()[1], colors: EGG_PAL },
  rootbeer: {
    game: 'teddy',
    blocks: 'klub.bbl',
    pal: 'klub.pal',
    grid: [
      [76, 77],
      [79, 81],
    ],
  },
  lewie: { game: 'snowbound', chr: 'kid.chr', cbl: 'kid.cbl', pal: 'noon.pal' },
  will: { game: 'sweats', chr: 'poet.chr', cbl: 'poet.cbl', pal: 'hive.pal' },
  watt: { game: 'logic', chr: 'watt.chr', cbl: 'watt.cbl', pal: 'watt.pal' },
  bard: { game: 'carl', gif: 'bardpic.gif', crop: [178, 12, 120, 112] },
  joe: { game: 'brief', chr: 'joe.chr', cbl: 'joe.cbl', pal: 'brief.pal' },
  carl: { game: 'carl', chr: 'carl.chr', cbl: 'carl.cbl', pal: 'couch.pal' },
  goat: { game: 'goat', chr: 'goat.chr', cbl: 'goat.cbl', pal: 'town.pal' },
  seed: { game: 'mustard', chr: 'seed.chr', cbl: 'mustard.cbl', pal: 'mound.pal' },
  loaf: { game: 'loaf', chr: 'loaf.chr', cbl: 'loaf.cbl', pal: 'hill.pal' },
  camel: { game: 'needle', chr: 'loaded.chr', cbl: 'loaded.cbl', pal: 'city.pal' },
};

const disk = (game: string, file: string) => readFileSync(join(__dirname, '../../games', game, 'disk', file));

function crop(width: number, pixels: Uint8Array, palette: Uint8Array, [x0, y0, w, h]: Crop): LevelPicture {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(pixels.subarray((y0 + y) * width + x0, (y0 + y) * width + x0 + w), y * w);
  return { width: w, height: h, pixels: out, palette };
}

/** A sprite without the see-through rows round it (a one-block hero stands in a two-block frame). */
function trim(pic: LevelPicture): LevelPicture {
  const row = (y: number) => pic.pixels.subarray(y * pic.width, (y + 1) * pic.width).some((c) => c !== TRANSPARENT);
  let top = 0;
  let bottom = pic.height;
  while (top < bottom - 1 && !row(top)) top++;
  while (bottom > top + 1 && !row(bottom - 1)) bottom--;
  return { ...pic, height: bottom - top, pixels: pic.pixels.slice(top * pic.width, bottom * pic.width) };
}

export function castPicture(s: Source): LevelPicture | undefined {
  if ('chez' in s) return trim(chezArt(s.chez));
  if ('paint' in s) {
    const palette = new Uint8Array(768);
    s.colors.forEach((c, i) => palette.set(c, i * 3));
    return trim({ width: s.paint.w, height: s.paint.h, pixels: Uint8Array.from(s.paint.px), palette });
  }
  if ('tinHeart' in s) {
    const k = s.tinHeart;
    const [art] = tinHeartFrames(TRANSPARENT);
    const pixels = new Uint8Array(TIN_HEART_W * k * TIN_HEART_H * k);
    for (let y = 0; y < TIN_HEART_H * k; y++)
      for (let x = 0; x < TIN_HEART_W * k; x++) pixels[y * TIN_HEART_W * k + x] = art[Math.floor(y / k) * TIN_HEART_W + Math.floor(x / k)];
    const palette = new Uint8Array(768);
    TIN_HEART_PAL.forEach((c, i) => palette.set(c, i * 3));
    return { width: TIN_HEART_W * k, height: TIN_HEART_H * k, pixels, palette };
  }
  if ('chr' in s || 'blocks' in s) {
    const pic = sprite(s);
    return pic && trim(pic);
  }
  return picture(s);
}

function picture(s: Source): LevelPicture | undefined {
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
  return undefined;
}

function sprite(s: Source): LevelPicture | undefined {
  if ('chr' in s) return heroPixels({ get: (name) => disk(s.game, name) }, s);
  if (!('blocks' in s)) return undefined;
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
    const png = encodeIndexedPng(pic, 'blocks' in s || 'chr' in s || 'chez' in s || 'tinHeart' in s || 'paint' in s ? TRANSPARENT : undefined);
    writeFileSync(join(dir, `${id}.png`), png);
    console.log(`${id}.png ${pic.width}x${pic.height} ${png.length} bytes`);
  }
}
