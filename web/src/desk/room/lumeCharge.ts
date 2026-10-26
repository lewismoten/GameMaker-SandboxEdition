// The wall clock's lume paint: glow-in-the-dark paint that soaks up light and gives it back.
// Light on it (daylight, the overhead light, the black light) charges it in a few seconds; in
// the dark it glows and fades away over a few minutes, the way a real watch face does.

/** Seconds for light to fill most of the charge (one time constant). */
const CHARGE_S = 4;
/** Seconds for the glow to fall to about a third in the dark (one time constant). */
const FADE_S = 60;
/** Below this the glow is too faint to see. */
export const LUME_VISIBLE = 0.03;

/** The charge after `dt` seconds, with light on the face or in the dark. */
export function nextCharge(charge: number, lit: boolean, dt: number): number {
  return lit ? 1 - (1 - charge) * Math.exp(-dt / CHARGE_S) : charge * Math.exp(-dt / FADE_S);
}
