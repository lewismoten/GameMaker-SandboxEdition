// Camera, dimensions and frame timing for the Sandbox logo sting.
import { Camera, V } from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';

export const W = 320;
export const H = 200;
/** FLI speed: 1/70 s ticks per frame (6 = about 12 frames a second). */
export const SPEED = 6;
export const FADE_IN = 5;
/** The shovel's two pats: each starts here and lasts PAT frames, hitting the sand halfway. */
export const PATS = [2, 9];
export const PAT = 8;
/** The nine pieces of -= S A N D B O X =- drop in one after another. */
export const DROP_START = 13;
export const DROP_STAGGER = 2;
export const DROP = 8;
/** SOFTWARE zooms in, flat on top of the render, these scales a frame, then holds. */
export const SOFT_START = 30;
export const SOFT_ZOOM = [0.35, 0.7, 1.1, 1];
export const SWEEP_START = 37; // the highlight crosses the letters
export const SWEEP = 8;
export const SPARKLES: [number, number][] = [
  // frame, piece (S A N D B O X are 1..7)
  [38, 1],
  [41, 4],
  [44, 7],
];
const HOLD_END = 47;
export const FADE = 7;
/** 54 frames, as long as the sting always was, so the walkthroughs' timelines stay put. */
export const FRAMES = HOLD_END + FADE;

export const cam = new Camera([0.35, 2.3, -6.2], [0.1, 1.3, 0.25], 305);

export const WHITE: V = [1, 1, 1];
