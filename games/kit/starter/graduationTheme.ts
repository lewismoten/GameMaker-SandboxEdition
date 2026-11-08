// What makes one graduation hall look unlike another: a few overrides of the default hall's blocks (the
// purple-and-gold ceremony hall in graduationHall.ts) and some wall pieces hung above the balcony. A theme
// that leaves a field out gets the default for it, so the first graduation is the default hall exactly.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from './palette';

type Draw = (pal: Pal) => Pixels;

export interface HallTheme {
  /** The aisle's floor block, the stage's, and the boards beneath both. */
  floor?: Draw;
  stage?: Draw;
  subfloor?: Draw;
  /** The ceiling strip. */
  valance?: Draw;
  /** A 5-shade ramp for the drapes, the hall's ends and (by default) the valance. */
  drape?: string;
  /** A 5-shade ramp for the balcony rail and front. */
  rail?: string;
  /** Four pennant colors (two blocks of two). */
  bunting?: (pal: Pal) => number[];
  /** Wall pieces, by name: `decor.<name>` blocks, hung in the row under the bunting. */
  decor?: Record<string, Draw>;
  /** Which wall pieces hang along the aisle, in turn, and every how many blocks. */
  decorOrder?: string[];
  decorEvery?: number;
}
