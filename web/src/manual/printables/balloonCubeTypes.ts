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

/** A square of paper that folds into a cube and inflates (the water-bomb balloon). The lid is the face with the hole you blow into. */
export interface BalloonCubeItem extends ItemBase {
  kind: 'ballooncube';
  heading?: string;
  intro?: string;
  /** The six faces: `top` is the lid with the blow hole, `bottom` the center of the sheet, then the four sides around it (north-east, north-west, south-west, south-east on the printed sheet). */
  faces: Record<'top' | 'bottom' | 'ne' | 'nw' | 'sw' | 'se', CubeFace>;
  /** A line under the fold diagrams. */
  foot?: string;
}
