// The Junior Lab dial's one-way clutch as an angle walk (like the Stage Box's mechanism check): the plate winds clockwise and returns
// counterclockwise; two flexure pawls on the plate drive a 12-tooth pulse cam only on the return; a hold-back detent keeps the cam still
// on the wind and lets it coast the last holdBackSnapDeg forward when the plate stops. SW3 (off-normal) is closed whenever the plate is
// off rest; SW2 (pulse) is closed while the cam's angle, modulo one tooth pitch, is inside the closed window.
// Hole 1 sits one pitch from the finger stop, so winding digit n travels n pitches and the return must give exactly n pulses.
// dialParams.json holds the numbers (picsim.py reads the same file).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DialParams {
  pitchDeg: number;
  teeth: number;
  stopDeg: number;
  holeOneDeg: number;
  ringR: number;
  holeD: number;
  plateR: number;
  pulseClosedFromDeg: number;
  pulseClosedToDeg: number;
  holdBackSnapDeg: number;
  offNormalOpenWithinDeg: number;
  returnRateDegPerS: [number, number];
  bounceMs: number;
}

export const dialParams: DialParams = JSON.parse(readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), 'dialParams.json'), 'utf8')) as DialParams;

export interface WalkResult {
  /** Closing edges of SW2 seen while SW3 was closed, during the wind and during the return. */
  windPulses: number;
  returnPulses: number;
  /** Cam angle (deg, counterclockwise travel) when the walk ended. */
  camEnd: number;
  /** The last pulse closed this many degrees of plate travel before SW3 opened (the plate was this far from rest). */
  lastPulseFromRestDeg: number;
}

/**
 * Walk the plate to `windDeg` and back in `step` degree steps. State: plate angle theta, cam angle cam (counterclockwise travel since
 * it was parked), and the ridges the pawl crossed (ridge k at theta = k * pitch - holdBackSnapDeg).
 */
export function walk(windDeg: number, p: DialParams = dialParams, step = 0.25): WalkResult {
  const pitch = p.pitchDeg;
  const snap = p.holdBackSnapDeg;
  const closed = (cam: number) => {
    const m = ((cam % pitch) + pitch) % pitch;
    return m >= p.pulseClosedFromDeg && m <= p.pulseClosedToDeg;
  };
  let cam = 0; // parked: the next ridge is `snap` degrees ahead of the pawl
  let windPulses = 0;
  let sw2 = false;
  for (let theta = 0; theta < windDeg; theta += step) {
    const now = closed(cam); // the hold-back detent keeps the cam still, so SW2 never changes on the wind
    if (now && !sw2 && theta > p.offNormalOpenWithinDeg) windPulses++;
    sw2 = now;
  }
  const ridges = Math.floor((windDeg + snap) / pitch);
  const contact = ridges * pitch - snap; // the pawl meets ridge `ridges` here on the way back, then pushes the cam to rest
  let returnPulses = 0;
  let lastClose = 0;
  for (let theta = windDeg; theta > 0; theta -= step) {
    if (theta <= contact) cam = contact - theta;
    const now = closed(cam);
    if (now && !sw2 && theta > p.offNormalOpenWithinDeg) {
      returnPulses++;
      lastClose = theta;
    }
    sw2 = now;
  }
  return { windPulses, returnPulses, camEnd: ridges * pitch, lastPulseFromRestDeg: lastClose };
}

/** Angle of the hole for digit d (1..9, 0) at rest, clockwise from the top. */
export function holeDeg(d: number, p: DialParams = dialParams): number {
  const n = d === 0 ? 10 : d;
  return (((p.holeOneDeg - (n - 1) * p.pitchDeg) % 360) + 360) % 360;
}

/** Degrees the plate must turn for digit d: from the hole to the finger stop; always d (0 = 10) pitches. */
export function travelDeg(d: number, p: DialParams = dialParams): number {
  const n = d === 0 ? 10 : d;
  const t = (((p.stopDeg - holeDeg(d, p)) % 360) + 360) % 360;
  if (Math.abs(t - n * p.pitchDeg) > 1e-9) throw new Error(`digit ${d}: travel ${t} is not ${n} pitches`);
  return t;
}
