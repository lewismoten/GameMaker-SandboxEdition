// The cast page's stage (src/cast/castStage.ts) walks each regular on as the games draw them:
// their real sprite frames and colors, from the games' built files, into one small
// public/cast/sprites.json (palette indexes, base64; a few kB gzipped) that a canvas plays.
// Run it after a game's art changes:
//
//   cd web && npx vite-node scripts/castSprites.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLEN, BLOCK_COUNTS, CHARBL, TRANSPARENT, orientIndex, parseBlocks, type Block, type BlockKind } from '../src/formats/blocks';
import { parseCharacter, type Frame, type Sequence } from '../src/formats/character';
import { parsePalette } from '../src/formats/palette';
import { chezPicture } from '../../games/kit/chez';
import type { CastSprite } from '../src/cast/castSprite';
import type { Pixels } from '../../games/kit/pixels';
import { docLeo, DRESSED } from '../../games/teddy/src/sprites/people';
import { propSprite } from '../../games/teddy/src/sprites/klown';
import { docLeoWalk } from './castLeoSide';
import { NEEDLE_PAL, camelFront, needlePicture } from './castNeedle';
import { EGG_PAL, eggShine, eggTurning } from './castEgg';
import { TIN_HEART_H, TIN_HEART_PAL, TIN_HEART_W, tinHeartFrames } from './castTinHeart';

/**
 * A hero from its .CHR: `seq` the sequence it walks on with (else the one that walks furthest
 * right); on stage it turns to face you with its idle sequence (0), or `front`, blocks of its
 * .CBL one grid per frame.
 */
type ChrSource = {
  game: string;
  chr: string;
  cbl: string;
  pal: string;
  seq?: number;
  ms?: number;
  front?: number[][][];
  frontArt?: Pixels[];
  acts?: Record<string, number>;
};
/** Drawn here in colors of its own (6-bit VGA). */
type PaintSource = { paint: Pixels[]; front?: Pixels[]; colors: [number, number, number][]; still?: boolean; wobble?: boolean; ms?: number };
/** Drawn by a game's own drawing code (in its palette `pal`): walking frames, then facing you. */
type DrawnSource = { game: string; pal: string; walk: Pixels[]; front?: Pixels[]; acts?: Record<string, Pixels[]>; ms?: number; still?: boolean };
/**
 * Blocks of a .bbl/.mbl laid out in rows (-1 for none), one grid per frame; `recolor` swaps
 * colors (hex to hex) where the game's palette draws a regular in colors not their own.
 */
type BlockSource = {
  game: string;
  file: string;
  pal: string;
  frames: number[][][];
  ms?: number;
  still?: boolean;
  mirror?: boolean;
  height?: number;
  recolor?: Record<string, string>;
};
type Source = ChrSource | BlockSource | DrawnSource | PaintSource | { chez: true } | { tinHeart: true };

