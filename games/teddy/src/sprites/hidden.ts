// The Sandbox Software regulars tucked into Teddy's town (games/kit/TIN-HEARTS.md): the tin
// heart and the painted Easter egg, each drawn over the block it lies on, and guests from the
// other games recolored into Teddy's ramps (never the sky, glow or neon ramps, which change
// with the time of day). Also the save sign (kit/saveSign.ts), drawn in those ramps too.
import { Pixels } from '../../../kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg, type EggPattern } from '../../../kit/easterEgg';
import { saveSignBlocks } from '../../../kit/saveSign';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** The ramps a guest may be recolored into: the ones that look the same all day. */
export const STEADY = [
  'ink',
  'cloud',
  'grass',
  'leaf',
  'dirt',
  'wood',
  'paint',
  'brick',
  'stone',
  'asphalt',
  'roof',
  'siding',
  'corgi',
  'fur',
  'gwinn',
  'red',
  'yellow',
  'blue',
  'green',
  'purple',
  'pink',
  'skin',
  'metal',
  'gold',
].flatMap((n) => P.r(n));

/** A block set that can take scenery drawn over one of its blocks (Teddy's Tiles). */
interface Over {
  pic(name: string): Pixels;
  def(name: string): { solid?: number; grav?: number };
  add(name: string, px: Pixels, def?: object): number;
}

const over = (base: Pixels) => {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return p;
};

/**
 * The tin heart over `base` (a block of the set): a glint crosses it now and then; touching
 * it gives `score` and leaves `base`. No sound (a sound would cut a woof). Returns its name.
 */
export function addTinHeart(bs: Over, base: string, score = 100): string {
  const tin = { ink: c('ink', 0), tin: [c('metal', 1), c('metal', 2), c('metal', 3)], white: c('paint', 3), dark: c('metal', 0) };
  const { grav } = bs.def(base);
  for (let k = 0; k < SHINE_FRAMES; k++)
    bs.add(`tinHeart${k || ''}`, drawTinHeart(over(bs.pic(base)), tin, k), {
      grav,
      score,
      touch: base,
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
    });
  return 'tinHeart';
}

/** The painted Easter egg over `base`, the same way: a few points, gone when touched. */
export function addEasterEgg(bs: Over, base: string, pattern: EggPattern, shell = 'pink', paint = 'purple', score = 50): string {
  const colors = {
    ink: c('ink', 0),
    shell: [c(shell, 1), c(shell, 2), c(shell, 3)],
    paint: [c(paint, 1), c(paint, 2)],
    accent: c('yellow', 3),
    white: c('paint', 3),
  };
  const { grav } = bs.def(base);
  const frames = EGG_SHINE_FRAMES;
  for (let k = 0; k < frames; k++)
    bs.add(`easterEgg${k || ''}`, drawEasterEgg(over(bs.pic(base)), colors, pattern, k), {
      grav,
      score,
      touch: base,
      next: `easterEgg${(k + 1) % frames || ''}`,
      ntime: k ? 2 : 70,
    });
  return 'easterEgg';
}

/** A guest (a 20x20 picture on CLEAR) standing over `base`: scenery, no touch, no sound. */
export function addGuest(bs: Over, name: string, guest: Pixels, base: string): string {
  const p = over(bs.pic(base));
  p.blit(guest, 0, 0, 255);
  bs.add(name, p, { grav: bs.def(base).grav });
  return name;
}

/**
 * The save sign (kit/saveSign.ts): its board over the two cells at (x, y) and (x + 1, y), its
 * posts over the two below (or the board alone, hung on a wall, when `posts` is false), each
 * drawn over what is there and keeping its gravity and solid sides (scenery: no touch, no sound).
 */
export function addSaveSign(
  bs: Over,
  m: { get(x: number, y: number): string; set(x: number, y: number, name: string): unknown },
  x: number,
  y: number,
  posts = true,
): void {
  const cells: [number, number][] = [
    [x, y],
    [x + 1, y],
  ];
  if (posts) cells.push([x, y + 1], [x + 1, y + 1]);
  const bases = cells.map(([cx, cy]) => m.get(cx, cy));
  const pics = bases.map((b) => over(bs.pic(b)));
  const sign = saveSignBlocks(P.pal, { board: [pics[0], pics[1]], posts: posts ? [pics[2], pics[3]] : undefined }, { use: STEADY });
  const out = [...sign.board, ...(sign.posts ?? [])];
  cells.forEach(([cx, cy], k) => {
    const name = `saveSign${k}`;
    const { grav, solid } = bs.def(bases[k]);
    bs.add(name, out[k], { grav, solid });
    m.set(cx, cy, name);
  });
}
