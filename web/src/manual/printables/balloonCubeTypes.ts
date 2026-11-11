// The paper balloon cube in a game's printables.json (balloonCube.ts draws it): a square to cut out and fold into a cube you blow up,
// with a face art on each of its six faces. Kept apart from types.ts, which unions it in.
import type { ItemBase } from './types';

/** One face of the cube: its pips (0 is the blow hole; 7 is a seven), an optional small caption, and whether its last pip is a dead one. */
export interface CubeFace {
  pips: number;
  caption?: string;
  /** The last pip is drawn crossed out in red (out of order). */
  dead?: boolean;
}

/** A square of paper that folds into a cube and inflates (the traditional waterbomb balloon). The lid is the face with the hole you blow into. */
export interface BalloonCubeItem extends ItemBase {
  kind: 'ballooncube';
  heading?: string;
  intro?: string;
  /** The six faces: `top` is the lid with the blow hole, `bottom` the face opposite it (the middle of the sheet), then the four sides,
   * in two opposite pairs: `ne` and `sw` (the squares beside the middle one on the sheet), `nw` and `se` (the back and front of the fold). */
  faces: Record<'top' | 'bottom' | 'ne' | 'nw' | 'sw' | 'se', CubeFace>;
  /** A line under the fold diagrams. */
  foot?: string;
}