const CAST_SPRITES: Record<string, Source> = {
  teddy: { game: 'teddy', chr: 'teddy.chr', cbl: 'teddy.cbl', pal: 'backyard.pal', seq: 5 },
  gwinn: { game: 'teddy2', chr: 'gwinn.chr', cbl: 'gwinn.cbl', pal: 'farm.pal', seq: 5 },
  // Doc Leo as Teddy's games draw him, in the whole costume: a waddle on, a wave hello
  leo: {
    game: 'teddy',
    pal: 'klub.pal',
    walk: [0, 1, 2, 3].map((n) => docLeoWalk(n)),
    front: [docLeo(DRESSED), docLeo(DRESSED, true)],
    // hatless (Gwinn has it) until Teddy brings it back
    acts: { bareWalk: [0, 1, 2, 3].map((n) => docLeoWalk(n, false)), bareSide: [docLeoWalk(1, false)], side: [docLeoWalk(1)] },
    ms: 170,
  },
  // THE CHEZ as it drives in Quest for the Round Tuit: from the side, then its front
  chez: { game: 'realm', chr: 'chez.chr', cbl: 'pip.cbl', pal: 'flats.pal', seq: 8, front: [[[19]], [[20]]] },
  // drawn swimming left round the eddy: turned round to walk on forwards
  chicken: { game: 'teddy2', file: 'river.mbl', pal: 'river.pal', frames: [[[45]], [[46]]], ms: 200, mirror: true },
  rootbeer: {
    game: 'teddy',
    file: 'klub.bbl',
    pal: 'klub.pal',
    frames: [
      [
        [76, 77],
        [79, 81],
      ],
      [
        [76, 77],
        [80, 81],
      ],
    ],
    ms: 160,
    still: true,
  },
  tinHeart: { tinHeart: true },
  easterEgg: { paint: eggTurning(), front: eggShine(), colors: EGG_PAL, wobble: true, ms: 160 },
  // the costume Gwinn runs off with on stage (Teddy's Little Big Adventure's intro)
  'prop:hat': { game: 'teddy', pal: 'klub.pal', walk: [propSprite('hat')], still: true },
  'prop:tie': { game: 'teddy', pal: 'klub.pal', walk: [propSprite('tie')], still: true },
  'prop:shoes': { game: 'teddy', pal: 'klub.pal', walk: [propSprite('shoes')], still: true },
  'prop:chicken': { game: 'teddy', pal: 'klub.pal', walk: [propSprite('chicken')], still: true },
  // the child who carries Loaf #13 home (Loaf #13's home level), and the needle Brother Camel
  // tries (the eye level's needle, its eye and a little of its shaft)
  'prop:girl': {
    game: 'loaf',
    file: 'loaf.mbl',
    pal: 'home.pal',
    frames: [
      [[33], [35]],
      [[34], [36]],
    ],
    ms: 180,
  },
  'prop:needle': { paint: [needlePicture()], colors: NEEDLE_PAL, still: true },
  'prop:nose': { game: 'teddy', pal: 'klub.pal', walk: [propSprite('nose')], still: true },
  doghouse: {
    game: 'teddy',
    file: 'street.bbl',
    pal: 'street.pal',
    frames: [
      [
        [86, 87],
        [89, 91],
        [92, 95],
      ],
    ],
    still: true,
  },
  joe: { game: 'brief', chr: 'joe.chr', cbl: 'joe.cbl', pal: 'brief.pal', seq: 8 },
  lewie: { game: 'snowbound', chr: 'kid.chr', cbl: 'kid.cbl', pal: 'noon.pal', seq: 8 },
  will: { game: 'sweats', chr: 'poet.chr', cbl: 'poet.cbl', pal: 'hive.pal', seq: 5 },
  watt: { game: 'logic', chr: 'watt.chr', cbl: 'watt.cbl', pal: 'watt.pal', seq: 8 },
  // the rooster in Third Goat from the Left, white as on his logo (the stable's palette makes
  // him straw yellow) with the logo's orange beak; comb, spectacles and legs as the game has them
  bard: {
    game: 'goat',
    file: 'goat.mbl',
    pal: 'stable.pal',
    frames: [[[40]], [[41]]],
    ms: 220,
    recolor: { ffdf9e: 'ffffff', e3c282: 'dde0e6', c6a269: 'aab0bb', ffef79: 'ffc24a', dfbe51: 'f0902c' },
  },
  carl: { game: 'carl', chr: 'carl.chr', cbl: 'carl.cbl', pal: 'couch.pal', seq: 5 },
  goat: { game: 'goat', chr: 'goat.chr', cbl: 'goat.cbl', pal: 'town.pal', seq: 8, acts: { scream: 9, faint: 1 } },
  seed: { game: 'mustard', chr: 'seed.chr', cbl: 'mustard.cbl', pal: 'mound.pal', seq: 5 },
  loaf: { game: 'loaf', chr: 'loaf.chr', cbl: 'loaf.cbl', pal: 'hill.pal', seq: 5 },
  // turning to face you: drawn here, as his game only has him from the side
  camel: {
    game: 'needle',
    chr: 'loaded.chr',
    cbl: 'loaded.cbl',
    pal: 'city.pal',
    seq: 5,
    frontArt: [
      ...Array(9)
        .fill(0)
        .map(() => camelFront()),
      camelFront(true),
    ],
    ms: 150,
  },
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
  /** How many of `frames` are the walk; the rest face you. */
  nWalk?: number;
  /** Named extra sequences (a scream, a faint) after the walk and the front: [first frame, count]. */
  acts?: Record<string, [number, number]>;
  mirror?: boolean;
  wobble?: boolean;
  hop?: boolean;
  tick?: boolean;
}

