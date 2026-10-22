// What every background-block module shares: the one block set they all add to (in order,
// so a block's index is its place in the build), the solid/gravity bit names, and helpers
// for drawing an object over sand.
import { BACKBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { BlockSet } from '../rules';
import { Pixels, sandTexture, shadowOnSand } from '../art/draw';

export const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
export const UP = 1;
export const RIGHT = 2;
export const DOWN = 4;
export const LEFT = 8;

export const bg = new BlockSet(BACKBL, false);

/** Sand floor with an object drawn on top (clear pixels show sand). */
export function onSand(seed: number, obj: Pixels, shadow = true): Pixels {
  const p = sandTexture(seed);
  if (shadow) shadowOnSand(p, (x, y) => obj.get(x - 1, y - 2) >= 0 && obj.get(x - 1, y - 2) !== 255 && obj.get(x, y) === 255);
  return p.blit(obj, 0, 0, 255);
}

export const sand = (seed: number) => sandTexture(seed);

export function sprite20(): Pixels {
  return new Pixels(20, 20, 255);
}
