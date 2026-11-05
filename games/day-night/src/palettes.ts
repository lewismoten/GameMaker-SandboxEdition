// DAY AND NIGHT's three palettes. All of them hold the same 256 slots, in the same order, so a
// block drawn with slot 40 shows slot 40 of whichever palette its scene loaded. Only the colors in
// the slots change. DAY.PAL is the Starters' palette plus three ramps of this game's own:
//   orb   the sun by day (gold) and the moon by night (silver): one block, two looks
//   lamp  window glass and lantern bulbs: dull glass by day, warm light by night
//   star  one slot that is the sky's own color by day, so a star is there but cannot be seen
// DUSK.PAL is halfway between, with a sunset sky. NIGHT.PAL darkens and cools every ramp, except
// Lami's own colors (kept bright so he is easy to follow) and the three text colors and designer
// colors, which stay as they are so the score line reads the same.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

export interface Palettes {
  pal: Pal;
  day: Uint8Array;
  dusk: Uint8Array;
  night: Uint8Array;
}

/** Ramps the hero is drawn with: dimmed less at night so he stays easy to find. */
const HERO = new Set(['skin', 'teal', 'hair', 'orange', 'pink', 'white', 'kskin', 'khair', 'khat', 'khood', 'kpants']);
/** Ramps that keep their colors at every hour (the score line and menus use them). */
const FIXED = new Set(['menublue', 'plum', 'hot']);
/** Ramps that light up at night instead of darkening. */
const LIT = new Set(['orb', 'lamp', 'star', 'gold']);
/** Sign boards stay easier to read than the rest of the night. */
const READABLE = new Set(['parch']);

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const lerp = (a: RGB, b: RGB, t: number): RGB => [clamp(a[0] + (b[0] - a[0]) * t), clamp(a[1] + (b[1] - a[1]) * t), clamp(a[2] + (b[2] - a[2]) * t)];

/** Night: every color darker and bluer. */
function nightOf(c: RGB, kit: boolean, bright = false, deep = false): RGB {
  const k = bright ? 0.66 : kit ? 0.95 : deep ? 0.26 : 0.4;
  return [clamp(c[0] * k * 0.88 + 8), clamp(c[1] * k * 0.95 + 12), clamp(c[2] * k * 1.25 + 40)];
}

export function buildPalettes(): Palettes {
  let builder!: PaletteBuilder;
  const pal = buildStarterPalette((b) => {
    builder = b;
    // the sun/moon, dull glass/bright bulbs and stars are slots whose colors the palettes below set
    b.ramp('orb', 3, [236, 160, 20], [255, 246, 170], [255, 208, 56]);
    b.ramp('lamp', 3, [58, 62, 84], [136, 146, 170], [92, 100, 126]);
    b.ramp('star', 1, [130, 200, 250], [130, 200, 250]);
  }, 'day-night');
  const day = Uint8Array.from(pal.pal);
  const dusk = Uint8Array.from(day);
  const night = Uint8Array.from(day);
  const rgb = (a: Uint8Array, i: number): RGB => [a[i * 3] * 4, a[i * 3 + 1] * 4, a[i * 3 + 2] * 4];
  const put = (a: Uint8Array, i: number, c: RGB) => a.set([c[0] >> 2, c[1] >> 2, c[2] >> 2], i * 3);
  const NIGHT_LIGHT: Record<string, RGB[]> = {
    orb: [
      [150, 160, 192],
      [206, 216, 238],
      [246, 250, 255],
    ],
    lamp: [
      [226, 138, 24],
      [255, 204, 70],
      [255, 246, 170],
    ],
    star: [[255, 250, 200]],
    gold: [
      [170, 100, 20],
      [255, 214, 90],
      [255, 250, 170],
    ],
  };
  for (const [name, ids] of builder.ramps) {
    if (FIXED.has(name)) continue;
    ids.forEach((id, k) => {
      const d = rgb(day, id);
      let n: RGB;
      if (LIT.has(name) && NIGHT_LIGHT[name]) {
        const lit = NIGHT_LIGHT[name];
        n = name === 'gold' ? lerp(nightOf(d, true), d, 0.45) : lit[Math.min(k, lit.length - 1)];
      } else n = nightOf(d, HERO.has(name), READABLE.has(name), name === 'sky');
      put(night, id, n);
      // dusk: halfway, with the sky and the sun/moon warmed to sunset colors
      let m = lerp(d, n, 0.5);
      if (name === 'sky')
        m = ([
          [120, 70, 140],
          [176, 84, 130],
          [224, 108, 112],
          [255, 150, 100],
          [255, 192, 130],
          [255, 226, 176],
        ][k] ?? m) as RGB;
      if (name === 'orb')
        m = [
          [255, 130, 40],
          [255, 168, 70],
          [255, 220, 150],
        ][k] as RGB;
      if (name === 'lamp') m = lerp(d, n, 0.45);
      if (name === 'star') m = lerp(d, n, 0.3);
      put(dusk, id, m);
    });
  }
  // the star slot, by day, is exactly the sky's own color (block 'sky' is sky shade 3)
  put(day, builder.get('star')[0], rgb(day, pal.c('sky', 3)));
  put(dusk, builder.get('star')[0], [255, 214, 170]);
  pal.pal.set(day); // the cards and pictures are painted in the day palette
  return { pal, day, dusk, night };
}