function raw(s: Source): Raw {
  if ('chez' in s) {
    const car = chezPicture(
      { body: [1, 2, 3], trim: 4, glass: [5, 6], roof: 7, tire: 8, hub: 9, bumper: 10, lamp: 11, tail: 12, lens: 13, pin: 13, rim: 13 },
      'right',
      1,
    );
    const palette = new Uint8Array(768);
    [
      [0, 0, 0],
      [42, 8, 4],
      [58, 16, 9],
      [63, 32, 22],
      [34, 4, 3],
      [8, 12, 20],
      [40, 48, 56],
      [4, 4, 6],
      [6, 6, 7],
      [50, 52, 56],
      [12, 12, 14],
      [63, 44, 0],
      [52, 4, 4],
      [61, 61, 60],
    ].forEach((c, i) => palette.set(c, i * 3));
    return { width: car.w, height: car.h, frames: [Uint8Array.from(car.px)], palette, ms: 200, walk: true };
  }
  if ('tinHeart' in s) {
    const palette = new Uint8Array(768);
    TIN_HEART_PAL.forEach((c, i) => palette.set(c, i * 3));
    return { width: TIN_HEART_W, height: TIN_HEART_H, frames: tinHeartFrames(TRANSPARENT), palette, ms: 500, walk: true, hop: true, tick: true };
  }
  if ('paint' in s) {
    const palette = new Uint8Array(768);
    s.colors.forEach((c, i) => palette.set(c, i * 3));
    const all = [...s.paint, ...(s.front ?? [])];
    return {
      width: all[0].w,
      height: all[0].h,
      frames: all.map((p) => Uint8Array.from(p.px)),
      ...(s.front ? { nWalk: s.paint.length } : {}),
      palette,
      ms: s.ms ?? 200,
      walk: !s.still,
      wobble: s.wobble,
    };
  }
  const palette = parsePalette(disk(s.game, s.pal));
  if ('chr' in s) {
    const seqs = parseCharacter(disk(s.game, s.chr)).sequences;
    const blocks = parseBlocks(disk(s.game, s.cbl), BLOCK_COUNTS.cbl);
    const draw = (f: Frame) => {
      const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
      put(px, BLEN, blocks[f.pic1], f.orient & 15, 0, 0);
      put(px, BLEN, blocks[f.pic2], (f.orient >> 4) & 15, 0, BLEN);
      return px;
    };
    const walk = played(seqs[s.seq ?? walkRight(seqs)]).map(draw);
    // facing you: the grids given (bottom-aligned in the 20x40 frame), or the idle sequence
    const front = s.frontArt
      ? s.frontArt.map((p) => Uint8Array.from(p.px))
      : s.front
        ? s.front.map((grid) => {
            const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
            grid.forEach((row, r) => put(px, BLEN, blocks[row[0]], 0, 0, (2 - grid.length + r) * BLEN));
            return px;
          })
        : played(seqs[0]).map(draw);
    const frames = [...walk, ...front];
    const acts: Record<string, [number, number]> = {};
    for (const [name, seq] of Object.entries(s.acts ?? {})) {
      const more = played(seqs[seq]).map(draw);
      acts[name] = [frames.length, more.length];
      frames.push(...more);
    }
    return { width: BLEN, height: BLEN * 2, frames, nWalk: walk.length, ...(s.acts ? { acts } : {}), palette, ms: s.ms ?? 140, walk: true };
  }
  if ('walk' in s) {
    const all = [...s.walk, ...(s.front ?? [])];
    const acts: Record<string, [number, number]> = {};
    for (const [name, more] of Object.entries(s.acts ?? {})) {
      acts[name] = [all.length, more.length];
      all.push(...more);
    }
    return {
      width: all[0].w,
      height: all[0].h,
      frames: all.map((p) => Uint8Array.from(p.px)),
      nWalk: s.walk.length,
      ...(s.acts ? { acts } : {}),
      palette,
      ms: s.ms ?? 200,
      walk: !s.still,
    };
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
  // cut to `height` rows from the top (a needle shortened to fit the stage)
  const height = Math.min(rows * BLEN, s.height ?? rows * BLEN);
  return {
    width: cols * BLEN,
    height,
    frames: frames.map((f) => f.slice(0, cols * BLEN * height)),
    palette,
    ms: s.ms ?? 200,
    walk: !s.still,
    mirror: s.mirror,
  };
}

/** Trimmed to the rows any frame draws on, recolored to only the colors used (0 is see-through). */
function castSprite(s: Source): CastSprite {
  const r = raw(s);
  const used = [...new Set(r.frames.flatMap((f) => [...f]))].filter((c) => c !== TRANSPARENT).sort((a, b) => a - b);
  const index = new Map(used.map((c, i) => [c, i + 1]));
  const drawn = (y: number) => r.frames.some((f) => f.subarray(y * r.width, (y + 1) * r.width).some((c) => c !== TRANSPARENT));
  let top = 0;
  let bottom = r.height;
  while (top < bottom - 1 && !drawn(top)) top++;
  while (bottom > top + 1 && !drawn(bottom - 1)) bottom--;
  const hex = (c: number) =>
    Math.round((c * 255) / 63)
      .toString(16)
      .padStart(2, '0');
  return {
    w: r.width,
    h: bottom - top,
    colors: used.map((c) => [0, 1, 2].map((k) => hex(r.palette[c * 3 + k])).join('')).map((c) => ('recolor' in s && s.recolor?.[c]) || c),
    frames: r.frames.map((f) => Buffer.from(f.slice(top * r.width, bottom * r.width).map((c) => (c === TRANSPARENT ? 0 : index.get(c)!))).toString('base64')),
    ms: r.ms,
    walk: r.walk,
    ...(r.nWalk !== undefined && r.nWalk < r.frames.length ? { nWalk: r.nWalk } : {}),
    ...(r.acts ? { acts: r.acts } : {}),
    ...(r.mirror ? { mirror: true } : {}),
    ...(r.wobble ? { wobble: true } : {}),
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
