// The paper THE CHEZ's measurements, taken from the game's own side view (games/kit/chez.ts): one unit of that 40x20 picture
// is UNIT millimeters, so the car is 180 mm long. Everything here is millimeters, with the car facing right and y down.
import { CHEZ_AXLE, CHEZ_BODY, CHEZ_WHEELS } from '../../kit/chez';

export type Pt = readonly [number, number];

/** Millimeters to one unit of the 40x20 side view (the car comes out 180 mm long). */
export const UNIT = 4.5;
/** The car's width (a CitiCar is about half as wide as it is long). */
export const WIDTH = 84;
/** Glue tab depth and the joint tab at the strips' ends. */
export const TAB = 5;
export const JOINT = 7;
/** A tab on an edge shorter than this is left off (the nose is a 5 mm step). */
export const MIN_TAB_EDGE = 12;

const mm = (p: Pt): Pt => [p[0] * UNIT, p[1] * UNIT];
/** The body's outline in mm: roof back corner, then clockwise (the profile's nine edges). */
export const PROFILE: Pt[] = CHEZ_BODY.map(mm);
export const EDGES_COUNT = PROFILE.length;
/** Edge i runs from PROFILE[i] to PROFILE[i+1] (the last closes back to the roof). */
const EDGES = PROFILE.map((p, i) => [p, PROFILE[(i + 1) % PROFILE.length]] as const);
export const edgeLen = (i: number) => Math.hypot(EDGES[i][1][0] - EDGES[i][0][0], EDGES[i][1][1] - EDGES[i][0][1]);

/** The two strips: the top (roof, windshield and hood, nose) and the underside (nose bottom round to the rear). */
export const STRIP_TOP = [0, 1, 2];
export const STRIP_UNDER = [3, 4, 5, 6, 7, 8];

export const WHEEL_X = CHEZ_WHEELS.map((x) => x * UNIT);
export const WHEEL_Y = CHEZ_AXLE * UNIT;
/** Tire and wheel radii (the side view's: tire 3.25 units, white wheel 2.0, chrome cap 1.0). */
export const TIRE_R = 3.25 * UNIT;
export const RIM_R = 2.0 * UNIT;
export const HUB_R = 1.0 * UNIT;
/** The bumpers: 2.0 x 1.8 units in the side view, as a box as wide as the car. */
export const BUMPER = { depth: 2.0 * UNIT, height: 1.8 * UNIT };

/** The hood-and-windshield line's slope (y down per x), and where the body's top is at x (mm), for clipping the stripes. */
const HOOD_SLOPE = (CHEZ_BODY[2][1] - CHEZ_BODY[1][1]) / (CHEZ_BODY[2][0] - CHEZ_BODY[1][0]);
export const hoodY = (x: number) => PROFILE[1][1] + HOOD_SLOPE * (x - PROFILE[1][0]);

// The racing stripes, as in the side view (chez.ts): a band along the lower body that steps UP over the rear quarter, behind the door.
const BAND = 12.5;
const KINK: [number, number] = [10.0, 13.0];
const RISE = 2.6;
/** Where the stripes end at the back and the nose, in units. */
export const BAND_END = 6.9;
export const BAND_FRONT = 35.5;
export const STRIPE_W = 0.5;
export const STRIPE_HALF_GAP = 0.25;
export const PIN_W = 0.25;
/** The band's middle (mm) at x (mm): level up front, an S behind the door. */
export function bandY(xmm: number): number {
  const x = xmm / UNIT;
  const [a, b] = KINK;
  if (x >= b) return BAND * UNIT;
  if (x <= a) return (BAND - RISE) * UNIT;
  const t = (b - x) / (b - a);
  return (BAND - RISE * t * t * (3 - 2 * t)) * UNIT;
}
