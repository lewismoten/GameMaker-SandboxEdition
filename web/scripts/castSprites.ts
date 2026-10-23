// The cast page's stage (src/cast/castStage.ts) walks each regular on as the games draw them:
// their real sprite frames and colors, from the games' built files, into one small
// public/cast/sprites.json (palette indexes, base64; a few kB gzipped) that a canvas plays.
// Run it after a game's art changes:
//
//   cd web && npx vite-node scripts/castSprites.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLEN, BLOCK_COUNTS, CHARBL, TRANSPARENT, orientIndex, parseBlocks, type Block, type BlockKind } from '../src/formats/blocks';
import { parseCharacter, type Sequence } from '../src/formats/character';
import { parsePalette } from '../src/formats/palette';
import { chezPicture } from '../../games/kit/chez';
import type { CastSprite } from '../src/cast/castSprite';
import { TIN_HEART_H, TIN_HEART_PAL, TIN_HEART_W, tinHeartFrames } from './castTinHeart';

/** A hero from its .CHR (`seq`: the sequence to play, else the one that walks furthest right). */
type ChrSource = { game: string; chr: string; cbl: string; pal: string; seq?: number; ms?: number };
/** Blocks of a .bbl/.mbl laid out in rows (-1 for none), one grid per frame. */
type BlockSource = { game: string; file: string; pal: string; frames: number[][][]; ms?: number; still?: boolean };
type Source = ChrSource | BlockSource | { chez: true } | { tinHeart: true };

export const CAST_SPRITES: Record<string, Source> = {
  teddy: { game: 'teddy', chr: 'teddy.chr', cbl: 'teddy.cbl', pal: 'backyard.pal', seq: 5 },
  gwinn: { game: 'teddy2', chr: 'gwinn.chr', cbl: 'gwinn.cbl', pal: 'farm.pal', seq: 5 },
  leo: { game: 'tickle', chr: 'leo.chr', cbl: 'tickle.cbl', pal: 'lab.pal', seq: 5 },
  chez: { chez: true },
  chicken: { game: 'teddy2', file: 'river.mbl', pal: 'river.pal', frames: [[[45]], [[46]]], ms: 200 },
  rootbeer: { game: 'teddy', file: 'klub.bbl', pal: 'klub.pal', frames: [[[76, 77], [79, 81]], [[76, 77], [80, 81]]], ms: 160, still: true },
  tinHeart: { tinHeart: true },
  doghouse: { game: 'teddy', file: 'street.bbl', pal: 'street.pal', frames: [[[86, 87], [89, 91], [92, 95]]], still: true },
  joe: { game: 'brief', chr: 'joe.chr', cbl: 'joe.cbl', pal: 'brief.pal', seq: 8 },
  lewie: { game: 'snowbound', chr: 'kid.chr', cbl: 'kid.cbl', pal: 'noon.pal', seq: 8 },
  will: { game: 'sweats', chr: 'poet.chr', cbl: 'poet.cbl', pal: 'hive.pal', seq: 5 },
  watt: { game: 'logic', chr: 'watt.chr', cbl: 'watt.cbl', pal: 'watt.pal', seq: 8 },
  bard: { game: 'goat', file: 'goat.mbl', pal: 'stable.pal', frames: [[[40]], [[41]]], ms: 220 },
  carl: { game: 'carl', chr: 'carl.chr', cbl: 'carl.cbl', pal: 'couch.pal', seq: 5 },
  goat: { game: 'goat', chr: 'goat.chr', cbl: 'goat.cbl', pal: 'town.pal', seq: 8 },
  seed: { game: 'mustard', chr: 'seed.chr', cbl: 'mustard.cbl', pal: 'mound.pal', seq: 5 },
  loaf: { game: 'loaf', chr: 'loaf.chr', cbl: 'loaf.cbl', pal: 'hill.pal', seq: 5 },
  camel: { game: 'needle', chr: 'loaded.chr', cbl: 'loaded.cbl', pal: 'city.pal', seq: 5 },
};

const disk = (game: string, file: string) => readFileSync(join(__dirname, '../../games', game, 'disk', file));

/** A sequence's frames up to its end mark (pic2 CHARBL + 1), without the ones that draw nothing (as PLAYGAME plays them). */
const played = (s: Sequence) => {
  const end = s.frames.findIndex((f) => f.pic2 === CHARBL + 1);
  return (end < 0 ? s.frames : s.frames.slice(0, end)).filter((f) => f.pic2 <= CHARBL);
};

/** The sequence that walks furthest to the right, else the first. */
function walkRight(seqs: Sequence[]): number {
  let best = 0;
  let far = 0;
  seqs.forEach((s, i) => {
    const frames = played(s);
    if (frames.length < 2) return;
    const dx = frames.reduce((n, f) => n + f.x, 0);
    const up = frames.reduce((n, f) => n + Math.abs(f.y), 0);
    if (dx > far && up <= dx) [best, far] = [i, dx];
  });
  return best;
}

