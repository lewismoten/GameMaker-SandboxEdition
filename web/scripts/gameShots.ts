// The pictures of each listed game that the home page's tiles, its panel, the play page and the
// desk's boxes show (src/gfx/levelPicture.ts), drawn at build time: one small PNG each instead
// of the half a dozen game files a page would fetch to draw it (src/desk/boxes/boxArt.ts renderShot).
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { parseGame } from '../src/formats/game';
import { vga8 } from '../src/formats/palette';
import {
  BUILT_SHOTS,
  builtHeroPath,
  builtMapShotPath,
  builtMapViews,
  builtShotPath,
  gamePicture,
  heroPixels,
  mapPixels,
  type HeroSpec,
  type LevelPicture,
} from '../src/gfx/levelPicture';
import { TRANSPARENT } from '../src/formats/blocks';
import { pngChunk } from './ogImage';
import { cdName } from '../src/project/files';

/**
 * A palette PNG of only the colors the picture uses; rows unfiltered (flat pixel art packs best
 * that way). With `transparent`, that palette index is see-through.
 */
export function encodeIndexedPng(pic: LevelPicture, transparent?: number): Uint8Array {
  const used = [...new Set(pic.pixels)].sort((a, b) => a - b);
  const index = new Map(used.map((c, i) => [c, i]));
  const raw = new Uint8Array((pic.width + 1) * pic.height);
  for (let y = 0; y < pic.height; y++) for (let x = 0; x < pic.width; x++) raw[y * (pic.width + 1) + 1 + x] = index.get(pic.pixels[y * pic.width + x])!;
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, pic.width);
  dv.setUint32(4, pic.height);
  ihdr.set([8, 3, 0, 0, 0], 8);
  const plte = Uint8Array.from(used.flatMap((c) => [0, 1, 2].map((k) => vga8(pic.palette[c * 3 + k]))));
  const clear = transparent === undefined ? -1 : used.indexOf(transparent);
  const trns = clear < 0 ? [] : [pngChunk('tRNS', Uint8Array.from(used.slice(0, clear + 1).map((_, i) => (i === clear ? 0 : 255))))];
  const parts = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('PLTE', plte),
    ...trns,
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) out.set(p, (at += p.length) - p.length);
  return out;
}

/**
 * A game's pictures, by site path: each size in BUILT_SHOTS, an original game's box views
 * (builtMapViews of its box's `shots`) and its hero (heroOf); none when it has no level to
 * show. `disk` maps a game file's name (as listed) to where it is on disk.
 */
export function gameShots(
  id: string,
  gam: string | null,
  disk: ReadonlyMap<string, string>,
  boxShots?: [string, number, number][],
  hero?: HeroSpec,
): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  if (!gam || !disk.has(gam)) return out;
  const cache = new Map<string, Uint8Array | undefined>();
  const files = {
    get(name: string) {
      const n = [name.toLowerCase(), cdName(name)].find((x) => disk.has(x));
      if (!n) return undefined;
      if (!cache.has(n)) cache.set(n, readFileSync(disk.get(n)!));
      return cache.get(n);
    },
  };
  try {
    const game = parseGame(files.get(gam)!);
    for (const [cols, rows] of BUILT_SHOTS) {
      const pic = gamePicture(files, game, cols, rows);
      if (pic) out.set(builtShotPath(id, cols, rows), encodeIndexedPng(pic));
    }
    if (out.size)
      for (const view of builtMapViews(boxShots)) {
        const pic = mapPixels(files, game, ...view);
        if (pic) out.set(builtMapShotPath(id, view), encodeIndexedPng(pic));
      }
    const face = out.size && hero ? heroPixels(files, hero) : undefined;
    if (face) out.set(builtHeroPath(id), encodeIndexedPng(face, TRANSPARENT));
  } catch {
    /* unreadable: the page draws it, or shows none */
  }
  return out;
}
