// The toy safe's combination dial, with no DOM, modeled the way a mechanical safe lock works.
//
// Sources: "Combination lock" (Wikipedia, section on safe locks: wheel pack, drive cam, fence,
// flies and pins, and the dialing procedure) and Matt Blaze, "Safecracking for the Computer
// Scientist" (2004, University of Pennsylvania), which describes the same parts and how each
// wheel is picked up by the one before it. This is a teaching-sized version, not a copy of any
// one lock: a toy safe with a 60-tick dial, two loose wheels and the drive cam, whose own gate
// is the third one (so three numbers, as in a three-wheel lock).
//
// How it works. The dial turns the drive cam. The cam has a pin; wheel B has a fly the pin can
// push; wheel B has a pin of its own that can push the fly on wheel A. A pin and a fly are each a
// little wide, so between pushing a fly one way and the other way a pin can travel nearly a
// whole revolution (the "lash", LASH = 60 less the width of the pin and fly together). So after
// the dial changes direction, nothing but the cam moves for almost a full turn; then the cam
// picks up B; B then travels almost a full turn before it picks up A. That is why passing a number
// "feels like turning twice", and why resetting means spinning several turns to collect every wheel.
//
// Numbers go up clockwise on the face, so turning the dial right (clockwise) brings lower numbers
// under the pointer, and left brings higher ones. Each wheel has a gate (a notch); the spring-
// loaded fence rests on the wheels and drops only when every gate lies under it. Here each
// wheel's gate is cut so that it lines up when the wheel stands on `gates(combo)[i]`.
export const TICKS = 60;
export type Turn = 'right' | 'left';

/** Pin and fly width together, in ticks; what is left of a turn is the lash between them. */
const WIDTH = 2;
export const LASH = TICKS - WIDTH;

export interface Dial {
  /** The number under the pointer: the drive cam's place. */
  pos: number;
  /** The loose wheels' places, farthest from the cam first: [wheel A (1st number), wheel B (2nd)]. */
  wheels: readonly [number, number];
  /** How many pins picked up a wheel on the latest tick (0 to 2); a hook for a tap sound. */
  picks: number;
}

/** The combination (pi: 3.14159), hidden in the room on the sticky note by the phone (desk/room/phoneNotes.ts). */
export const COMBINATION: readonly [number, number, number] = [31, 41, 59];

const wrap = (n: number) => ((n % TICKS) + TICKS) % TICKS;
export const newDial = (): Dial => ({ pos: 0, wheels: [0, 0], picks: 0 });

/**
 * Where each wheel must stand for its gate to be under the fence, for the given combination.
 * The first number is dialed turning right, so wheel A is left where the cam last pushed it
 * (on the cam's number). The second is dialed turning left, so wheel B is left a full lash
 * behind the cam's number. The last gate is the cam's own.
 */
export const gates = (combo: readonly number[] = COMBINATION): [number, number, number] => [wrap(combo[0]), wrap(combo[1] - LASH), wrap(combo[2])];

/** Turns the dial by `ticks` (positive right = clockwise, so the number falls; negative left, so it rises). */
export function turnDial(d: Dial, ticks: number): Dial {
  const right = ticks > 0;
  const step = right ? -1 : 1; // the number under the pointer moves this way
  // a pin rests on its fly when the gap behind it, 0 to LASH, has closed in the direction of travel
  const touching = (driver: number, driven: number) => wrap(driver - driven) === (right ? 0 : LASH);
  let pos = d.pos;
  let [a, b] = d.wheels;
  let picks = 0;
  for (let i = 0; i < Math.abs(ticks); i++) {
    const bPushed = touching(pos, b);
    const aPushed = bPushed && touching(b, a);
    if (aPushed) a = wrap(a + step);
    if (bPushed) b = wrap(b + step);
    pos = wrap(pos + step);
    // a pickup is a pin arriving at its fly by its own travel (the fly did not move this tick)
    picks = (!bPushed && touching(pos, b) ? 1 : 0) + (bPushed && !aPushed && touching(b, a) ? 1 : 0);
  }
  return { pos, wheels: [a, b], picks };
}

/** Whether the fence drops: every wheel's gate lies under it (and the cam's gate is at the pointer). */
export function opens(d: Dial, combo: readonly number[] = COMBINATION): boolean {
  const g = gates(combo);
  return d.wheels[0] === g[0] && d.wheels[1] === g[1] && d.pos === g[2];
}

/** A hard spin right, three full turns: every wheel is picked up and stacked on the cam's number. */
export const spin = (d: Dial): Dial => turnDial(d, 3 * TICKS);
