// THE DITHER, the one trick of this game: a game has no see-through colors, so light and fog are pixels painted into pictures.
// A "density" is how many pixels of a 2x2 square are painted (the others are left alone, so what is under them shows):
//   25   one of four          50   a checkerboard          75   three of four          100  solid (hides what is under it)
// Every block is 20 pixels wide and tall, an even number, so a pattern that starts at a block's corner carries on into the next block
// without a seam: the same pixel is painted on both sides of the join.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export type Density = 25 | 50 | 75 | 100;

/** Whether the pixel at (x, y) of a block is painted at that density. */
export function painted(density: Density, x: number, y: number): boolean {
  if (density === 100) return true;
  if (density === 50) return (x + y) % 2 === 0;
  if (density === 25) return x % 2 === 0 && y % 2 === 0;
  return !(x % 2 === 1 && y % 2 === 1);
}

/** `base` with the light color painted over it at that density (a new picture). `where` limits it to some of the pixels (a puff's round shape, say). */
export function veil(base: Pixels, density: Density, color: number, where: (x: number, y: number) => boolean = () => true): Pixels {
  return new Pixels(base.w, base.h).blit(base, 0, 0).map((x, y, c) => (where(x, y) && painted(density, x, y) ? color : c));
}

/** The same, for a picture with clear pixels (color 255): the painted pixels are the light, the rest stay clear so what is under shows. */
export function clearVeil(w: number, h: number, density: Density, color: number, where: (x: number, y: number) => boolean): Pixels {
  const p = new Pixels(w, h, 255);
  return p.map((x, y) => (where(x, y) && painted(density, x, y) ? color : 255));
}
