// Carl the fly (A Fly Named Carl) as a guest in another game: his own drawing
// (games/carl/src/sprites flyArt: big red eyes, a smug grin, wings a blur) in the host game's
// palette. On a circuit board he is, of course, the bug.
import type { Pixels } from './pixels';
import { flyArt, type FlyPose } from '../carl/src/sprites/sprites';

/** The host palette's indices for Carl's ramps: fly 5 shades, eye 4, wing 3 (dark to light). */
export interface CarlColors {
  ink: number;
  fly: number[];
  eye: number[];
  wing: number[];
  white: number;
  /** His "ouch" flush. */
  red: number;
}

/** Carl in a pose, 20x20 on clear (255), outlined. */
export function carlPic(col: CarlColors, pose: FlyPose): Pixels {
  const ramps: Record<string, number[]> = { fly: col.fly, eye: col.eye, wing: col.wing, white: [col.white], ink: [col.ink], red: [col.red] };
  const at = (name: string, k: number) => {
    const r = ramps[name];
    if (!r) throw new Error(`carlPic: no ${name} ramp`);
    return r[Math.max(0, Math.min(r.length - 1, k))];
  };
  const pal = { c: at, r: (name: string) => ramps[name] };
  return flyArt(pal as unknown as Parameters<typeof flyArt>[0]).body(pose);
}
