// The Cast's guests in the graduation halls: each is the character's own sprite from its game (web/public/cast/sprites.json,
// which the Cast page's stage draws), or Teddy's and Gwinn's own sprites from the Teddy game, redrawn into the hall's palette
// by nearest color and put on the wall color. Never a new look.
import { readFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { chezPicture, type ChezInk } from '../chez';
import { GWINN } from '../../teddy/src/sprites/gwinn';
import { POSES } from '../../teddy/src/sprites/teddy';
import { P as TEDDY_PAL } from '../../teddy/src/art/pal';
import { skyOf, type Pal } from './palette';

const SPRITES = new URL('../../../web/public/cast/sprites.json', import.meta.url);
type RGB = [number, number, number];
interface CastSprite {
  w: number;
  h: number;
  colors: string[];
  frames: string[];
  nWalk?: number;
}
let sprites: Record<string, CastSprite> | undefined;

/** The palette's colors that are in use (not the black fill after the last ramp), as 8-bit RGB by index. */
function usedColors(pal: Pal): [number, RGB][] {
  const out: [number, RGB][] = [];
  for (let i = 0; i < 255; i++) {
    const [r, g, b] = [pal.pal[i * 3], pal.pal[i * 3 + 1], pal.pal[i * 3 + 2]];
    if (i > 0 && !r && !g && !b) continue;
    out.push([i, [(r << 2) | (r >> 4), (g << 2) | (g >> 4), (b << 2) | (b >> 4)]]);
  }
  return out;
}

const nearest = (colors: [number, RGB][], c: RGB): number => {
  let best = 0;
  let d = Infinity;
  for (const [i, k] of colors) {
    const e = (k[0] - c[0]) ** 2 * 3 + (k[1] - c[1]) ** 2 * 4 + (k[2] - c[2]) ** 2 * 2;
    if (e < d) [best, d] = [i, e];
  }
  return best;
};

/** Cuts a picture of any height into 20x20 blocks, top first, on the wall color: the picture sits on the bottom of the last block and is centered across. */
function blocksOf(pic: Pixels, wall: number): Pixels[] {
  const n = Math.ceil(pic.h / 20);
  const sheet = new Pixels(20, n * 20, wall);
  sheet.blit(pic, Math.floor((20 - pic.w) / 2), n * 20 - pic.h, 255);
  return Array.from({ length: n }, (_, i) => sheet.crop(0, i * 20, 20, 20));
}

/** A Cast character's own game sprite (web/public/cast/sprites.json: palette indexes, 0 clear) in the hall's palette: its blocks, top first. `frame` counts from the first one facing you. */
function castBlocks(pal: Pal, id: string, frame: number): Pixels[] {
  sprites ??= JSON.parse(readFileSync(SPRITES, 'utf8')) as Record<string, CastSprite>;
  const s = sprites[id];
  if (!s) throw new Error(`No Cast sprite ${id}`);
  const raw = Buffer.from(s.frames[Math.min((s.nWalk ?? 0) + frame, s.frames.length - 1)], 'base64');
  const rgb = s.colors.map((c) => [0, 2, 4].map((k) => parseInt(c.slice(k, k + 2), 16)) as RGB);
  const colors = usedColors(pal);
  const pic = new Pixels(s.w, s.h, 255);
  for (let i = 0; i < raw.length; i++) if (raw[i]) pic.set(i % s.w, Math.floor(i / s.w), nearest(colors, rgb[raw[i] - 1]));
  // a tall guest (the camel is 33 high) is shrunk, nearest pixel, to one block, so his head stays inside the balcony's view
  if (s.h > 20) {
    const w = Math.max(1, Math.round((s.w * 20) / s.h));
    const small = new Pixels(w, 20, 255);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < w; x++) {
        const c = pic.get(Math.min(s.w - 1, Math.floor((x * s.h) / 20)), Math.floor((y * s.h) / 20));
        if (c !== 255) small.set(x, y, c);
      }
    return blocksOf(small, skyOf(pal));
  }
  return blocksOf(pic, skyOf(pal));
}

/** One of Teddy's or Gwinn's sprites from the Teddy game, into the hall's palette. */
export function dogBlocks(pal: Pal, who: 'teddy' | 'gwinn', pose: string): Pixels[] {
  const src = who === 'teddy' ? POSES[pose] : GWINN[pose];
  if (!src) throw new Error(`No ${who} pose ${pose}`);
  const colors = usedColors(pal);
  const pic = new Pixels(src.w, src.h, 255);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c === 255 || c === 0) continue;
      const [r, g, b] = [TEDDY_PAL.pal[c * 3], TEDDY_PAL.pal[c * 3 + 1], TEDDY_PAL.pal[c * 3 + 2]];
      pic.set(x, y, nearest(colors, [(r << 2) | (r >> 4), (g << 2) | (g >> 4), (b << 2) | (b >> 4)]));
    }
  return blocksOf(pic, skyOf(pal));
}

/** THE CHEZ (games/kit/chez.ts, true to the photos: 40x20) in the hall's own ramps: two blocks, left then right. */
export function chezBlocks(pal: Pal): Pixels[] {
  const { c } = pal;
  const ink: ChezInk = {
    body: [c('red', 1), c('red', 2), c('red', 3)],
    trim: c('red', 0),
    glass: [c('blue', 1), c('sky', 4)],
    roof: c('ink', 0),
    tire: c('ink', 0),
    hub: c('stone', 4),
    rim: c('white', 3),
    bumper: c('ink', 1),
    lamp: c('gold', 2),
    tail: c('red', 3),
    stripe: c('ink', 1),
    pin: c('white', 3),
    chrome: c('stone', 4),
  };
  const car = chezPicture(ink, 'right');
  const wall = skyOf(pal);
  const sheet = new Pixels(40, 20, wall).blit(car, 0, 20 - car.h, 255);
  return [sheet.crop(0, 0, 20, 20), sheet.crop(20, 0, 20, 20)];
}

/** The guests the halls can seat, by name: the Cast character each is, and the sprite that shows it. */
const SPRITE_OF = {
  chicken: 'prop:chicken',
  lewie: 'lewie',
  joe: 'joe',
  watt: 'watt',
  carl: 'carl',
  goat: 'goat',
  will: 'will',
  camel: 'camel',
  loaf: 'loaf',
  seed: 'seed',
  egg: 'easterEgg',
  heart: 'tinHeart',
} as const;
export const CAMEO_NAMES = ['teddy', 'gwinn', ...(Object.keys(SPRITE_OF) as (keyof typeof SPRITE_OF)[])] as const;
export type CameoName = (typeof CAMEO_NAMES)[number];

/** Each guest's frames (a still one has one; `still` keeps every guest to one frame, to save blocks), each frame its blocks, top first. */
export function cameoFrames(pal: Pal, name: CameoName, still = false): Pixels[][] {
  if (name === 'teddy') return [dogBlocks(pal, 'teddy', 'front'), dogBlocks(pal, 'teddy', 'frontBark')];
  if (name === 'gwinn') return [dogBlocks(pal, 'gwinn', 'gwinn1'), dogBlocks(pal, 'gwinn', 'gwinn2')];
  const id = SPRITE_OF[name];
  return still || name === 'chicken' ? [castBlocks(pal, id, 0)] : [castBlocks(pal, id, 0), castBlocks(pal, id, 1)];
}