function put(out: Uint8Array, width: number, b: Block | undefined, orient: number, ox: number, oy: number): void {
  if (!b) return;
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      const c = b.pixels[orientIndex(orient, x, y)];
      if (c !== TRANSPARENT) out[(oy + y) * width + ox + x] = c;
    }
}

interface Raw {
  width: number;
  height: number;
  frames: Uint8Array[];
  palette: Uint8Array;
  ms: number;
  walk: boolean;
  hop?: boolean;
  tick?: boolean;
}

function raw(s: Source): Raw {
  if ('chez' in s) {
    const car = chezPicture({ body: [1, 2, 3], trim: 4, glass: [5, 6], roof: 7, tire: 8, hub: 9, bumper: 10, lamp: 11, tail: 12, lens: 13, pin: 13, rim: 13 }, 'right', 1);
    const palette = new Uint8Array(768);
    [[0, 0, 0], [42, 8, 4], [58, 16, 9], [63, 32, 22], [34, 4, 3], [8, 12, 20], [40, 48, 56], [4, 4, 6], [6, 6, 7], [50, 52, 56], [12, 12, 14], [63, 44, 0], [52, 4, 4], [61, 61, 60]].forEach((c, i) => palette.set(c, i * 3));
    return { width: car.w, height: car.h, frames: [Uint8Array.from(car.px)], palette, ms: 200, walk: true };
  }
  if ('tinHeart' in s) {
    const palette = new Uint8Array(768);
    TIN_HEART_PAL.forEach((c, i) => palette.set(c, i * 3));
    return { width: TIN_HEART_W, height: TIN_HEART_H, frames: tinHeartFrames(TRANSPARENT), palette, ms: 500, walk: true, hop: true, tick: true };
  }
  const palette = parsePalette(disk(s.game, s.pal));
  if ('chr' in s) {
    const seqs = parseCharacter(disk(s.game, s.chr)).sequences;
    const blocks = parseBlocks(disk(s.game, s.cbl), BLOCK_COUNTS.cbl);
    const seq = seqs[s.seq ?? walkRight(seqs)];
    const frames = played(seq).map((f) => {
      const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
      put(px, BLEN, blocks[f.pic1], f.orient & 15, 0, 0);
      put(px, BLEN, blocks[f.pic2], (f.orient >> 4) & 15, 0, BLEN);
      return px;
    });
    return { width: BLEN, height: BLEN * 2, frames, palette, ms: s.ms ?? 140, walk: true };
  }
  const kind = s.file.split('.').pop()!.toLowerCase() as BlockKind;
  const blocks = parseBlocks(disk(s.game, s.file), BLOCK_COUNTS[kind]);
  const cols = Math.max(...s.frames.flatMap((g) => g.map((r) => r.length)));
  const rows = Math.max(...s.frames.map((g) => g.length));
  const frames = s.frames.map((grid) => {
    const px = new Uint8Array(cols * BLEN * rows * BLEN).fill(TRANSPARENT);
    grid.forEach((row, r) => row.forEach((b, c) => b >= 0 && put(px, cols * BLEN, blocks[b], 0, c * BLEN, r * BLEN)));
    return px;
  });
  return { width: cols * BLEN, height: rows * BLEN, frames, palette, ms: s.ms ?? 200, walk: !s.still };
}

/** Trimmed to the rows any frame draws on, recolored to only the colors used (0 is see-through). */
export function castSprite(s: Source): CastSprite {
  const r = raw(s);
  const used = [...new Set(r.frames.flatMap((f) => [...f]))].filter((c) => c !== TRANSPARENT).sort((a, b) => a - b);
  const index = new Map(used.map((c, i) => [c, i + 1]));
  const drawn = (y: number) => r.frames.some((f) => f.subarray(y * r.width, (y + 1) * r.width).some((c) => c !== TRANSPARENT));
  let top = 0;
  let bottom = r.height;
  while (top < bottom - 1 && !drawn(top)) top++;
  while (bottom > top + 1 && !drawn(bottom - 1)) bottom--;
  const hex = (c: number) => Math.round((c * 255) / 63).toString(16).padStart(2, '0');
  return {
    w: r.width,
    h: bottom - top,
    colors: used.map((c) => [0, 1, 2].map((k) => hex(r.palette[c * 3 + k])).join('')),
    frames: r.frames.map((f) => Buffer.from(f.slice(top * r.width, bottom * r.width).map((c) => (c === TRANSPARENT ? 0 : index.get(c)!))).toString('base64')),
    ms: r.ms,
    walk: r.walk,
    ...(r.hop ? { hop: true } : {}),
    ...(r.tick ? { tick: true } : {}),
  };
}

{
  // run as a script (nothing imports this file)
  const out = Object.fromEntries(Object.entries(CAST_SPRITES).map(([id, s]) => [id, castSprite(s)]));
  const json = JSON.stringify(out);
  writeFileSync(join(__dirname, '../public/cast/sprites.json'), json);
  for (const [id, s] of Object.entries(out)) console.log(`${id} ${s.w}x${s.h} ${s.frames.length} frames ${s.colors.length} colors`);
  console.log(`sprites.json ${json.length} bytes`);
}
