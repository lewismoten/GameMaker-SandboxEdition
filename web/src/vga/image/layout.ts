// IMAGE.EXE's screen layout and small helpers (the #defines at the top of code/GM/IMAGE.C).
import { type RGBdata } from '../shared/vga';
import { BLEN } from '../shared/facelift';
import { type Block, emptyBlock } from '../../formats/blocks';

export const LOLEN = 12;
export const LOX = 15;
export const LOY = 176;
export const LOX1 = LOX + BLEN * LOLEN - 1;
export const LOY1 = LOY + BLEN;
export const MX = LOX1 + 26;
export const MY = LOY - 2;
export const HY = MY + 11;
export const HELPFILE = 'image.hlp';

export const pal2bytes = (colors: RGBdata[]) => Uint8Array.from(colors.flatMap((c) => [c.red, c.green, c.blue]));

/** A background block as initalldata leaves it: blank, solid on every side. */
export function blankBlock(i: number): Block {
  const b = emptyBlock(i);
  b.solid = 15;
  b.grav = 15;
  b.effect = 1;
  return b;
}

export const isEmpty = (b: Block | undefined) => (b ? b.pixels.every((p) => p === 0) : false);
